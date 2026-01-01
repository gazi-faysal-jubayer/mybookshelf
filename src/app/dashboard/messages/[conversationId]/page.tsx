import { Suspense } from "react"
import { getUser } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getConversations, getMessages } from "@/app/actions/messaging"
import { ConversationList } from "../conversation-list"
import { ChatArea } from "./chat-area"
import { Skeleton } from "@/components/ui/skeleton"

interface ChatPageProps {
    params: Promise<{ conversationId: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
    const user = await getUser()
    if (!user) redirect("/login")

    const { conversationId } = await params

    return (
        <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {/* Conversation List - hidden on mobile when viewing chat */}
                <div className="hidden md:block md:col-span-1 border rounded-lg overflow-hidden">
                    <Suspense fallback={<ConversationListSkeleton />}>
                        <ConversationListContainer />
                    </Suspense>
                </div>

                {/* Chat Area */}
                <div className="col-span-1 md:col-span-2 border rounded-lg overflow-hidden flex flex-col">
                    <Suspense fallback={<ChatAreaSkeleton />}>
                        <ChatContainer conversationId={conversationId} userId={user.id} />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

async function ConversationListContainer() {
    const conversations = await getConversations()
    return <ConversationList conversations={conversations} />
}

async function ChatContainer({ 
    conversationId, 
    userId 
}: { 
    conversationId: string
    userId: string 
}) {
    try {
        const conversations = await getConversations()
        const conversation = conversations.find(c => c.id === conversationId)
        
        if (!conversation) {
            notFound()
        }

        const { messages, hasMore } = await getMessages(conversationId)

        return (
            <ChatArea 
                conversationId={conversationId}
                conversation={conversation}
                initialMessages={messages}
                currentUserId={userId}
                hasMore={hasMore}
            />
        )
    } catch {
        notFound()
    }
}

function ConversationListSkeleton() {
    return (
        <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function ChatAreaSkeleton() {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-4">
                <div className="flex justify-start">
                    <Skeleton className="h-10 w-48 rounded-lg" />
                </div>
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-36 rounded-lg" />
                </div>
                <div className="flex justify-start">
                    <Skeleton className="h-16 w-56 rounded-lg" />
                </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t">
                <Skeleton className="h-10 w-full rounded-lg" />
            </div>
        </div>
    )
}
