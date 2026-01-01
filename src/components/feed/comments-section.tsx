"use client"

import { useState, useEffect, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getPostComments, addComment, deleteComment, toggleCommentLike } from "@/app/actions/posts"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Send, Trash2, Loader2, Heart, MessageCircle, CornerDownRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MentionTextarea } from "@/components/ui/mention-textarea"

interface Comment {
    id: string
    content: string
    created_at: string
    isOwn: boolean
    parentId: string | null
    likesCount: number
    isLiked: boolean
    user: {
        id: string
        full_name?: string
        username: string
        profile_picture?: string
    }
}

interface CommentWithReplies extends Comment {
    replies: CommentWithReplies[]
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
            setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId))
            toast.success("Comment deleted")
        } catch (error) {
            toast.error("Failed to delete comment")
        }
    }

    const handleLike = async (commentId: string) => {
        // Optimistic update
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    isLiked: !c.isLiked,
                    likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1
                }
            }
            return c
        }))

        try {
            await toggleCommentLike(commentId)
        } catch (error) {
            // Revert
            loadComments()
            toast.error("Failed to like comment")
        }
    }

    const buildCommentTree = (flatComments: Comment[]): CommentWithReplies[] => {
        const commentMap = new Map<string, CommentWithReplies>()
        const roots: CommentWithReplies[] = []

        // Initialize map
        flatComments.forEach(c => {
            commentMap.set(c.id, { ...c, replies: [] })
        })

        // Build tree
        flatComments.forEach(c => {
            const node = commentMap.get(c.id)!
            if (c.parentId && commentMap.has(c.parentId)) {
                commentMap.get(c.parentId)!.replies.push(node)
            } else {
                roots.push(node)
            }
        })

        return roots
    }

    const rootComments = buildCommentTree(comments)

    return (
        <div className="mt-3 pt-3 border-t space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2 items-start">
                <div className="flex-1">
                    <MentionTextarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[40px] py-2 resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(e as any)
                            }
                        }}
                    />
                </div>
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
            ) : rootComments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                    No comments yet. Be the first to comment!
                </p>
            ) : (
                <div className="space-y-4">
                    {rootComments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            onDelete={handleDelete}
                            onLike={handleLike}
                            onReplyAdded={loadComments}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function CommentItem({
    comment,
    postId,
    onDelete,
    onLike,
    onReplyAdded
}: {
    comment: CommentWithReplies
    postId: string
    onDelete: (id: string) => void
    onLike: (id: string) => void
    onReplyAdded: () => void
}) {
    const [isReplying, setIsReplying] = useState(false)
    const [replyContent, setReplyContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const initials = comment.user.full_name
        ? comment.user.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
        : comment.user.username.slice(0, 2).toUpperCase()

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!replyContent.trim()) return

        setIsSubmitting(true)
        try {
            await addComment(postId, replyContent, comment.id)
            setReplyContent("")
            setIsReplying(false)
            onReplyAdded()
            toast.success("Reply added")
        } catch (error) {
            toast.error("Failed to add reply")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="group">
            <div className="flex gap-3">
                <Link href={`/dashboard/users/${comment.user.id}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.profile_picture} alt={comment.user.full_name || comment.user.username} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <Link href={`/dashboard/users/${comment.user.id}`} className="font-semibold text-sm hover:underline">
                                {comment.user.full_name || comment.user.username}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-auto p-0 text-xs text-muted-foreground hover:text-foreground",
                                comment.isLiked && "text-red-500 hover:text-red-600"
                            )}
                            onClick={() => onLike(comment.id)}
                        >
                            <Heart className={cn("h-3 w-3 mr-1", comment.isLiked && "fill-current")} />
                            {comment.likesCount > 0 ? comment.likesCount : "Like"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Reply
                        </Button>
                        {comment.isOwn && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onDelete(comment.id)}
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                            </Button>
                        )}
                    </div>

                    {isReplying && (
                        <div className="mt-3 flex gap-2">
                            <div className="flex-1">
                                <MentionTextarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Reply to ${comment.user.full_name || comment.user.username}...`}
                                    className="min-h-[40px] py-2 resize-none text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleReplySubmit(e as any)
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                size="sm"
                                onClick={handleReplySubmit}
                                disabled={!replyContent.trim() || isSubmitting}
                                className="self-end"
                            >
                                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reply"}
                            </Button>
                        </div>
                    )}

                    {/* Nested Replies */}
                    {comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3 pl-4 border-l-2 border-muted">
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    postId={postId}
                                    onDelete={onDelete}
                                    onLike={onLike}
                                    onReplyAdded={onReplyAdded}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
