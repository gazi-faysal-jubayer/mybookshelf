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
}

export function FeedClient({ initialPosts, initialCursor, currentUserId, initialMode }: FeedClientProps) {
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
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No posts yet.</p>
                        {mode === 'connections' ? (
                            <p className="text-sm">Connect with other readers to see their posts!</p>
                        ) : (
                            <p className="text-sm">Be the first to share something!</p>
                        )}
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
