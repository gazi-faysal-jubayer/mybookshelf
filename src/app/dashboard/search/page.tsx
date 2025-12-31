import { Suspense } from "react"
import { SearchFilters } from "@/components/search/search-filters"
import { SearchResults } from "@/components/search/search-results"
import { SearchHeader } from "@/components/search/search-header"

export default function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    return (
        <div className="flex flex-col gap-6">
            <SearchHeader />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <Suspense fallback={<div>Loading filters...</div>}>
                        <SearchFilters searchParams={searchParams} />
                    </Suspense>
                </div>
                <div className="md:col-span-3">
                    <Suspense fallback={<div>Searching...</div>}>
                        <SearchResults searchParams={searchParams} />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
