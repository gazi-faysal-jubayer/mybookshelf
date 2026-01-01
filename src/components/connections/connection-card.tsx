"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { FriendRequestButton } from "./friend-request-button"
import { FollowButton } from "./follow-button"
import Link from "next/link"

interface ConnectionCardProps {
    user: {
        id: string
        full_name?: string
        username: string
        profile_picture?: string
        bio?: string
    }
    connectionStatus?: {
        isFriend: boolean
        isPending: boolean
        isRequested: boolean
        isFollowing: boolean
    }
    showActions?: boolean
}

export function ConnectionCard({ user, connectionStatus, showActions = true }: ConnectionCardProps) {
    const initials = user.full_name
        ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
        : user.username.slice(0, 2).toUpperCase()

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Link href={`/dashboard/users/${user.id}`}>
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user.profile_picture} alt={user.full_name || user.username} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link href={`/dashboard/users/${user.id}`} className="hover:underline">
                            <h4 className="font-medium truncate">
                                {user.full_name || user.username}
                            </h4>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">
                            @{user.username}
                        </p>
                        {user.bio && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {user.bio}
                            </p>
                        )}
                    </div>
                </div>
                {showActions && connectionStatus && (
                    <div className="flex items-center gap-2 mt-4">
                        <FriendRequestButton
                            userId={user.id}
                            initialStatus={{
                                isFriend: connectionStatus.isFriend,
                                isPending: connectionStatus.isPending,
                                isRequested: connectionStatus.isRequested,
                            }}
                        />
                        <FollowButton
                            userId={user.id}
                            initialIsFollowing={connectionStatus.isFollowing}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
