"use client"

import { useState, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
    Heart, 
    MessageCircle, 
    MoreHorizontal, 
    Trash2, 
    Globe, 
    Users, 
    Lock, 
    Book, 
    Loader2,
    Bookmark,
    Repeat2,
    Share,
    Copy,
    Flag
} from "lucide-react"
import { 
    likePost, 
    unlikePost, 
    deletePost,
    bookmarkPost,
    unbookmarkPost,
    repostPost,
    unrepost
} from "@/app/actions/posts"
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
        isBookmarked?: boolean
        isReposted?: boolean
    }
    currentUserId: string
    onDelete?: () => void
}

export function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
    const [liked, setLiked] = useState(post.isLiked)
    const [likeCount, setLikeCount] = useState(post.likeCount)
    const [bookmarked, setBookmarked] = useState(post.isBookmarked || false)
    const [reposted, setReposted] = useState(post.isReposted || false)
    const [showComments, setShowComments] = useState(false)
    const [commentCount, setCommentCount] = useState(post.commentCount)
    const [isPending, startTransition] = useTransition()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

    const handleBookmark = () => {
        startTransition(async () => {
            try {
                if (bookmarked) {
                    await unbookmarkPost(post.id)
                    setBookmarked(false)
                    toast.success("Removed from bookmarks")
                } else {
                    await bookmarkPost(post.id)
                    setBookmarked(true)
                    toast.success("Added to bookmarks")
                }
            } catch (error) {
                toast.error("Failed to update bookmark")
            }
        })
    }

    const handleRepost = () => {
        startTransition(async () => {
            try {
                if (reposted) {
                    await unrepost(post.id)
                    setReposted(false)
                    toast.success("Repost removed")
                } else {
                    const result = await repostPost(post.id)
                    if (result.success) {
                        setReposted(true)
                        toast.success("Reposted!")
                    } else {
                        toast.error(result.error || "Failed to repost")
                    }
                }
            } catch (error) {
                toast.error("Failed to repost")
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

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/dashboard/feed?post=${post.id}`)
        toast.success("Link copied to clipboard")
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Post by ${post.user.full_name || post.user.username}`,
                    text: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
                    url: `${window.location.origin}/dashboard/feed?post=${post.id}`,
                })
            } catch (error) {
                // User cancelled or error
            }
        } else {
            handleCopyLink()
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
        <>
            <Card className="hover:bg-accent/5 transition-colors">
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
                                <span className="text-muted-foreground text-sm ml-1">@{post.user.username}</span>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                    <span>·</span>
                                    {visibilityIcon[post.visibility as keyof typeof visibilityIcon]}
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleCopyLink}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy link
                                    </DropdownMenuItem>
                                    {!isOwner && (
                                        <DropdownMenuItem>
                                            <Flag className="h-4 w-4 mr-2" />
                                            Report
                                        </DropdownMenuItem>
                                    )}
                                    {isOwner && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                onClick={() => setShowDeleteDialog(true)} 
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 ${liked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
                            onClick={handleLike}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                            )}
                            {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 ${showComments ? 'text-primary' : ''}`}
                            onClick={() => setShowComments(!showComments)}
                        >
                            <MessageCircle className="h-4 w-4" />
                            {commentCount > 0 && <span className="text-xs">{commentCount}</span>}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 ${reposted ? 'text-green-500 hover:text-green-600' : 'hover:text-green-500'}`}
                            onClick={handleRepost}
                            disabled={isPending || isOwner}
                            title={isOwner ? "You can't repost your own post" : reposted ? "Remove repost" : "Repost"}
                        >
                            <Repeat2 className={`h-4 w-4 ${reposted ? 'stroke-[2.5]' : ''}`} />
                        </Button>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 ${bookmarked ? 'text-yellow-500 hover:text-yellow-600' : 'hover:text-yellow-500'}`}
                            onClick={handleBookmark}
                            disabled={isPending}
                        >
                            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleShare}
                        >
                            <Share className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                {showComments && (
                    <CommentsSection
                        postId={post.id}
                        onCommentAdded={() => setCommentCount(prev => prev + 1)}
                    />
                )}
            </CardFooter>
        </Card>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete post?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your post
                        and remove all likes and comments.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}
