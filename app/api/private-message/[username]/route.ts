import {auth, getSession} from "@/auth"
import {
  cantMessageYourselfProblem,
  invalidQueryParameterProblem,
  notAuthenticatedProblem,
  problem,
  profileNotFoundProblem,
  privateProfileNotFollowingProblem,
  badSessionProblem,
  notActivatedProblem
} from "@/http/problem"
import {GetConversationMessagesResponse} from "@/http/rest/types"
import {privateMessageService, profileService} from "@/services"
import {NextResponse} from "next/server"
import {StatusCodes} from "http-status-codes"

export const GET = auth(async (req, {params}: {params: {username: string}}) => {
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
    const username = params.username as string
    if (!username) {
      return problem(invalidQueryParameterProblem)
    }

    const targetProfile = await profileService.findByUsername(username)
    if (!targetProfile) {
      return problem(profileNotFoundProblem)
    }

    // Get page parameter from URL
    const url = new URL(req.url)
    const pageParam = url.searchParams.get("page")
    const page = pageParam ? parseInt(pageParam, 10) : 0

    if (pageParam && (isNaN(page) || page < 0)) {
      return problem(invalidQueryParameterProblem)
    }

    const result = await privateMessageService.getConversationMessages(
      userAndProfile.profile.id,
      targetProfile.id,
      page
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

    const response: GetConversationMessagesResponse = {
      messages: result.messages.map(msg => ({
        id: msg.id,
        fromProfileId: msg.fromProfileId,
        toProfileId: msg.toProfileId,
        message: msg.message,
        sentAt: msg.sentAt,
        replyPrivateMessageId: msg.replyPrivateMessageId,
        fromProfile: msg.fromProfile,
        toProfile: msg.toProfile
      })),
      hasMore: result.hasMore
    }

    return NextResponse.json(response, {status: StatusCodes.OK})
  } catch (error) {
    console.error("Error getting conversation messages:", error)
    return problem({
      title: "Internal server error",
      errorCode: 22, // INTERNAL_SERVER_ERROR
      status: StatusCodes.INTERNAL_SERVER_ERROR
    })
  }
})