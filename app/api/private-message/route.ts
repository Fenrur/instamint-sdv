import {auth, getSession} from "@/auth"
import {
  cantMessageYourselfProblem,
  invalidBodyProblem,
  invalidContentTypeProblem,
  notAuthenticatedProblem,
  problem,
  profileNotFoundProblem,
  privateProfileNotFollowingProblem,
  replyMessageNotFoundProblem,
  invalidReplyMessageProblem,
  badSessionProblem,
  notActivatedProblem
} from "@/http/problem"
import {
  SendPrivateMessageRequest,
  SendPrivateMessageResponse,
  GetConversationsResponse
} from "@/http/rest/types"
import {privateMessageService, profileService} from "@/services"
import {DateTime} from "luxon"
import {NextResponse} from "next/server"
import {isContentType} from "@/http/content-type"
import {StatusCodes} from "http-status-codes"

export const GET = auth(async (req) => {
  const session = getSession(req)

  if (!session) {
    return problem(notAuthenticatedProblem)
  }

  const userAndProfile = await profileService.findByUserUid(session.uid)
  if (!userAndProfile) {
    return problem(badSessionProblem)
  }

  if (!userAndProfile.isActivated) {
    return problem(notActivatedProblem)
  }

  try {
    const conversations = await privateMessageService.getConversations(userAndProfile.profile.id)
    
    const response: GetConversationsResponse = conversations.map(conv => ({
      otherProfileId: conv.otherProfileId,
      otherProfile: conv.otherProfile,
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount
    }))

    return NextResponse.json(response, {status: StatusCodes.OK})
  } catch (error) {
    console.error("Error getting conversations:", error)
    return problem({
      title: "Internal server error",
      errorCode: 22, // INTERNAL_SERVER_ERROR
      status: StatusCodes.INTERNAL_SERVER_ERROR
    })
  }
})

export const POST = auth(async (req) => {
  const session = getSession(req)

  if (!session) {
    return problem(notAuthenticatedProblem)
  }

  const userAndProfile = await profileService.findByUserUid(session.uid)
  if (!userAndProfile) {
    return problem(badSessionProblem)
  }

  if (!userAndProfile.isActivated) {
    return problem(notActivatedProblem)
  }

  if (!isContentType(req, "json")) {
    return problem(invalidContentTypeProblem)
  }

  try {
    const body = await req.json()
    const parsed = SendPrivateMessageRequest.safeParse(body)

    if (!parsed.success) {
      return problem(invalidBodyProblem)
    }

    const {toUsername, message, replyMessageId} = parsed.data

    // Find target profile by username
    const toProfile = await profileService.findByUsername(toUsername)
    if (!toProfile) {
      return problem(profileNotFoundProblem)
    }

    const result = await privateMessageService.sendMessage(
      userAndProfile.profile.id,
      toProfile.id,
      message,
      DateTime.utc(),
      replyMessageId
    )

    if (result === "cant_message_yourself") {
      return problem(cantMessageYourselfProblem)
    }

    if (result === "profile_not_found") {
      return problem(profileNotFoundProblem)
    }

    if (result === "private_profile_not_following") {
      return problem(privateProfileNotFollowingProblem)
    }

    if (result === "reply_message_not_found") {
      return problem(replyMessageNotFoundProblem)
    }

    if (result === "invalid_reply_message") {
      return problem(invalidReplyMessageProblem)
    }

    // Get the full message with profile data
    const fullMessage = await privateMessageService.getMessage(result.id, userAndProfile.profile.id)
    
    if (!fullMessage || fullMessage === "not_authorized") {
      // eslint-disable-next-line no-console
      console.error("Failed to retrieve sent message:", {
        messageId: result.id,
        requestingProfileId: userAndProfile.profile.id,
        fullMessage
      })
      
      return problem({
        title: "Internal server error",
        // INTERNAL_SERVER_ERROR
        errorCode: 22,
        status: StatusCodes.INTERNAL_SERVER_ERROR
      })
    }

    const response: SendPrivateMessageResponse = {
      id: fullMessage.id,
      fromProfileId: fullMessage.fromProfileId,
      toProfileId: fullMessage.toProfileId,
      message: fullMessage.message,
      sentAt: fullMessage.sentAt,
      replyPrivateMessageId: fullMessage.replyPrivateMessageId,
      fromProfile: fullMessage.fromProfile,
      toProfile: fullMessage.toProfile
    }

    return NextResponse.json(response, {status: StatusCodes.CREATED})
  } catch (error) {
    console.error("Error sending private message:", error)
    return problem({
      title: "Internal server error",
      errorCode: 22, // INTERNAL_SERVER_ERROR
      status: StatusCodes.INTERNAL_SERVER_ERROR
    })
  }
})