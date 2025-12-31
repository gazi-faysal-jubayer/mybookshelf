"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function SearchHeader() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get("q") || ""
    const [query, setQuery] = useState(initialQuery)
    // Debounce likely not needed if we trigger search on 'Enter' or filtering button, 
    // but good for UX if we want auto-search. Let's stick to "Enter" or explicit search for now as it's cleaner without complex state.
    // Actually, user expects typing to search usually or hitting enter.
    // Let's implement simple "Enter" to search.

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams.toString())
        if (query) {
            params.set("q", query)
        } else {
            params.delete("q")
        }
        router.push(`/dashboard/search?${params.toString()}`)
    }

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">Advanced Search</h1>
            <form onSubmit={handleSearch} className="relative max-w-lg">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by title or author..."
                    className="pl-8"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </form>
        </div>
    )
}
