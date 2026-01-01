"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Grid, List, Plus, CheckSquare, Square } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { BookCard } from "@/components/books/book-card"
import { BookListView } from "@/components/books/book-list-view"
import { BookFiltersBar, BookFilters, defaultFilters } from "@/components/books/book-filters"
import { BulkActionsBar } from "@/components/books/bulk-actions-bar"
import { BulkDeleteDialog } from "@/components/books/bulk-delete-dialog"
import { BulkStatusDialog } from "@/components/books/bulk-status-dialog"
import { BulkCollectionDialog } from "@/components/books/bulk-collection-dialog"
import { useViewMode } from "@/hooks/use-view-mode"
import { useSelection } from "@/hooks/use-selection"
import { bulkDeleteBooks, bulkUpdateStatus, bulkAddToCollection } from "@/app/actions/book"

interface BooksClientWrapperProps {
    books: any[]
    emptyMessage?: string
}

export function BooksClientWrapper({ books, emptyMessage = "No books found" }: BooksClientWrapperProps) {
    const [viewMode, setViewMode] = useViewMode()
    const [filters, setFilters] = useState<BookFilters>(defaultFilters)
    const [selectMode, setSelectMode] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)

    const {
        selectedArray,
        selectedCount,
        toggleItem,
        toggleAll,
        clear,
        isSelected,
        isAllSelected,
    } = useSelection(books)

    // Extract unique genres from books
    const genres = useMemo(() => {
        const genreSet = new Set<string>()
        books.forEach((book) => {
            if (book.genre && typeof book.genre === "string" && book.genre.trim()) {
                genreSet.add(book.genre.trim())
            }
        })
        return Array.from(genreSet).sort()
    }, [books])

    // Apply filters and sorting
    const filteredBooks = useMemo(() => {
        let result = [...books]

        // Filter by genre
        if (filters.genre !== "all") {
            result = result.filter((book) => book.genre === filters.genre)
        }

        // Filter by format
        if (filters.format !== "all") {
            result = result.filter((book) => book.format === filters.format)
        }

        // Filter by reading status
        if (filters.readingStatus !== "all") {
            result = result.filter((book) => book.reading_status === filters.readingStatus)
        }

        // Filter by minimum rating
        if (filters.minRating > 0) {
            result = result.filter((book) => (book.rating || 0) >= filters.minRating)
        }

        // Sort
        switch (filters.sortBy) {
            case "oldest":
                result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                break
            case "newest":
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                break
            case "title_asc":
                result.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
                break
            case "title_desc":
                result.sort((a, b) => (b.title || "").localeCompare(a.title || ""))
                break
            case "rating_desc":
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
                break
            case "rating_asc":
                result.sort((a, b) => (a.rating || 0) - (b.rating || 0))
                break
        }

        return result
    }, [books, filters])

    const exitSelectMode = () => {
        setSelectMode(false)
        clear()
    }

    const handleBulkDelete = async () => {
        try {
            await bulkDeleteBooks(selectedArray)
            toast.success(`Deleted ${selectedCount} book${selectedCount !== 1 ? "s" : ""}`)
            exitSelectMode()
        } catch (error) {
            toast.error("Failed to delete books")
        }
    }

    const handleBulkStatusChange = async (status: string) => {
        try {
            await bulkUpdateStatus(selectedArray, status)
            toast.success(`Updated status for ${selectedCount} book${selectedCount !== 1 ? "s" : ""}`)
            exitSelectMode()
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const handleBulkAddToCollection = async (collectionId: string) => {
        try {
            await bulkAddToCollection(selectedArray, collectionId)
            toast.success(`Added ${selectedCount} book${selectedCount !== 1 ? "s" : ""} to collection`)
            exitSelectMode()
        } catch (error) {
            toast.error("Failed to add books to collection")
        }
    }

    if (books.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Plus className="h-8 w-8 text-muted-foreground" />
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
        <div className="space-y-4">
            {/* Toolbar with filters and view toggle */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {!selectMode && (
                        <BookFiltersBar
                            filters={filters}
                            onFiltersChange={setFilters}
                            genres={genres}
                        />
                    )}
                    {selectMode && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={toggleAll}
                            >
                                {isAllSelected ? (
                                    <CheckSquare className="h-4 w-4" />
                                ) : (
                                    <Square className="h-4 w-4" />
                                )}
                                {isAllSelected ? "Deselect All" : "Select All"}
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {selectedCount} selected
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex gap-1 shrink-0">
                    {/* Select mode toggle */}
                    <Button
                        variant={selectMode ? "default" : "outline"}
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
                    >
                        <CheckSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">{selectMode ? "Cancel" : "Select"}</span>
                    </Button>

                    {/* View mode toggle */}
                    {!selectMode && (
                        <>
                            <Button
                                variant={viewMode === "grid" ? "default" : "outline"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setViewMode("grid")}
                                title="Grid view"
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "outline"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setViewMode("list")}
                                title="List view"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Results count */}
            {filteredBooks.length !== books.length && (
                <p className="text-sm text-muted-foreground">
                    Showing {filteredBooks.length} of {books.length} books
                </p>
            )}

            {/* Empty state when filters produce no results */}
            {filteredBooks.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">No books match your filters</p>
                    <Button variant="outline" onClick={() => setFilters(defaultFilters)}>
                        Clear Filters
                    </Button>
                </div>
            )}

            {/* Conditional rendering based on view mode and select mode */}
            {filteredBooks.length > 0 && (
                viewMode === "grid" || selectMode ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredBooks.map((book) => (
                            <div key={book.id} className="relative">
                                {selectMode && (
                                    <div
                                        className="absolute top-2 left-2 z-10 cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            toggleItem(book.id)
                                        }}
                                    >
                                        <Checkbox
                                            checked={isSelected(book.id)}
                                            className="h-5 w-5 bg-background border-2"
                                        />
                                    </div>
                                )}
                                <div className={selectMode && isSelected(book.id) ? "ring-2 ring-primary rounded-lg" : ""}>
                                    <BookCard book={{ ...book, _id: book.id }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <BookListView books={filteredBooks} emptyMessage={emptyMessage} />
                )
            )}

            {/* Bulk actions bar */}
            {selectMode && selectedCount > 0 && (
                <BulkActionsBar
                    selectedCount={selectedCount}
                    onDelete={() => setDeleteDialogOpen(true)}
                    onChangeStatus={() => setStatusDialogOpen(true)}
                    onAddToCollection={() => setCollectionDialogOpen(true)}
                    onCancel={exitSelectMode}
                />
            )}

            {/* Bulk action dialogs */}
            <BulkDeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                selectedCount={selectedCount}
                onConfirm={handleBulkDelete}
            />
            <BulkStatusDialog
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
                selectedCount={selectedCount}
                onConfirm={handleBulkStatusChange}
            />
            <BulkCollectionDialog
                open={collectionDialogOpen}
                onOpenChange={setCollectionDialogOpen}
                selectedCount={selectedCount}
                onConfirm={handleBulkAddToCollection}
            />

            {/* Spacer for bulk actions bar */}
            {selectMode && selectedCount > 0 && <div className="h-20" />}
        </div>
    )
}
