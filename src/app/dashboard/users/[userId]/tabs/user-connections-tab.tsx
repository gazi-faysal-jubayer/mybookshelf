"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCheck, Users } from "lucide-react"

interface UserConnectionsTabProps {
    userId: string
}

interface UserConnection {
    id: string
    username?: string
    full_name?: string
    profile_picture?: string
    city?: string
}

export function UserConnectionsTab({ userId }: UserConnectionsTabProps) {
    const [activeTab, setActiveTab] = useState("friends")
    const [friends, setFriends] = useState<UserConnection[]>([])
    const [followers, setFollowers] = useState<UserConnection[]>([])
    const [following, setFollowing] = useState<UserConnection[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchConnections() {
            setLoading(true)
            const supabase = createClient()

            // Fetch friends (accepted friendships)
            const { data: friendships } = await supabase
                .from('friendships')
                .select(`
                    requester_id,
                    addressee_id,
                    requester:requester_id (id, username, full_name, profile_picture, city),
                    addressee:addressee_id (id, username, full_name, profile_picture, city)
                `)
                .eq('status', 'accepted')
                .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

            const friendsList = (friendships as any[])?.map(f => {
                const friend = f.requester?.id === userId 
                    ? f.addressee 
                    : f.requester
                return friend as UserConnection
            }).filter(Boolean) || []

            setFriends(friendsList)

            // Fetch followers
            const { data: followersData } = await supabase
                .from('follows')
                .select(`
                    follower:follower_id (id, username, full_name, profile_picture, city)
                `)
                .eq('following_id', userId)

            setFollowers((followersData as any[])?.map(f => f.follower as UserConnection) || [])

            // Fetch following
            const { data: followingData } = await supabase
                .from('follows')
                .select(`
                    following:following_id (id, username, full_name, profile_picture, city)
                `)
                .eq('follower_id', userId)

            setFollowing((followingData as any[])?.map(f => f.following as UserConnection) || [])

            setLoading(false)
        }

        fetchConnections()
    }, [userId])

    const renderUserList = (users: UserConnection[], emptyMessage: string) => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
        }

        if (users.length === 0) {
            return (
                <div className="text-center py-12 text-muted-foreground">
                    {emptyMessage}
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users.map((user) => (
                    <Link key={user.id} href={`/dashboard/users/${user.id}`}>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                                    {user.profile_picture ? (
                                        <Image
                                            src={user.profile_picture}
                                            alt={user.full_name || user.username || "User"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-medium">
                                            {(user.full_name || user.username || "U")[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {user.full_name || user.username || "Anonymous"}
                                    </p>
                                    {user.city && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {user.city}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        )
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
                <TabsTrigger value="friends" className="gap-2">
                    <Users className="h-4 w-4" />
                    Friends ({friends.length})
                </TabsTrigger>
                <TabsTrigger value="followers" className="gap-2">
                    <UserCheck className="h-4 w-4" />
                    Followers ({followers.length})
                </TabsTrigger>
                <TabsTrigger value="following" className="gap-2">
                    Following ({following.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="mt-4">
                {renderUserList(friends, "No friends yet.")}
            </TabsContent>

            <TabsContent value="followers" className="mt-4">
                {renderUserList(followers, "No followers yet.")}
            </TabsContent>

            <TabsContent value="following" className="mt-4">
                {renderUserList(following, "Not following anyone yet.")}
            </TabsContent>
        </Tabs>
    )
}
