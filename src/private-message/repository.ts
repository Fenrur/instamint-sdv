import {PgClient} from "@/db/db-client"
import {PrivateMessageTable, ProfileTable} from "@/db/schema"
import {DateTime} from "luxon"
import {and, desc, eq, or} from "drizzle-orm"

export interface PrivateMessageWithProfile {
  id: number
  fromProfileId: number
  toProfileId: number
  message: string
  sentAt: string
  replyPrivateMessageId: number | null
  fromProfile: {
    id: number
    username: string
    displayName: string
    avatarUrl: string
  }
  toProfile: {
    id: number
    username: string
    displayName: string
    avatarUrl: string
  }
}

export interface ConversationSummary {
  otherProfileId: number
  otherProfile: {
    id: number
    username: string
    displayName: string
    avatarUrl: string
  }
  lastMessage: {
    id: number
    message: string
    sentAt: string
    fromProfileId: number
  }
  unreadCount: number
}

export class PrivateMessagePgRepository {
  private readonly pgClient: PgClient

  constructor(pgClient: PgClient) {
    this.pgClient = pgClient
  }

  public create(fromProfileId: number, toProfileId: number, message: string, sentAt: DateTime<true>, replyPrivateMessageId?: number) {
    return this.pgClient
      .insert(PrivateMessageTable)
      .values({
        fromProfileId,
        toProfileId,
        message,
        sentAt: sentAt.toSQL({includeZone: false, includeOffset: false}),
        replyPrivateMessageId: replyPrivateMessageId || null
      })
      .returning()
  }

  public async getConversationMessages(profileId1: number, profileId2: number, limit: number = 50, offset: number = 0): Promise<PrivateMessageWithProfile[]> {
    const result = await this.pgClient
      .select({
        id: PrivateMessageTable.id,
        fromProfileId: PrivateMessageTable.fromProfileId,
        toProfileId: PrivateMessageTable.toProfileId,
        message: PrivateMessageTable.message,
        sentAt: PrivateMessageTable.sentAt,
        replyPrivateMessageId: PrivateMessageTable.replyPrivateMessageId,
        fromProfile: {
          id: ProfileTable.id,
          username: ProfileTable.username,
          displayName: ProfileTable.displayName,
          avatarUrl: ProfileTable.avatarUrl
        }
      })
      .from(PrivateMessageTable)
      .innerJoin(ProfileTable, eq(PrivateMessageTable.fromProfileId, ProfileTable.id))
      .where(
        or(
          and(
            eq(PrivateMessageTable.fromProfileId, profileId1),
            eq(PrivateMessageTable.toProfileId, profileId2)
          ),
          and(
            eq(PrivateMessageTable.fromProfileId, profileId2),
            eq(PrivateMessageTable.toProfileId, profileId1)
          )
        )
      )
      .orderBy(desc(PrivateMessageTable.sentAt))
      .limit(limit)
      .offset(offset)

    // Add toProfile information for each message
    return await Promise.all(result.map(async (message) => {
      const toProfile = await this.pgClient.query.ProfileTable.findFirst({
        where: eq(ProfileTable.id, message.toProfileId),
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      })

      return {
        ...message,
        toProfile: toProfile as {
          id: number
          username: string
          displayName: string
          avatarUrl: string
        }
      }
    }))
  }

  public async getConversations(profileId: number, limit: number = 20): Promise<ConversationSummary[]> {
    // Get all unique conversations for this user
    const conversations = await this.pgClient
      .selectDistinctOn([PrivateMessageTable.fromProfileId, PrivateMessageTable.toProfileId], {
        fromProfileId: PrivateMessageTable.fromProfileId,
        toProfileId: PrivateMessageTable.toProfileId,
        lastMessageId: PrivateMessageTable.id,
        lastMessage: PrivateMessageTable.message,
        lastSentAt: PrivateMessageTable.sentAt
      })
      .from(PrivateMessageTable)
      .where(
        or(
          eq(PrivateMessageTable.fromProfileId, profileId),
          eq(PrivateMessageTable.toProfileId, profileId)
        )
      )
      .orderBy(PrivateMessageTable.fromProfileId, PrivateMessageTable.toProfileId, desc(PrivateMessageTable.sentAt))
      .limit(limit)

    // Transform into conversation summaries
    const summaries: ConversationSummary[] = []
    const processedPairs = new Set<string>()

    for (const conv of conversations) {
      const otherProfileId = conv.fromProfileId === profileId ? conv.toProfileId : conv.fromProfileId
      const pairKey = [profileId, otherProfileId].sort().join("-")
      
      if (processedPairs.has(pairKey)) {
        continue
      }
      processedPairs.add(pairKey)

      const otherProfile = await this.pgClient.query.ProfileTable.findFirst({
        where: eq(ProfileTable.id, otherProfileId),
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      })

      if (otherProfile) {
        summaries.push({
          otherProfileId,
          otherProfile,
          lastMessage: {
            id: conv.lastMessageId,
            message: conv.lastMessage,
            sentAt: conv.lastSentAt,
            fromProfileId: conv.fromProfileId
          },
          // TODO: Implement read status tracking
          unreadCount: 0
        })
      }
    }

    return summaries.sort((a, b) => 
      new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime()
    )
  }

  public async getMessage(messageId: number): Promise<PrivateMessageWithProfile | null> {
    const result = await this.pgClient
      .select({
        id: PrivateMessageTable.id,
        fromProfileId: PrivateMessageTable.fromProfileId,
        toProfileId: PrivateMessageTable.toProfileId,
        message: PrivateMessageTable.message,
        sentAt: PrivateMessageTable.sentAt,
        replyPrivateMessageId: PrivateMessageTable.replyPrivateMessageId,
        fromProfile: {
          id: ProfileTable.id,
          username: ProfileTable.username,
          displayName: ProfileTable.displayName,
          avatarUrl: ProfileTable.avatarUrl
        }
      })
      .from(PrivateMessageTable)
      .innerJoin(ProfileTable, eq(PrivateMessageTable.fromProfileId, ProfileTable.id))
      .where(eq(PrivateMessageTable.id, messageId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const message = result[0]
    const toProfile = await this.pgClient.query.ProfileTable.findFirst({
      where: eq(ProfileTable.id, message.toProfileId),
      columns: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true
      }
    })

    return {
      ...message,
      toProfile: toProfile as {
        id: number
        username: string
        displayName: string
        avatarUrl: string
      }
    }
  }
}