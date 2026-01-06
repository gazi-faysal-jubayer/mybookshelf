"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    BookOpen,
    Pencil,
    Trash2,
    Share2,
    Heart,
    Play,
    CheckCircle,
    BookPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { deleteBook, toggleFavorite } from "@/app/actions/book"
import { startReading, finishReading } from "@/app/actions/reading-sessions"
import { LendBookModal } from "@/components/lending/lend-book-modal"
import { CreateJourneyDialog } from "@/components/reading/dialogs/create-journey-dialog"

interface BookActionsBarProps {
    book: {
        id: string
        title: string
        pages: number | null
        current_page: number | null
        reading_status: string
        reading_started_at: string | null
        reading_finished_at: string | null
        is_favorite: boolean
    }
}

export function BookActionsBar({ book }: BookActionsBarProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isStarting, setIsStarting] = useState(false)
    const [isFinishing, setIsFinishing] = useState(false)
    const [isLendModalOpen, setIsLendModalOpen] = useState(false)
    const [isFavorite, setIsFavorite] = useState(book.is_favorite)
    const [showNewJourneyDialog, setShowNewJourneyDialog] = useState(false)

    const handleToggleFavorite = async () => {
        // Optimistic update
        const previousState = isFavorite
        setIsFavorite(!isFavorite)
        try {
            await toggleFavorite(book.id)
            toast.success(previousState ? "Removed from favorites" : "Added to favorites")
        } catch {
            setIsFavorite(previousState)
            toast.error("Failed to update favorites")
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteBook(book.id)
            toast.success("Book deleted successfully")
            router.push("/dashboard")
        } catch {
            toast.error("Failed to delete book")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleStartReading = async () => {
        setIsStarting(true)
        try {
            await startReading(book.id, book.pages || undefined)
            toast.success("Started reading! Track your progress now.")
        } catch {
            toast.error("Failed to start reading")
        } finally {
            setIsStarting(false)
        }
    }

    const handleFinishReading = async () => {
        setIsFinishing(true)
        try {
            await finishReading(book.id)
            toast.success("Congratulations on finishing the book!")
        } catch {
            toast.error("Failed to mark as finished")
        } finally {
            setIsFinishing(false)
        }
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: book.title,
                text: `Check out this book: ${book.title}`,
                url: window.location.href,
            }).catch(() => {
                // User cancelled or share failed
            })
        } else {
            navigator.clipboard.writeText(window.location.href)
            toast.success("Link copied to clipboard!")
        }
    }

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {/* Primary Action based on reading status */}
                {book.reading_status === "to_read" && (
                    <Button onClick={handleStartReading} disabled={isStarting}>
                        {isStarting ? (
                            "Starting..."
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Reading
                            </>
                        )}
                    </Button>
                )}

                {book.reading_status === "currently_reading" && (
                    <>
                        <Button onClick={handleFinishReading} disabled={isFinishing}>
                            {isFinishing ? (
                                "Updating..."
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Finished
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={() => setShowNewJourneyDialog(true)}>
                            <BookPlus className="h-4 w-4 mr-2" />
                            New Journey
                        </Button>
                    </>
                )}

                {book.reading_status === "completed" && (
                    <Button onClick={handleStartReading} disabled={isStarting} variant="default">
                        {isStarting ? (
                            "Starting..."
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Again
                            </>
                        )}
                    </Button>
                )}

                {/* Edit Button */}
                <Button variant="outline" asChild>
                    <Link href={`/dashboard/books/${book.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </Link>
                </Button>

                {/* More Actions Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            More Actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleShare}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleToggleFavorite}>
                            <Heart className={cn("h-4 w-4 mr-2", isFavorite && "fill-current text-red-500")} />
                            {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsLendModalOpen(true)}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Lend Book
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Book
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete "{book.title}"?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the book
                                        and all associated reading sessions and reviews.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <LendBookModal
                bookId={book.id}
                isOpen={isLendModalOpen}
                onClose={() => setIsLendModalOpen(false)}
            />
            <CreateJourneyDialog
                bookId={book.id}
                open={showNewJourneyDialog}
                onOpenChange={setShowNewJourneyDialog}
                onSuccess={() => router.refresh()}
            />
        </>
    )
}
