"use client"

import { useEffect, useState, useCallback } from "react"
import { PostCard } from "@/components/feed/post-card"
import { getUserPosts } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface UserPostsTabProps {
    userId: string
    currentUserId: string
    isOwnProfile: boolean
}

export function UserPostsTab({ userId, currentUserId, isOwnProfile }: UserPostsTabProps) {
    const [posts, setPosts] = useState<any[]>([])
    const [cursor, setCursor] = useState<string | undefined>()
    const [isLoading, setIsLoading] = useState(true)
    const [hasMore, setHasMore] = useState(false)

    const loadPosts = useCallback(async (refresh = false) => {
        setIsLoading(true)
        try {
            const { posts: newPosts, nextCursor } = await getUserPosts(
                userId,
                refresh ? undefined : cursor
            )
            if (refresh) {
                setPosts(newPosts)
            } else {
                setPosts(prev => [...prev, ...newPosts])
            }
            setCursor(nextCursor)
            setHasMore(!!nextCursor)
        } catch (error) {
            console.error("Failed to load posts:", error)
        } finally {
            setIsLoading(false)
        }
    }, [userId, cursor])

    useEffect(() => {
        loadPosts(true)
    }, [userId])

    const handlePostDeleted = () => {
        loadPosts(true)
    }

    if (isLoading && posts.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>{isOwnProfile ? "You haven't posted anything yet." : "No posts to show."}</p>
                {isOwnProfile && (
                    <p className="text-sm mt-2">
                        Share your thoughts about books in the{" "}
                        <a href="/dashboard/feed" className="text-primary hover:underline">
                            Feed
                        </a>
                        !
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onDelete={handlePostDeleted}
                />
            ))}
            
            {hasMore && (
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
    )
}
