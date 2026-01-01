"use client"

import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition, useCallback } from "react"

export function SearchHeader() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get("q") || ""
    const [query, setQuery] = useState(initialQuery)
    const [isPending, startTransition] = useTransition()

    // Update query state when URL changes (e.g., browser back/forward)
    useEffect(() => {
        setQuery(searchParams.get("q") || "")
    }, [searchParams])

    // Debounced search - triggers after 300ms of no typing
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentUrlQuery = searchParams.get("q") || ""
            if (query !== currentUrlQuery) {
                startTransition(() => {
                    const params = new URLSearchParams(searchParams.toString())
                    if (query) {
                        params.set("q", query)
                    } else {
                        params.delete("q")
                    }
                    router.push(`/dashboard/search?${params.toString()}`)
                })
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, searchParams, router])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Immediate search on form submit
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
                {isPending ? (
                    <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                )}
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
