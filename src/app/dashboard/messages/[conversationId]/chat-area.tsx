"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { sendMessage, markConversationRead } from "@/app/actions/messaging"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatDistanceToNow } from "@/lib/utils"
import { ArrowLeft, Send, Loader2 } from "lucide-react"

interface Message {
    id: string
    content: string
    message_type: string
    created_at: string
    sender: any
}

interface ChatAreaProps {
    conversationId: string
    conversation: any
    initialMessages: any[]
    currentUserId: string
    hasMore: boolean
}

export function ChatArea({
    conversationId,
    conversation,
    initialMessages,
    currentUserId,
    hasMore
}: ChatAreaProps) {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState("")
    const [isSending, startTransition] = useTransition()
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const displayName = conversation.is_group
        ? conversation.title || "Group Chat"
        : conversation.otherUser?.full_name ||
          conversation.otherUser?.username ||
          "Unknown User"

    const profilePic = !conversation.is_group
        ? conversation.otherUser?.profile_picture
        : undefined

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Mark as read on mount
    useEffect(() => {
        markConversationRead(conversationId)
    }, [conversationId])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isSending) return

        const content = newMessage.trim()
        setNewMessage("")

        // Optimistic update
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            content,
            message_type: "text",
            created_at: new Date().toISOString(),
            sender: {
                id: currentUserId,
                full_name: "You"
            }
        }
        setMessages(prev => [...prev, optimisticMessage])

        startTransition(async () => {
            try {
                const realMessage = await sendMessage({
                    conversationId,
                    content,
                    messageType: "text"
                })

                // Replace optimistic with real
                setMessages(prev =>
                    prev.map(m =>
                        m.id === optimisticMessage.id ? { ...realMessage, sender: m.sender } : m
                    )
                )
            } catch {
                // Remove optimistic message on error
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
            }
        })

        inputRef.current?.focus()
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3 bg-background">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => router.push("/dashboard/messages")}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <Link
                    href={conversation.otherUser ? `/dashboard/users/${conversation.otherUser.id}` : "#"}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                        {profilePic ? (
                            <Image
                                src={profilePic}
                                alt={displayName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-medium">
                                {displayName[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-medium">{displayName}</p>
                    </div>
                </Link>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message, index) => {
                        const isOwn = message.sender.id === currentUserId
                        const showAvatar =
                            !isOwn &&
                            (index === 0 || messages[index - 1]?.sender.id !== message.sender.id)

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-2",
                                    isOwn ? "justify-end" : "justify-start"
                                )}
                            >
                                {!isOwn && showAvatar && (
                                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                        {message.sender.profile_picture ? (
                                            <Image
                                                src={message.sender.profile_picture}
                                                alt={message.sender.full_name || message.sender.username || ""}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                                                {(message.sender.full_name || message.sender.username || "U")[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

                                <div
                                    className={cn(
                                        "max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2",
                                        isOwn
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-xs mt-1",
                                            isOwn
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {formatDistanceToNow(new Date(message.created_at))}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t bg-background">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isSending}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={!newMessage.trim() || isSending}>
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
