"use client"

import { useState } from "react"
import Image from "next/image"
import { BookOpen, Tag, Calendar, Building2, Layers, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookActionsBar } from "@/components/books/book-actions-bar"
import { InlineEdit } from "@/components/ui/inline-edit"
import { updateBook } from "@/app/actions/book"
import { useRouter } from "next/navigation"

interface BookDetailHeaderProps {
    book: any // using any for simplicity, effectively the Supabase book row
}

export function BookDetailHeader({ book }: BookDetailHeaderProps) {
    const router = useRouter()

    const handleUpdate = async (field: string, value: any) => {
        await updateBook(book.id, { [field]: value })
        router.refresh()
    }

    const ownershipLabels: Record<string, string> = {
        owned: "Owned",
        borrowed_from_others: "Borrowed",
        wishlist: "Wishlist",
        sold: "Sold",
        lost: "Lost",
    }

    const readingLabels: Record<string, string> = {
        to_read: "To Read",
        currently_reading: "Currently Reading",
        completed: "Completed",
        abandoned: "Abandoned",
    }

    const formatLabels: Record<string, string> = {
        hardcover: "Hardcover",
        paperback: "Paperback",
        ebook: "E-Book",
        audiobook: "Audiobook",
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 p-1">
            {/* Cover Image */}
            <div className="shrink-0 group relative">
                {book.cover_image ? (
                    <div className="relative w-[180px] h-[270px] rounded-lg overflow-hidden shadow-lg">
                        <Image
                            src={book.cover_image}
                            alt={book.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-[180px] h-[270px] rounded-lg bg-muted flex items-center justify-center shadow-lg hover:bg-muted/80 transition-colors">
                        <BookOpen className="h-16 w-16 text-muted-foreground" />
                    </div>
                )}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Placeholder for cover upload button if needed */}
                </div>
            </div>

            {/* Title and Meta */}
            <div className="flex-1 space-y-4 min-w-0">
                <div>
                    <InlineEdit
                        value={book.title}
                        onSave={(val) => handleUpdate("title", val)}
                        className="text-3xl font-bold tracking-tight"
                        inputClassName="text-3xl font-bold h-auto py-1 px-2"
                        label="Title"
                    />
                    <InlineEdit
                        value={book.author}
                        onSave={(val) => handleUpdate("author", val)}
                        className="text-xl text-muted-foreground mt-1"
                        inputClassName="text-xl h-auto py-1 px-2"
                        label="Author"
                    />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant={book.ownership_status === "owned" ? "default" : "secondary"}>
                        {ownershipLabels[book.ownership_status] || book.ownership_status}
                    </Badge>
                    <Badge variant={book.reading_status === "currently_reading" ? "default" : "outline"}>
                        {readingLabels[book.reading_status] || book.reading_status}
                    </Badge>
                    {(book.format || book.genre) && (
                        <div className="flex gap-2">
                            {book.format && (
                                <Badge variant="outline">
                                    {formatLabels[book.format] || book.format}
                                </Badge>
                            )}
                            {book.genre && (
                                <Badge variant="outline" className="gap-1">
                                    <Tag className="h-3 w-3" />
                                    {Array.isArray(book.genre) ? book.genre[0] : book.genre}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Stats Inline Edit */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground items-center">
                    <div className="flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        <div className="flex items-center">
                            <InlineEdit
                                value={book.pages}
                                onSave={(val) => handleUpdate("pages", parseInt(val))}
                                type="number"
                                className="font-medium"
                                label="Pages"
                            />
                            <span className="ml-1">pages</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <InlineEdit
                            value={book.publication_year}
                            onSave={(val) => handleUpdate("publication_year", parseInt(val))}
                            type="number"
                            className="font-medium"
                            label="Year"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <InlineEdit
                            value={book.publisher}
                            onSave={(val) => handleUpdate("publisher", val)}
                            className="font-medium"
                            label="Publisher"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <BookActionsBar book={book} />
                </div>
            </div>
        </div>
    )
}
