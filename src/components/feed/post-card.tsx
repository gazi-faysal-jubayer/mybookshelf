"use client"

import { useState, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Heart, MessageCircle, MoreHorizontal, Trash2, Globe, Users, Lock, Book, Loader2 } from "lucide-react"
import { likePost, unlikePost, deletePost } from "@/app/actions/posts"
import { CommentsSection } from "./comments-section"
import { toast } from "sonner"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface PostCardProps {
    post: {
        id: string
        content: string
        visibility: string
        created_at: string
        user: {
            id: string
            full_name?: string
            username: string
            profile_picture?: string
        }
        book?: {
            id: string
            title: string
            author: string
            cover_image?: string
        }
        likeCount: number
        commentCount: number
        isLiked: boolean
    }
    currentUserId: string
    onDelete?: () => void
}

export function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
    const [liked, setLiked] = useState(post.isLiked)
    const [likeCount, setLikeCount] = useState(post.likeCount)
    const [showComments, setShowComments] = useState(false)
    const [commentCount, setCommentCount] = useState(post.commentCount)
    const [isPending, startTransition] = useTransition()
    const [isDeleting, setIsDeleting] = useState(false)

    const isOwner = post.user.id === currentUserId

    const handleLike = () => {
        startTransition(async () => {
            try {
                if (liked) {
                    await unlikePost(post.id)
                    setLiked(false)
                    setLikeCount(prev => prev - 1)
                } else {
                    await likePost(post.id)
                    setLiked(true)
                    setLikeCount(prev => prev + 1)
                }
            } catch (error) {
                toast.error("Failed to update like")
            }
        })
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deletePost(post.id)
            toast.success("Post deleted")
            onDelete?.()
        } catch (error) {
            toast.error("Failed to delete post")
            setIsDeleting(false)
        }
    }

    const initials = post.user.full_name
        ? post.user.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
        : post.user.username.slice(0, 2).toUpperCase()

    const visibilityIcon = {
        public: <Globe className="h-3 w-3" />,
        connections: <Users className="h-3 w-3" />,
        private: <Lock className="h-3 w-3" />,
    }

    if (isDeleting) {
        return null
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <Link href={`/dashboard/users/${post.user.id}`}>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={post.user.profile_picture} alt={post.user.full_name || post.user.username} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href={`/dashboard/users/${post.user.id}`} className="font-medium hover:underline">
                                {post.user.full_name || post.user.username}
                            </Link>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                <span>·</span>
                                {visibilityIcon[post.visibility as keyof typeof visibilityIcon]}
                            </div>
                        </div>
                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <p className="whitespace-pre-wrap">{post.content}</p>
                {post.book && (
                    <Link href={`/dashboard/books/${post.book.id}`}>
                        <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            {post.book.cover_image ? (
                                <img
                                    src={post.book.cover_image}
                                    alt={post.book.title}
                                    className="w-10 h-14 object-cover rounded"
                                />
                            ) : (
                                <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                                    <Book className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{post.book.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{post.book.author}</p>
                            </div>
                        </div>
                    </Link>
                )}
            </CardContent>
            <CardFooter className="flex flex-col items-stretch pt-0">
                <div className="flex items-center gap-4 border-t pt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1.5 ${liked ? 'text-red-500' : ''}`}
                        onClick={handleLike}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                        )}
                        {likeCount > 0 && likeCount}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setShowComments(!showComments)}
                    >
                        <MessageCircle className="h-4 w-4" />
                        {commentCount > 0 && commentCount}
                    </Button>
                </div>
                {showComments && (
                    <CommentsSection
                        postId={post.id}
                        onCommentAdded={() => setCommentCount(prev => prev + 1)}
                    />
                )}
            </CardFooter>
        </Card>
    )
}
