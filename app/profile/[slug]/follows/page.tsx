import {GenericFollowsProfilePage} from "../../generic-follows-page"
import {getServerSession} from "@/auth"
import {redirect} from "next/navigation"
import {createRedirectQueryParam} from "@/utils/url"
import {profileService} from "@/services"

interface FollowsProfilePageProps {
  params: {
    slug: string
  }
}

export default async function FollowsProfilePage(props: FollowsProfilePageProps) {
  const session = await getServerSession()

  if (!session) {
    console.log("CACA")
    redirect(`/login${createRedirectQueryParam(`/profile/${props.params.slug}/follows`)}`)
  }

  const userAndProfile = await profileService.findByUserUid(session.uid)

  if (!userAndProfile) {
    console.log("PIPI")
    redirect(`/login${createRedirectQueryParam(`/profile/${props.params.slug}/follows`)}`)
  }

  if (userAndProfile.profile.username.toLowerCase() === props.params.slug) {
    redirect("/me/follows")
  }

  return (
    <GenericFollowsProfilePage
      type={{onProfile: "other", section: "follows"}}
      username={props.params.slug}
    />
  )
}
