"use client"

import { PromptBox } from "@/components/ui/chatgpt-prompt-input"
import { SessionNavBar } from "@/components/ui/sidebar"

export default function ChatPage() {
  const handleSubmit = (event: any) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const message = formData.get("message")
    if (!message && !event.currentTarget.querySelector("img")) {
      return
    }
    alert(`Message Submitted!`)
  }

  return (
    <div className="flex h-screen w-full bg-[#1a1a1a]">
      <SessionNavBar />
      <main className="flex h-full flex-1 flex-col items-center justify-center pl-[3.05rem]">
        <div className="w-full max-w-xl flex flex-col gap-10">
          <p className="text-center text-3xl text-white">How Can I Help You</p>
          <form onSubmit={handleSubmit}>
            <PromptBox name="message" />
          </form>
        </div>
      </main>
    </div>
  )
}
