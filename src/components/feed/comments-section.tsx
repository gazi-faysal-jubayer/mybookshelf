"use client"

import { useState, useEffect, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPostComments, addComment, deleteComment } from "@/app/actions/posts"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Send, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

interface Comment {
    id: string
    content: string
    created_at: string
    user: {
        id: string
        full_name?: string
        username: string
        profile_picture?: string
    }
}

interface CommentsSectionProps {
    postId: string
    onCommentAdded?: () => void
}

export function CommentsSection({ postId, onCommentAdded }: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        loadComments()
    }, [postId])

    const loadComments = async () => {
        setIsLoading(true)
        try {
            const data = await getPostComments(postId)
            setComments(data)
        } catch (error) {
            console.error("Failed to load comments:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        startTransition(async () => {
            try {
                await addComment(postId, newComment)
                setNewComment("")
                loadComments()
                onCommentAdded?.()
                toast.success("Comment added!")
            } catch (error) {
                toast.error("Failed to add comment")
            }
        })
    }

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId)
            setComments(prev => prev.filter(c => c.id !== commentId))
            toast.success("Comment deleted")
        } catch (error) {
            toast.error("Failed to delete comment")
        }
    }

    return (
        <div className="mt-3 pt-3 border-t space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={500}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newComment.trim() || isPending}>
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>

            {isLoading ? (
                <div className="text-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </div>
            ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                    No comments yet. Be the first to comment!
                </p>
            ) : (
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}

function CommentItem({
    comment,
    onDelete,
}: {
    comment: Comment
    onDelete: (id: string) => void
}) {
    const initials = comment.user.full_name
        ? comment.user.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
        : comment.user.username.slice(0, 2).toUpperCase()

    return (
        <div className="flex gap-3 group">
            <Link href={`/dashboard/users/${comment.user.id}`}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.profile_picture} alt={comment.user.full_name || comment.user.username} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
                <div className="bg-muted/50 rounded-lg p-2">
                    <div className="flex items-center justify-between gap-2">
                        <Link href={`/dashboard/users/${comment.user.id}`} className="font-medium text-sm hover:underline">
                            {comment.user.full_name || comment.user.username}
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onDelete(comment.id)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
            </div>
        </div>
    )
}
