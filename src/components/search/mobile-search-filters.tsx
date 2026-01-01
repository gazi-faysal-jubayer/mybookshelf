"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SearchFiltersContent } from "./search-filters-content"

interface MobileSearchFiltersProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export function MobileSearchFilters({ searchParams }: MobileSearchFiltersProps) {
    const [open, setOpen] = useState(false)
    const search = useSearchParams()

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0
        if (search.get("genre") && search.get("genre") !== "all") count++
        if (search.get("status") && search.get("status") !== "all") count++
        if (search.get("minRating") && Number(search.get("minRating")) > 0) count++
        if (search.get("sort") && search.get("sort") !== "newest") count++
        return count
    }, [search])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Filters & Sort</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                    <SearchFiltersContent
                        searchParams={searchParams}
                        onApply={() => setOpen(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
