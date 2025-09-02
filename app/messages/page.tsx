import {LoggedLayout} from "@/components/layout/logged-layout"
import {ConversationListClient} from "@/components/PrivateMessage/ConversationListClient"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {getServerSession} from "@/auth"
import {profileService} from "@/services"
import {redirect} from "next/navigation"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  const userAndProfile = await profileService.findByUserUid(session.uid)

  if (!userAndProfile) {
    redirect("/login")
  }

  if (!userAndProfile.isActivated) {
    redirect("/login")
  }

  return (
    <LoggedLayout 
      selectedNavigation="messages"
      username={userAndProfile.profile.username}
      avatarUrl={userAndProfile.profile.avatarUrl}
      headerText="Messages"
      navigationHeader={true}
    >
      <div className="container mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversationListClient/>
          </CardContent>
        </Card>
      </div>
    </LoggedLayout>
  )
}