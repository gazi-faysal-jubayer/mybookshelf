"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "@/lib/utils"

interface Conversation {
    id: string
    title?: string
    is_group: boolean
    otherUser?: any
    lastMessage?: {
        content: string
        created_at: string
        sender?: any
    } | null
    unreadCount: number
}

interface ConversationListProps {
    conversations: any[]
}

export function ConversationList({ conversations }: ConversationListProps) {
    const pathname = usePathname()

    return (
        <ScrollArea className="h-full">
            <div className="divide-y">
                {conversations.map((conversation) => {
                    const isActive = pathname === `/dashboard/messages/${conversation.id}`
                    const displayName = conversation.is_group 
                        ? conversation.title || "Group Chat"
                        : conversation.otherUser?.full_name || 
                          conversation.otherUser?.username || 
                          "Unknown User"
                    
                    const profilePic = !conversation.is_group 
                        ? conversation.otherUser?.profile_picture 
                        : undefined

                    return (
                        <Link
                            key={conversation.id}
                            href={`/dashboard/messages/${conversation.id}`}
                            className={cn(
                                "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors",
                                isActive && "bg-muted"
                            )}
                        >
                            {/* Avatar */}
                            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                {profilePic ? (
                                    <Image
                                        src={profilePic}
                                        alt={displayName}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-medium">
                                        {displayName[0].toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={cn(
                                        "font-medium truncate",
                                        conversation.unreadCount > 0 && "font-semibold"
                                    )}>
                                        {displayName}
                                    </p>
                                    {conversation.lastMessage && (
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                            {formatDistanceToNow(new Date(conversation.lastMessage.created_at))}
                                        </span>
                                    )}
                                </div>
                                {conversation.lastMessage && (
                                    <p className={cn(
                                        "text-sm truncate",
                                        conversation.unreadCount > 0 
                                            ? "text-foreground" 
                                            : "text-muted-foreground"
                                    )}>
                                        {conversation.lastMessage.content}
                                    </p>
                                )}
                            </div>

                            {/* Unread Badge */}
                            {conversation.unreadCount > 0 && (
                                <Badge 
                                    variant="default" 
                                    className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0"
                                >
                                    {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                                </Badge>
                            )}
                        </Link>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
