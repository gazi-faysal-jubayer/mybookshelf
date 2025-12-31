"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { getUniqueGenres } from "@/app/actions/search"

export function SearchFilters({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const router = useRouter()
    const search = useSearchParams()

    const [genres, setGenres] = useState<string[]>([])

    // Local state for filters to avoid rapid URL updates
    const [selectedGenre, setSelectedGenre] = useState(searchParams.genre as string || "all")
    const [selectedStatus, setSelectedStatus] = useState(searchParams.status as string || "all")
    const [minRating, setMinRating] = useState(Number(searchParams.minRating) || 0)
    const [sort, setSort] = useState(searchParams.sort as string || "newest")

    useEffect(() => {
        getUniqueGenres().then(setGenres)
    }, [])

    const applyFilters = () => {
        const params = new URLSearchParams(search.toString())

        if (selectedGenre && selectedGenre !== "all") params.set("genre", selectedGenre)
        else params.delete("genre")

        if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus)
        else params.delete("status")

        if (minRating > 0) params.set("minRating", minRating.toString())
        else params.delete("minRating")

        if (sort) params.set("sort", sort)
        else params.delete("sort")

        router.push(`/dashboard/search?${params.toString()}`)
    }

    const clearFilters = () => {
        setSelectedGenre("all")
        setSelectedStatus("all")
        setMinRating(0)
        setSort("newest")
        router.push("/dashboard/search")
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="mb-4 text-lg font-semibold">Filters</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Sort By</Label>
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest Added</SelectItem>
                                <SelectItem value="oldest">Oldest Added</SelectItem>
                                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                                <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                                <SelectItem value="rating_desc">Highest Rated</SelectItem>
                                <SelectItem value="rating_asc">Lowest Rated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Any Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any Status</SelectItem>
                                <SelectItem value="to_read">To Read</SelectItem>
                                <SelectItem value="currently_reading">Reading</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="abandoned">Abandoned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Genre</Label>
                        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                            <SelectTrigger>
                                <SelectValue placeholder="Any Genre" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any Genre</SelectItem>
                                {genres.map(g => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between">
                            <Label>Min Rating</Label>
                            <span className="text-sm text-muted-foreground">{minRating} Stars</span>
                        </div>
                        <Slider
                            value={[minRating]}
                            min={0}
                            max={5}
                            step={1}
                            onValueChange={(vals) => setMinRating(vals[0])}
                        />
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <Button onClick={applyFilters}>Apply Filters</Button>
                <Button variant="outline" onClick={clearFilters}>Reset</Button>
            </div>
        </div>
    )
}
