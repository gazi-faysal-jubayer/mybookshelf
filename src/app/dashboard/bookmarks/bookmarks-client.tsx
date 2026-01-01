"use client"

import { useState, useCallback } from "react"
import { PostCard } from "@/components/feed/post-card"
import { getBookmarkedPosts } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import { Loader2, Bookmark } from "lucide-react"

interface BookmarksClientProps {
    initialPosts: any[]
    initialCursor?: string
    currentUserId: string
}

export function BookmarksClient({ initialPosts, initialCursor, currentUserId }: BookmarksClientProps) {
    const [posts, setPosts] = useState(initialPosts)
    const [cursor, setCursor] = useState(initialCursor)
    const [isLoading, setIsLoading] = useState(false)

    const loadMore = useCallback(async () => {
        if (!cursor) return
        setIsLoading(true)
        try {
            const { posts: newPosts, nextCursor } = await getBookmarkedPosts(cursor)
            setPosts(prev => [...prev, ...newPosts])
            setCursor(nextCursor)
        } catch (error) {
            console.error("Failed to load more bookmarks:", error)
        } finally {
            setIsLoading(false)
        }
    }, [cursor])

    const handlePostDeleted = (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId))
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12">
                <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No bookmarks yet</h3>
                <p className="text-muted-foreground text-sm mt-1">
                    When you bookmark a post, it will appear here.
                </p>
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
                    onDelete={() => handlePostDeleted(post.id)}
                />
            ))}
            
            {cursor && (
                <div className="text-center pt-4">
                    <Button
                        variant="outline"
                        onClick={loadMore}
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
