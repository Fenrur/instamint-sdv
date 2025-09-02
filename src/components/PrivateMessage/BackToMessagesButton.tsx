"use client"

import {Button} from "@/components/ui/button"
import {ArrowLeftIcon} from "lucide-react"
import {useRouter} from "next/navigation"

export function BackToMessagesButton() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        router.push("/messages")
      }}
    >
      <ArrowLeftIcon className="h-4 w-4"/>
    </Button>
  )
}