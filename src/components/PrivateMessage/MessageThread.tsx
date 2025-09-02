"use client"

import {useGetConversationMessages, useGetProfileData, useSendPrivateMessage} from "@/repository/hooks"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Skeleton} from "@/components/ui/skeleton"
import {Textarea} from "@/components/ui/textarea"
import {cn} from "@/lib/utils"
import {format, formatDistanceToNow, isToday, isYesterday} from "date-fns"
import {ReplyIcon, SendIcon} from "lucide-react"
import {useState, useEffect, useRef} from "react"
import {GetConversationMessagesResponse, PrivateMessageElement} from "@/http/rest/types"

interface MessageThreadProps {
  username: string
}

export function MessageThread({username}: MessageThreadProps) {
  const [message, setMessage] = useState("")
  const [replyingTo, setReplyingTo] = useState<PrivateMessageElement | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const {profileData} = useGetProfileData()
  const {messages, messagesMutate, errorMessages} = useGetConversationMessages(username)
  const {sendMessage, isSendingMessage, errorSendMessage} = useSendPrivateMessage()

  // Find the other profile from messages to show in header
  const otherProfile = messages && typeof messages !== "string" && messages.messages.length > 0
    ? messages.messages[0].fromProfileId === profileData?.id
      ? messages.messages[0].toProfile
      : messages.messages[0].fromProfile
    : null

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || !otherProfile) return

    const result = await sendMessage({
      toUsername: otherProfile.username,
      message: message.trim(),
      replyMessageId: replyingTo?.id
    })

    if (result && typeof result !== "string") {
      setMessage("")
      setReplyingTo(null)
      void messagesMutate()
      scrollToBottom()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) {
      return format(date, "HH:mm")
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`
    } else {
      return format(date, "MMM d, HH:mm")
    }
  }

  if (errorMessages) {
    return (
      <div className="flex items-center justify-center h-96 p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Unable to load messages</h3>
          <p className="text-sm text-muted-foreground">
            {typeof errorMessages === "string" 
              ? `Error: ${errorMessages}` 
              : "Something went wrong. Please try again."}
          </p>
        </div>
      </div>
    )
  }

  if (!messages) {
    return (
      <div className="flex flex-col h-96">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full"/>
            <Skeleton className="h-5 w-32"/>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-2">
              <Skeleton className="h-6 w-6 rounded-full"/>
              <Skeleton className="h-12 w-64 rounded-lg"/>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (typeof messages === "string") {
    return (
      <div className="flex items-center justify-center h-96 p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Unable to load messages</h3>
          <p className="text-sm text-muted-foreground">Error: {messages}</p>
        </div>
      </div>
    )
  }

  const conversationData = messages as GetConversationMessagesResponse

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      {otherProfile && (
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={otherProfile.avatarUrl}
                alt={otherProfile.displayName}
              />
              <AvatarFallback>
                {otherProfile.displayName?.charAt(0) || 
                 otherProfile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {otherProfile.displayName || otherProfile.username}
              </h3>
              {otherProfile.displayName && (
                <p className="text-sm text-muted-foreground">@{otherProfile.username}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {conversationData.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversationData.messages.map((msg) => {
              const isOwnMessage = msg.fromProfileId === profileData?.id
              const profile = isOwnMessage ? msg.fromProfile : msg.toProfile

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-end space-x-2",
                    isOwnMessage && "flex-row-reverse space-x-reverse"
                  )}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={profile.avatarUrl} alt={profile.displayName}/>
                    <AvatarFallback className="text-xs">
                      {profile.displayName?.charAt(0) || profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn(
                    "group relative max-w-xs lg:max-w-md",
                    isOwnMessage ? "ml-auto" : "mr-auto"
                  )}>
                    {msg.replyPrivateMessageId && (
                      <div className="mb-1 p-2 border-l-2 border-muted bg-muted/30 rounded text-xs text-muted-foreground">
                        Replying to previous message
                      </div>
                    )}

                    <div className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    <div className={cn(
                      "flex items-center mt-1 space-x-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                      isOwnMessage && "flex-row-reverse space-x-reverse"
                    )}>
                      <span>{formatMessageDate(msg.sentAt)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                        onClick={() => setReplyingTo(msg)}
                      >
                        <ReplyIcon className="h-3 w-3"/>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Replying to: {replyingTo.message.substring(0, 50)}
              {replyingTo.message.length > 50 && "..."}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSendingMessage}
            className="min-h-[44px] max-h-32 resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSendingMessage}
            className="shrink-0"
          >
            <SendIcon className="h-4 w-4"/>
          </Button>
        </div>
        {errorSendMessage && (
          <p className="text-sm text-destructive mt-2">
            {typeof errorSendMessage === "string" 
              ? `Error: ${errorSendMessage}` 
              : "Failed to send message. Please try again."}
          </p>
        )}
      </div>
    </div>
  )
}