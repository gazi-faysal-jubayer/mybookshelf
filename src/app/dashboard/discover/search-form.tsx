"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"

interface SearchFormProps {
    defaultQuery?: string
    defaultGenre?: string
    defaultAvailable?: boolean
    defaultNearby?: boolean
    defaultSort?: 'relevance' | 'distance' | 'rating' | 'newest'
}

const GENRES = [
    "Fiction",
    "Non-Fiction",
    "Mystery",
    "Science Fiction",
    "Fantasy",
    "Romance",
    "Thriller",
    "Biography",
    "History",
    "Self-Help",
    "Business",
    "Science",
    "Philosophy",
    "Poetry",
    "Children's",
    "Young Adult"
]

export function SearchForm({
    defaultQuery = "",
    defaultGenre = "",
    defaultAvailable = false,
    defaultNearby = false,
    defaultSort = "relevance"
}: SearchFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    
    const [query, setQuery] = useState(defaultQuery)
    const [genre, setGenre] = useState(defaultGenre)
    const [availableOnly, setAvailableOnly] = useState(defaultAvailable)
    const [nearbyOnly, setNearbyOnly] = useState(defaultNearby)
    const [sortBy, setSortBy] = useState(defaultSort)
    const [showFilters, setShowFilters] = useState(false)

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault()
        
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (genre) params.set('genre', genre)
        if (availableOnly) params.set('available', 'true')
        if (nearbyOnly) params.set('nearby', 'true')
        if (sortBy && sortBy !== 'relevance') params.set('sort', sortBy)

        startTransition(() => {
            router.push(`/dashboard/discover?${params.toString()}`)
        })
    }

    const clearFilters = () => {
        setQuery("")
        setGenre("")
        setAvailableOnly(false)
        setNearbyOnly(false)
        setSortBy("relevance")
        startTransition(() => {
            router.push('/dashboard/discover')
        })
    }

    const hasFilters = query || genre || availableOnly || nearbyOnly

    return (
        <form onSubmit={handleSearch} className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search by title, author, or ISBN..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Searching..." : "Search"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                </Button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Genre */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Genre</label>
                            <Select value={genre} onValueChange={setGenre}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All genres" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All genres</SelectItem>
                                    {GENRES.map((g) => (
                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sort */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sort by</label>
                            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="relevance">Relevance</SelectItem>
                                    <SelectItem value="distance">Distance</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={availableOnly}
                                onCheckedChange={(checked) => setAvailableOnly(checked as boolean)}
                            />
                            <span className="text-sm">Available for lending only</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={nearbyOnly}
                                onCheckedChange={(checked) => setNearbyOnly(checked as boolean)}
                            />
                            <span className="text-sm">Near me (within 25 km)</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={isPending}>
                            Apply Filters
                        </Button>
                        {hasFilters && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={clearFilters}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear all
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </form>
    )
}
