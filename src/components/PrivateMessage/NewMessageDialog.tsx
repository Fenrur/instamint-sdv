"use client"

import {useState} from "react"
import {useRouter} from "next/navigation"
import {useSendPrivateMessage} from "@/repository/hooks"
import {Button} from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {Loader2Icon} from "lucide-react"

interface NewMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewMessageDialog({open, onOpenChange}: NewMessageDialogProps) {
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const {sendMessage, isSendingMessage} = useSendPrivateMessage()

  const handleSendMessage = async () => {
    if (!username.trim() || !message.trim()) {
      setError("Please fill in both username and message")
      return
    }

    setError(null)

    const result = await sendMessage({
      toUsername: username.trim(),
      message: message.trim()
    })

    if (result && typeof result !== "string") {
      // Message sent successfully, redirect to conversation
      onOpenChange(false)
      setUsername("")
      setMessage("")
      router.push(`/messages/${result.toProfile.username}`)
    } else if (typeof result === "string") {
      // Handle different error types
      switch (result) {
        case "profile_not_found":
          setError("User not found. Please check the username.")
          break
        case "cant_message_yourself":
          setError("You cannot send a message to yourself.")
          break
        case "private_profile_not_following":
          setError("This user has a private profile. You need to follow each other to send messages.")
          break
        case "not_authenticated":
          setError("You need to be logged in to send messages.")
          break
        case "invalid_body":
          setError("Invalid message content. Please check your input.")
          break
        case "internal_server_error":
          setError("An internal server error occurred. Please try again.")
          break
        default:
          setError(`Error: ${result}`)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="username">To (username)</Label>
            <Input
              id="username"
              placeholder="Enter username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSendingMessage}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSendingMessage}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Press Ctrl+Enter to send
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSendingMessage}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!username.trim() || !message.trim() || isSendingMessage}
          >
            {isSendingMessage && <Loader2Icon className="mr-2 h-4 w-4 animate-spin"/>}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}