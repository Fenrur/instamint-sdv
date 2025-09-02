"use client"

import {useGetConversations} from "@/repository/hooks"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Skeleton} from "@/components/ui/skeleton"
import {formatDistanceToNow} from "date-fns"
import {MessageSquareIcon} from "lucide-react"
import Link from "next/link"
import {GetConversationsResponse} from "@/http/rest/types"

export function ConversationList() {
  const {conversations, errorConversations} = useGetConversations()

  if (errorConversations) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageSquareIcon className="h-12 w-12 text-muted-foreground mb-4"/>
        <h3 className="text-lg font-medium mb-2">Unable to load conversations</h3>
        <p className="text-sm text-muted-foreground">
          {typeof errorConversations === "string" 
            ? `Error: ${errorConversations}` 
            : "Something went wrong. Please try again."}
        </p>
      </div>
    )
  }

  if (!conversations) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full"/>
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32"/>
              <Skeleton className="h-3 w-48"/>
            </div>
            <Skeleton className="h-3 w-12"/>
          </div>
        ))}
      </div>
    )
  }

  if (typeof conversations === "string") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageSquareIcon className="h-12 w-12 text-muted-foreground mb-4"/>
        <h3 className="text-lg font-medium mb-2">Unable to load conversations</h3>
        <p className="text-sm text-muted-foreground">Error: {conversations}</p>
      </div>
    )
  }

  const conversationData = conversations as GetConversationsResponse

  if (conversationData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageSquareIcon className="h-12 w-12 text-muted-foreground mb-4"/>
        <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start a new conversation with someone!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversationData.map((conversation) => (
        <Button
          key={conversation.otherProfileId}
          variant="ghost"
          asChild
          className="w-full p-3 h-auto justify-start hover:bg-muted/50"
        >
          <Link href={`/messages/${conversation.otherProfile.username}`}>
            <div className="flex items-center space-x-3 w-full">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={conversation.otherProfile.avatarUrl}
                  alt={conversation.otherProfile.displayName}
                />
                <AvatarFallback>
                  {conversation.otherProfile.displayName?.charAt(0) || 
                   conversation.otherProfile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium truncate">
                    {conversation.otherProfile.displayName || conversation.otherProfile.username}
                  </h4>
                  <div className="flex items-center space-x-2 shrink-0">
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.lastMessage.sentAt), {addSuffix: true})}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage.message}
                </p>
              </div>
            </div>
          </Link>
        </Button>
      ))}
    </div>
  )
}