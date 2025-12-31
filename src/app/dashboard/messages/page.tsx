import { Suspense } from "react"
import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getConversations, getTotalUnreadCount } from "@/app/actions/messaging"
import { ConversationList } from "./conversation-list"
import { EmptyMessages } from "./empty-messages"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"

export default async function MessagesPage() {
    const user = await getUser()
    if (!user) redirect("/login")

    return (
        <div className="h-[calc(100vh-12rem)]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                    <p className="text-muted-foreground mt-1">
                        Chat with book owners and borrowers
                    </p>
                </div>
            </div>

            <Suspense fallback={<ConversationListSkeleton />}>
                <ConversationsContainer />
            </Suspense>
        </div>
    )
}

async function ConversationsContainer() {
    const conversations = await getConversations()

    if (conversations.length === 0) {
        return <EmptyMessages />
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {/* Conversation List */}
            <div className="md:col-span-1 border rounded-lg overflow-hidden">
                <ConversationList conversations={conversations} />
            </div>

            {/* Chat Area - Select a conversation prompt */}
            <div className="hidden md:flex md:col-span-2 border rounded-lg items-center justify-center bg-muted/30">
                <div className="text-center space-y-2">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                        Select a conversation to start messaging
                    </p>
                </div>
            </div>
        </div>
    )
}

function ConversationListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            <div className="md:col-span-1 border rounded-lg p-4 space-y-4">
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
            <div className="hidden md:block md:col-span-2 border rounded-lg" />
        </div>
    )
}
