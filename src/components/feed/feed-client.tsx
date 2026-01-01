"use client"

import { useState, useEffect, useCallback } from "react"
import { PostComposer } from "@/components/feed/post-composer"
import { PostCard } from "@/components/feed/post-card"
import { FeedToggle } from "@/components/feed/feed-toggle"
import { getFeed } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

interface FeedClientProps {
    initialPosts: any[]
    initialCursor?: string
    currentUserId: string
    initialMode: 'global' | 'connections'
    suggestions?: any[]
}

import { UserPlus, BookOpen, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

function OnboardingFeed({ suggestions }: { suggestions: any[] }) {
    return (
        <div className="space-y-8 animate-in fade-in-50">
            {/* Value Props */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="p-6 text-center space-y-2">
                        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">Connect</h3>
                        <p className="text-sm text-muted-foreground">Follow readers to see their updates here.</p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="p-6 text-center space-y-2">
                        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">Share</h3>
                        <p className="text-sm text-muted-foreground">Post updates about books you're reading.</p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="p-6 text-center space-y-2">
                        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Star className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">Discover</h3>
                        <p className="text-sm text-muted-foreground">Find your next favorite book.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Suggested Users */}
            {suggestions && suggestions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Suggested Readers</h3>
                        <Button variant="link" asChild>
                            <Link href="/dashboard/discover">View all</Link>
                        </Button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {suggestions.slice(0, 4).map((user) => (
                            <Card key={user.id}>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <Link href={`/dashboard/users/${user.id}`}>
                                        <Avatar>
                                            <AvatarImage src={user.profile_picture} />
                                            <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/dashboard/users/${user.id}`} className="hover:underline">
                                            <div className="font-medium truncate">{user.full_name || user.username}</div>
                                        </Link>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {user.favorite_genre ? `Reads ${user.favorite_genre}` : 'Reader'}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/dashboard/users/${user.id}`}>View</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function FeedClient({ initialPosts, initialCursor, currentUserId, initialMode, suggestions = [] }: FeedClientProps) {
    const [mode, setMode] = useState<'global' | 'connections'>(initialMode)
    const [posts, setPosts] = useState(initialPosts)
    const [cursor, setCursor] = useState(initialCursor)
    const [isLoading, setIsLoading] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const loadPosts = useCallback(async (refresh = false) => {
        if (refresh) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }

        try {
            const { posts: newPosts, nextCursor } = await getFeed(mode, refresh ? undefined : cursor)
            if (refresh) {
                setPosts(newPosts)
            } else {
                setPosts(prev => [...prev, ...newPosts])
            }
            setCursor(nextCursor)
        } catch (error) {
            console.error("Failed to load posts:", error)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [mode, cursor])

    // Reload when mode changes
    useEffect(() => {
        loadPosts(true)
    }, [mode])

    const handlePostCreated = () => {
        loadPosts(true)
    }

    const handlePostDeleted = () => {
        loadPosts(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <FeedToggle value={mode} onChange={setMode} />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPosts(true)}
                    disabled={isRefreshing}
                    className="gap-1.5"
                >
                    {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                </Button>
            </div>

            <PostComposer onPostCreated={handlePostCreated} />

            <div className="space-y-4">
                {posts.length === 0 && !isLoading && !isRefreshing ? (
                    <div className="py-8">
                        <OnboardingFeed suggestions={suggestions} />
                    </div>
                ) : (
                    posts.map((post: any) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={currentUserId}
                            onDelete={handlePostDeleted}
                        />
                    ))
                )}

                {cursor && (
                    <div className="text-center pt-4">
                        <Button
                            variant="outline"
                            onClick={() => loadPosts(false)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                'Load More'
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
