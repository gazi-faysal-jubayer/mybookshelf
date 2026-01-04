"use client"

import { useState } from "react"
import { Star, MessageSquare, Plus, Pencil, Trash2, AlertTriangle, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { addFinalReview, addDuringReadingThought, deleteReview, deleteReadingThought } from "@/app/actions/reviews"
import { format } from "date-fns"

// Reading thought from reading_thoughts table
interface ReadingThought {
    id: string
    page_number: number | null
    chapter: string | null
    content: string
    contains_spoilers: boolean
    created_at: string
}

// Final review from book_reviews table
interface FinalReview {
    id: string
    rating: number
    review_text: string | null
    contains_spoilers: boolean
    title?: string | null
    would_recommend?: string | null
    is_public?: boolean
    created_at: string
}

interface BookReviewSectionProps {
    thoughts: ReadingThought[]
    finalReview: FinalReview | null
    bookId: string
    currentPage?: number
}

function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
                >
                    <Star
                        className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    />
                </button>
            ))}
        </div>
    )
}

export function BookReviewSection({ thoughts, finalReview, bookId, currentPage = 0 }: BookReviewSectionProps) {
    const [isThoughtDialogOpen, setIsThoughtDialogOpen] = useState(false)
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [rating, setRating] = useState(0)

    const handleAddThought = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await addDuringReadingThought(bookId, {
                content: formData.get("content") as string,
                page_number: formData.get("pageNumber") ? parseInt(formData.get("pageNumber") as string) : undefined,
                chapter: formData.get("chapter") as string || undefined,
                contains_spoilers: formData.get("containsSpoilers") === "on",
            })
            toast.success("Thought added!")
            setIsThoughtDialogOpen(false)
        } catch {
            toast.error("Failed to add thought")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddReview = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await addFinalReview(bookId, {
                title: formData.get("title") as string || undefined,
                content: formData.get("content") as string,
                rating: rating || undefined,
                would_recommend: (formData.get("wouldRecommend") as "yes" | "no" | "maybe") || undefined,
                contains_spoilers: formData.get("containsSpoilers") === "on",
                is_public: formData.get("isPublic") === "on",
            })
            toast.success("Review added!")
            setIsReviewDialogOpen(false)
            setRating(0)
        } catch {
            toast.error("Failed to add review")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteReview = async (reviewId: string) => {
        try {
            await deleteReview(reviewId)
            toast.success("Deleted successfully")
        } catch {
            toast.error("Failed to delete")
        }
    }

    const handleDeleteThought = async (thoughtId: string) => {
        try {
            await deleteReadingThought(thoughtId)
            toast.success("Deleted successfully")
        } catch {
            toast.error("Failed to delete")
        }
    }

    const RecommendIcon = finalReview?.would_recommend === "yes" ? ThumbsUp :
        finalReview?.would_recommend === "no" ? ThumbsDown : HelpCircle

    return (
        <div className="space-y-4">
            {/* Final Review Card */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            My Review
                        </CardTitle>
                        {!finalReview && (
                            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Write Review
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                    <form onSubmit={handleAddReview}>
                                        <DialogHeader>
                                            <DialogTitle>Write Your Review</DialogTitle>
                                            <DialogDescription>
                                                Share your thoughts about this book. No word limit!
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div>
                                                <Label>Rating *</Label>
                                                <div className="mt-2">
                                                    <StarRating rating={rating} onChange={setRating} />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="title">Title (optional)</Label>
                                                <Input
                                                    id="title"
                                                    name="title"
                                                    placeholder="A captivating headline for your review"
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="content">Your Review *</Label>
                                                <Textarea
                                                    id="content"
                                                    name="content"
                                                    placeholder="What did you think of this book? There's no word limit - write as much as you want!"
                                                    className="mt-1 min-h-[200px]"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="wouldRecommend">Would you recommend?</Label>
                                                <Select name="wouldRecommend">
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="yes">Yes, definitely!</SelectItem>
                                                        <SelectItem value="maybe">Maybe, depends</SelectItem>
                                                        <SelectItem value="no">No, not really</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Switch id="containsSpoilers" name="containsSpoilers" />
                                                    <Label htmlFor="containsSpoilers">Contains spoilers</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch id="isPublic" name="isPublic" defaultChecked />
                                                    <Label htmlFor="isPublic">Public</Label>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isLoading || rating === 0}>
                                                {isLoading ? "Saving..." : "Submit Review"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {finalReview ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <StarRating rating={finalReview.rating} readonly />
                                {finalReview.would_recommend && (
                                    <Badge variant="outline" className="gap-1">
                                        <RecommendIcon className="h-3 w-3" />
                                        {finalReview.would_recommend === "yes" ? "Recommended" :
                                            finalReview.would_recommend === "no" ? "Not Recommended" : "Mixed"}
                                    </Badge>
                                )}
                                {finalReview.contains_spoilers && (
                                    <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Spoilers
                                    </Badge>
                                )}
                            </div>
                            {finalReview.title && (
                                <h4 className="font-semibold text-lg">{finalReview.title}</h4>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{finalReview.review_text}</p>
                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(finalReview.created_at), "PPP")}
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete your review.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeleteReview(finalReview.id)}
                                                    className="bg-destructive text-destructive-foreground"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            You haven't written a review yet. Click "Write Review" to share your thoughts!
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* During-Reading Thoughts */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Reading Thoughts
                        </CardTitle>
                        <Dialog open={isThoughtDialogOpen} onOpenChange={setIsThoughtDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Thought
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleAddThought}>
                                    <DialogHeader>
                                        <DialogTitle>Add Reading Thought</DialogTitle>
                                        <DialogDescription>
                                            Capture your in-the-moment thoughts as you read.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="pageNumber">Page Number</Label>
                                                <Input
                                                    id="pageNumber"
                                                    name="pageNumber"
                                                    type="number"
                                                    min="1"
                                                    defaultValue={currentPage || ""}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="chapter">Chapter</Label>
                                                <Input
                                                    id="chapter"
                                                    name="chapter"
                                                    placeholder="e.g., Chapter 5"
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="content">Your Thought *</Label>
                                            <Textarea
                                                id="content"
                                                name="content"
                                                placeholder="What are you thinking right now?"
                                                className="mt-1 min-h-[120px]"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch id="containsSpoilers" name="containsSpoilers" />
                                            <Label htmlFor="containsSpoilers">Contains spoilers</Label>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? "Saving..." : "Add Thought"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {thoughts.length > 0 && (
                        <CardDescription>
                            {thoughts.length} thought{thoughts.length !== 1 ? "s" : ""} captured
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {thoughts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No thoughts captured yet. Add thoughts as you read to remember your journey!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {thoughts.map((thought) => (
                                <div
                                    key={thought.id}
                                    className="p-3 rounded-lg border bg-muted/30 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm">
                                            {thought.page_number && (
                                                <Badge variant="outline">Page {thought.page_number}</Badge>
                                            )}
                                            {thought.chapter && (
                                                <Badge variant="outline">{thought.chapter}</Badge>
                                            )}
                                            {thought.contains_spoilers && (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Spoiler
                                                </Badge>
                                            )}
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Thought?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteThought(thought.id)}
                                                        className="bg-destructive text-destructive-foreground"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <p className="text-sm">{thought.content}</p>
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(thought.created_at), "PPP")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
