"use client"

import {ConversationList} from "@/components/PrivateMessage/ConversationList"
import {NewMessageDialog} from "@/components/PrivateMessage/NewMessageDialog"
import {Button} from "@/components/ui/button"
import {PlusIcon} from "lucide-react"
import {useState} from "react"

export function ConversationListClient() {
  const [showNewMessage, setShowNewMessage] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Your Conversations</h3>
        <Button onClick={() => {
          setShowNewMessage(true)
        }}>
          <PlusIcon className="mr-2 h-4 w-4"/>
          New Message
        </Button>
      </div>
      <ConversationList/>
      <NewMessageDialog
        open={showNewMessage}
        onOpenChange={setShowNewMessage}
      />
    </>
  )
}