import {PgClient} from "@/db/db-client"
import {DateTime} from "luxon"
import {PrivateMessagePgRepository, ConversationSummary, PrivateMessageWithProfile} from "@/private-message/repository"
import {ProfilePgRepository} from "@/profile/repository"
import {FollowPgRepository} from "@/follow/repository"

export type MessagePermissionResult = "allowed" | "profile_not_found" | "private_profile_not_following" | "cant_message_yourself"

export class DefaultPrivateMessageService {
  private readonly privateMessagePgRepository: PrivateMessagePgRepository
  private readonly profilePgRepository: ProfilePgRepository
  private readonly followPgRepository: FollowPgRepository
  private readonly pgClient: PgClient
  private readonly messagesPageSize: number

  constructor(pgClient: PgClient, messagesPageSize: number) {
    this.privateMessagePgRepository = new PrivateMessagePgRepository(pgClient)
    this.profilePgRepository = new ProfilePgRepository(pgClient)
    this.followPgRepository = new FollowPgRepository(pgClient)
    this.pgClient = pgClient
    this.messagesPageSize = messagesPageSize
  }

  public async checkMessagePermission(fromProfileId: number, toProfileId: number): Promise<MessagePermissionResult> {
    if (fromProfileId === toProfileId) {
      return "cant_message_yourself"
    }

    const toProfile = await this.profilePgRepository.findById(toProfileId)
    if (!toProfile) {
      return "profile_not_found"
    }

    // If the target profile is private, check if they're following each other
    if (toProfile.visibilityType === "private") {
      const following = await this.followPgRepository.get(fromProfileId, toProfileId)
      const followingBack = await this.followPgRepository.get(toProfileId, fromProfileId)
      
      if (!following && !followingBack) {
        return "private_profile_not_following"
      }
    }

    return "allowed"
  }

  public async sendMessage(
    fromProfileId: number, 
    toProfileId: number, 
    message: string, 
    sentAt: DateTime<true>,
    replyPrivateMessageId?: number
  ) {
    const permission = await this.checkMessagePermission(fromProfileId, toProfileId)
    if (permission !== "allowed") {
      return permission
    }

    // Validate reply message exists and is part of this conversation
    if (replyPrivateMessageId) {
      const replyMessage = await this.privateMessagePgRepository.getMessage(replyPrivateMessageId)
      if (!replyMessage) {
        return "reply_message_not_found"
      }
      
      // Check if reply message is part of this conversation
      const isPartOfConversation = (
        (replyMessage.fromProfileId === fromProfileId && replyMessage.toProfileId === toProfileId) ||
        (replyMessage.fromProfileId === toProfileId && replyMessage.toProfileId === fromProfileId)
      )
      
      if (!isPartOfConversation) {
        return "invalid_reply_message"
      }
    }

    const result = await this.privateMessagePgRepository.create(
      fromProfileId,
      toProfileId,
      message,
      sentAt,
      replyPrivateMessageId
    )

    return result[0]
  }

  public async getConversationMessages(
    requestingProfileId: number,
    otherProfileId: number,
    page: number = 0
  ): Promise<{messages: PrivateMessageWithProfile[], hasMore: boolean} | MessagePermissionResult> {
    const permission = await this.checkMessagePermission(requestingProfileId, otherProfileId)
    if (permission !== "allowed") {
      return permission
    }

    const offset = page * this.messagesPageSize
    const messages = await this.privateMessagePgRepository.getConversationMessages(
      requestingProfileId,
      otherProfileId,
      this.messagesPageSize + 1, // Get one extra to check if there are more
      offset
    )

    const hasMore = messages.length > this.messagesPageSize
    if (hasMore) {
      messages.pop() // Remove the extra message
    }

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore
    }
  }

  public async getConversations(profileId: number): Promise<ConversationSummary[]> {
    return await this.privateMessagePgRepository.getConversations(profileId)
  }

  public async getMessage(messageId: number, requestingProfileId: number): Promise<PrivateMessageWithProfile | null | "not_authorized"> {
    const message = await this.privateMessagePgRepository.getMessage(messageId)
    if (!message) {
      return null
    }

    // Check if the requesting user is part of this conversation
    if (message.fromProfileId !== requestingProfileId && message.toProfileId !== requestingProfileId) {
      return "not_authorized"
    }

    return message
  }
}