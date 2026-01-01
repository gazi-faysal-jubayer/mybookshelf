"use client"

import { useMemo } from "react"
import { Filter, X, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"

export interface BookFilters {
    genre: string
    format: string
    readingStatus: string
    minRating: number
    sortBy: string
}

interface BookFiltersProps {
    filters: BookFilters
    onFiltersChange: (filters: BookFilters) => void
    genres: string[]
}

const defaultFilters: BookFilters = {
    genre: "all",
    format: "all",
    readingStatus: "all",
    minRating: 0,
    sortBy: "newest",
}

export function BookFiltersBar({ filters, onFiltersChange, genres }: BookFiltersProps) {
    const activeFilterCount = useMemo(() => {
        let count = 0
        if (filters.genre !== "all") count++
        if (filters.format !== "all") count++
        if (filters.readingStatus !== "all") count++
        if (filters.minRating > 0) count++
        if (filters.sortBy !== "newest") count++
        return count
    }, [filters])

    const clearFilters = () => {
        onFiltersChange(defaultFilters)
    }

    const updateFilter = <K extends keyof BookFilters>(key: K, value: BookFilters[K]) => {
        onFiltersChange({ ...filters, [key]: value })
    }

    return (
        <>
            {/* Desktop filters */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
                {/* Sort */}
                <Select value={filters.sortBy} onValueChange={(v) => updateFilter("sortBy", v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                        <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                        <SelectItem value="rating_desc">Highest Rated</SelectItem>
                        <SelectItem value="rating_asc">Lowest Rated</SelectItem>
                    </SelectContent>
                </Select>

                {/* Genre */}
                {genres.length > 0 && (
                    <Select value={filters.genre} onValueChange={(v) => updateFilter("genre", v)}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder="Genre" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Genres</SelectItem>
                            {genres.map((g) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Format */}
                <Select value={filters.format} onValueChange={(v) => updateFilter("format", v)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Formats</SelectItem>
                        <SelectItem value="hardcover">Hardcover</SelectItem>
                        <SelectItem value="paperback">Paperback</SelectItem>
                        <SelectItem value="ebook">E-Book</SelectItem>
                        <SelectItem value="audiobook">Audiobook</SelectItem>
                    </SelectContent>
                </Select>

                {/* Reading Status */}
                <Select value={filters.readingStatus} onValueChange={(v) => updateFilter("readingStatus", v)}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="to_read">To Read</SelectItem>
                        <SelectItem value="currently_reading">Reading</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="abandoned">Abandoned</SelectItem>
                    </SelectContent>
                </Select>

                {/* Clear filters button */}
                {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={clearFilters}>
                        <X className="h-3 w-3" />
                        Clear ({activeFilterCount})
                    </Button>
                )}
            </div>

            {/* Mobile filters button */}
            <div className="md:hidden">
                <MobileFiltersSheet
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                    genres={genres}
                    activeFilterCount={activeFilterCount}
                />
            </div>
        </>
    )
}

function MobileFiltersSheet({
    filters,
    onFiltersChange,
    genres,
    activeFilterCount,
}: BookFiltersProps & { activeFilterCount: number }) {
    const updateFilter = <K extends keyof BookFilters>(key: K, value: BookFilters[K]) => {
        onFiltersChange({ ...filters, [key]: value })
    }

    const clearFilters = () => {
        onFiltersChange(defaultFilters)
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                    <SheetTitle>Filter & Sort</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                    <div className="space-y-2">
                        <Label>Sort By</Label>
                        <Select value={filters.sortBy} onValueChange={(v) => updateFilter("sortBy", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                                <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                                <SelectItem value="rating_desc">Highest Rated</SelectItem>
                                <SelectItem value="rating_asc">Lowest Rated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {genres.length > 0 && (
                        <div className="space-y-2">
                            <Label>Genre</Label>
                            <Select value={filters.genre} onValueChange={(v) => updateFilter("genre", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Any Genre" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Genres</SelectItem>
                                    {genres.map((g) => (
                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Format</Label>
                        <Select value={filters.format} onValueChange={(v) => updateFilter("format", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Any Format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Formats</SelectItem>
                                <SelectItem value="hardcover">Hardcover</SelectItem>
                                <SelectItem value="paperback">Paperback</SelectItem>
                                <SelectItem value="ebook">E-Book</SelectItem>
                                <SelectItem value="audiobook">Audiobook</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Reading Status</Label>
                        <Select value={filters.readingStatus} onValueChange={(v) => updateFilter("readingStatus", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Any Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="to_read">To Read</SelectItem>
                                <SelectItem value="currently_reading">Reading</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="abandoned">Abandoned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Label>Minimum Rating</Label>
                            <span className="text-sm text-muted-foreground">{filters.minRating} Stars</span>
                        </div>
                        <Slider
                            value={[filters.minRating]}
                            min={0}
                            max={5}
                            step={1}
                            onValueChange={(vals) => updateFilter("minRating", vals[0])}
                        />
                    </div>

                    <Button variant="outline" className="w-full" onClick={clearFilters}>
                        Clear All Filters
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export { defaultFilters }
