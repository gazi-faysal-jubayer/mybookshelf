"use client"

import Link from "next/link"
import Image from "next/image"
import { Book as BookIcon, MoreHorizontal, User, Star } from "lucide-react"
import { useTransition, useState } from "react"
import { toast } from "sonner"
import { deleteBook } from "@/app/actions/book"
import { returnBook } from "@/app/actions/lending"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { LendBookModal } from "@/components/lending/lend-book-modal"
import { AddToCollectionMenuItem } from "@/components/collections/add-to-collection-menu-item"

interface BookListViewProps {
    books: any[]
    emptyMessage?: string
}

export function BookListView({ books, emptyMessage = "No books found" }: BookListViewProps) {
    if (books.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <BookIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{emptyMessage}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Add books to your collection to see them here.
                </p>
                <Button asChild>
                    <Link href="/dashboard/books/add">Add a book</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {/* Header - Hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-5">Book</div>
                <div className="col-span-2">Format</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Rating</div>
                <div className="col-span-1"></div>
            </div>
            {/* Book rows */}
            {books.map((book) => (
                <BookListItem key={book.id} book={book} />
            ))}
        </div>
    )
}

function BookListItem({ book }: { book: any }) {
    const [isPending, startTransition] = useTransition()
    const [isLendModalOpen, setIsLendModalOpen] = useState(false)

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteBook(book.id)
                toast.success("Book deleted")
            } catch (error) {
                toast.error("Failed to delete book")
            }
        })
    }

    const handleReturn = () => {
        startTransition(async () => {
            try {
                await returnBook(book.id)
                toast.success("Book returned")
            } catch (error) {
                toast.error("Failed to return book")
            }
        })
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                {/* Book info with cover */}
                <div className="md:col-span-5 flex items-center gap-3">
                    <Link href={`/dashboard/books/${book.id}`} className="shrink-0">
                        <div className="relative w-12 h-16 rounded overflow-hidden bg-muted">
                            {book.cover_image ? (
                                <Image
                                    src={book.cover_image}
                                    alt={book.title}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BookIcon className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                        <Link href={`/dashboard/books/${book.id}`} className="hover:underline">
                            <h3 className="font-medium line-clamp-1">{book.title}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
                    </div>
                </div>

                {/* Format - Hidden on mobile, shown inline on desktop */}
                <div className="hidden md:block md:col-span-2">
                    <span className="text-sm text-muted-foreground">{book.format}</span>
                </div>

                {/* Status badges */}
                <div className="md:col-span-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                        {book.ownership_status.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        {book.reading_status.replace(/_/g, " ")}
                    </Badge>
                    {book.lending_status === "lent_out" && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">Lent</Badge>
                    )}
                </div>

                {/* Rating */}
                <div className="hidden md:flex md:col-span-2 items-center gap-1">
                    {book.rating > 0 ? (
                        <>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{book.rating}/5</span>
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">No rating</span>
                    )}
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/books/${book.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/books/${book.id}/edit`}>Edit</Link>
                            </DropdownMenuItem>
                            <AddToCollectionMenuItem bookId={book.id} />
                            {book.lending_status === "available" && book.ownership_status === "owned" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setIsLendModalOpen(true)}>
                                        Lend to Friend
                                    </DropdownMenuItem>
                                </>
                            )}
                            {book.lending_status === "lent_out" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleReturn} disabled={isPending}>
                                        Mark as Returned
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                disabled={isPending}
                                onClick={handleDelete}
                            >
                                {isPending ? "Pending..." : "Delete"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <LendBookModal
                bookId={book.id}
                isOpen={isLendModalOpen}
                onClose={() => setIsLendModalOpen(false)}
            />
        </>
    )
}
