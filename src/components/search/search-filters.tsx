"use client"

import { SearchFiltersContent } from "./search-filters-content"

export function SearchFilters({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    return (
        <SearchFiltersContent searchParams={searchParams} />
    )
}
