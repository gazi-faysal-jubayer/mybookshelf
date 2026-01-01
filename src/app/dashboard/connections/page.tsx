import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFriends, getFollowing, getFollowers, getPendingRequests, getConnectionSuggestions } from "@/app/actions/connections"
import { ConnectionCard } from "@/components/connections/connection-card"
import { PendingRequests } from "@/components/connections/pending-requests"
import { Users, UserPlus, UserCheck, Clock, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function ConnectionsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const { tab } = await searchParams
    const [friends, following, followers, pendingRequests, suggestions] = await Promise.all([
        getFriends(),
        getFollowing(),
        getFollowers(),
        getPendingRequests(),
        getConnectionSuggestions(),
    ])

    const defaultTab = tab || "friends"

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Connections</h2>
                <p className="text-muted-foreground">
                    Manage your friends, followers, and discover new connections.
                </p>
            </div>

            <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList className="flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="friends" className="gap-1.5">
                        <UserCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Friends</span>
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full text-xs">
                            {friends.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="following" className="gap-1.5">
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Following</span>
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full text-xs">
                            {following.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="followers" className="gap-1.5">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Followers</span>
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full text-xs">
                            {followers.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Requests</span>
                        {pendingRequests.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 min-w-5 rounded-full text-xs">
                                {pendingRequests.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="suggestions" className="gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        <span className="hidden sm:inline">Suggestions</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="friends">
                    <FriendsTab friends={friends} />
                </TabsContent>

                <TabsContent value="following">
                    <FollowingTab following={following} />
                </TabsContent>

                <TabsContent value="followers">
                    <FollowersTab followers={followers} />
                </TabsContent>

                <TabsContent value="requests">
                    <PendingRequests requests={pendingRequests} />
                </TabsContent>

                <TabsContent value="suggestions">
                    <SuggestionsTab suggestions={suggestions} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function FriendsTab({ friends }: { friends: any[] }) {
    if (friends.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No friends yet</p>
                <p className="text-sm">Start connecting with other readers!</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend: any) => (
                <ConnectionCard
                    key={friend.id}
                    user={friend}
                    connectionStatus={{
                        isFriend: true,
                        isPending: false,
                        isRequested: false,
                        isFollowing: false, // Would need to check
                    }}
                />
            ))}
        </div>
    )
}

function FollowingTab({ following }: { following: any[] }) {
    if (following.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Not following anyone yet</p>
                <p className="text-sm">Follow readers to see their activity!</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {following.map((user: any) => (
                <ConnectionCard
                    key={user.id}
                    user={user}
                    connectionStatus={{
                        isFriend: false,
                        isPending: false,
                        isRequested: false,
                        isFollowing: true,
                    }}
                />
            ))}
        </div>
    )
}

function FollowersTab({ followers }: { followers: any[] }) {
    if (followers.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No followers yet</p>
                <p className="text-sm">Share your reading journey to attract followers!</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {followers.map((user: any) => (
                <ConnectionCard
                    key={user.id}
                    user={user}
                    showActions={false}
                />
            ))}
        </div>
    )
}

function SuggestionsTab({ suggestions }: { suggestions: any[] }) {
    if (suggestions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No suggestions available</p>
                <p className="text-sm">Check back later for connection suggestions!</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((user: any) => (
                <ConnectionCard
                    key={user.id}
                    user={user}
                    connectionStatus={{
                        isFriend: false,
                        isPending: false,
                        isRequested: false,
                        isFollowing: false,
                    }}
                />
            ))}
        </div>
    )
}
