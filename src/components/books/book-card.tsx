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
            <Card className="flex flex-col h-full overflow-hidden group">
                {/* Cover Image Section */}
                <Link href={`/dashboard/books/${book.id}`} className="block">
                    <div className="relative aspect-[2/3] bg-muted">
                        {book.cover_image ? (
                            <Image
                                src={book.cover_image}
                                alt={book.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                <BookIcon className="h-16 w-16 text-muted-foreground/30" />
                            </div>
                        )}
                        {/* Rating overlay */}
                        {book.rating > 0 && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-md text-xs">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {book.rating}
                            </div>
                        )}
                        {/* Lending status overlay */}
                        {book.lending_status === "lent_out" && (
                            <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600">
                                Lent Out
                            </Badge>
                        )}
                    </div>
                </Link>
                <CardHeader className="p-2">
                    <div className="flex items-start justify-between gap-1">
                        <div className="grid gap-0.5 min-w-0 flex-1">
                            <CardTitle className="line-clamp-1 text-sm font-medium leading-none" title={book.title}>{book.title}</CardTitle>
                            <CardDescription className="line-clamp-1 text-xs" title={book.author}>{book.author}</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-6 w-6 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-3 w-3" />
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
                <CardContent className="p-2 pt-0 flex-1">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center text-[10px] text-muted-foreground">
                            <BookIcon className="mr-1 h-3 w-3" />
                            {book.format}
                        </div>
                        {book.ownership_status === "borrowed_from_others" && book.borrowed_info?.owner_name && (
                            <div className="flex items-center text-[10px] text-blue-600 font-medium">
                                <User className="mr-1 h-3 w-3" />
                                From: {book.borrowed_info.owner_name}
                            </div>
                        )}
                        {book.ownership_status === "wishlist" && book.purchase_info?.link && (
                            <Button asChild size="sm" variant="outline" className="w-full h-6 text-[10px] px-2">
                                <a href={book.purchase_info.link} target="_blank" rel="noopener noreferrer">
                                    Buy Online
                                </a>
                            </Button>
                        )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1">{book.ownership_status.replace(/_/g, " ")}</Badge>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1">{book.reading_status.replace(/_/g, " ")}</Badge>
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
