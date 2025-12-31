"use client"

import Link from "next/link"
import { Book as BookIcon, Calendar, MoreHorizontal, User } from "lucide-react"
import { useTransition, useState } from "react"
import { toast } from "sonner"
import { deleteBook } from "@/app/actions/book"
import { returnBook } from "@/app/actions/lending"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

import { format } from "date-fns"
import { LendBookModal } from "@/components/lending/lend-book-modal"
import { AddToCollectionMenuItem } from "@/components/collections/add-to-collection-menu-item"

interface BookCardProps {
    book: any
}

export function BookCard({ book }: BookCardProps) {
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
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="grid gap-1">
                            <CardTitle className="line-clamp-1" title={book.title}>{book.title}</CardTitle>
                            <CardDescription className="line-clamp-1" title={book.author}>{book.author}</CardDescription>
                        </div>
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
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                            <BookIcon className="mr-2 h-3 w-3" />
                            {book.format}
                        </div>
                        {book.ownership_status === "borrowed_from_others" && book.borrowed_info?.owner_name && (
                            <div className="flex items-center text-sm text-blue-600 font-medium">
                                <User className="mr-2 h-3 w-3" />
                                From: {book.borrowed_info.owner_name}
                            </div>
                        )}
                        {book.purchase_info?.date && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="mr-2 h-3 w-3" />
                                {format(new Date(book.purchase_info.date), "MMM yyyy")}
                            </div>
                        )}
                        {book.lending_status === "lent_out" && (
                            <div className="flex items-center text-sm text-amber-600 font-medium">
                                <User className="mr-2 h-3 w-3" />
                                Lent Out
                            </div>
                        )}
                        {book.ownership_status === "wishlist" && book.purchase_info?.link && (
                            <div className="pt-2">
                                <Button asChild size="sm" variant="outline" className="w-full">
                                    <a href={book.purchase_info.link} target="_blank" rel="noopener noreferrer">
                                        Buy Online
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="outline">{book.ownership_status.replace(/_/g, " ")}</Badge>
                        <Badge variant="secondary">{book.reading_status.replace(/_/g, " ")}</Badge>
                    </div>
                </CardContent>
            </Card>

            <LendBookModal
                bookId={book.id}
                isOpen={isLendModalOpen}
                onClose={() => setIsLendModalOpen(false)}
            />
        </>
    )
}
