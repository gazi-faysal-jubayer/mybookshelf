"use client"

import { useState, useCallback } from "react"
import { PostCard } from "@/components/feed/post-card"
import { getBookmarkedPosts } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import { Loader2, Bookmark } from "lucide-react"
import Link from "next/link"

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
            <div className="text-center py-12 border rounded-lg border-dashed bg-muted/10">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Bookmark className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">No bookmarks yet</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto mb-6">
                    Save interesting posts, reviews, and reading updates to find them easily later.
                </p>
                <Button asChild variant="outline">
                    <Link href="/dashboard/feed">
                        Browse Feed
                    </Link>
                </Button>
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
