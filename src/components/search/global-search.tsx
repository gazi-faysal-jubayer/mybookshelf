"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function GlobalSearch() {
    const router = useRouter()
    const [query, setQuery] = useState("")

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            router.push(`/dashboard/search?q=${encodeURIComponent(query)}`)
        }
    }

    return (
        <form onSubmit={handleSearch} className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search books..."
                    className="pl-8 w-full sm:w-[200px] md:w-[250px] lg:w-[300px]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
        </form>
    )
}
