import {LoggedLayout} from "@/components/layout/logged-layout"
import {MessageThread} from "@/components/PrivateMessage/MessageThread"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {BackToMessagesButton} from "@/components/PrivateMessage/BackToMessagesButton"
import {getServerSession} from "@/auth"
import {profileService} from "@/services"
import {redirect} from "next/navigation"

export const dynamic = "force-dynamic"

interface ConversationPageProps {
  params: {
    username: string
  }
}

export default async function ConversationPage({params}: ConversationPageProps) {
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

  const targetProfile = await profileService.findByUsername(params.username)

  if (!targetProfile) {
    redirect("/messages")
  }

  return (
    <LoggedLayout 
      selectedNavigation="messages"
      username={userAndProfile.profile.username}
      avatarUrl={userAndProfile.profile.avatarUrl}
      headerText="Conversation"
      navigationHeader={true}
    >
      <div className="container mx-auto max-w-4xl p-6">
        <Card className="min-h-[600px]">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <BackToMessagesButton/>
              <h2 className="text-xl font-semibold">Conversation</h2>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MessageThread username={params.username}/>
          </CardContent>
        </Card>
      </div>
    </LoggedLayout>
  )
}