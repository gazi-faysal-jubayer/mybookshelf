"use server"

import { createClient, getUser } from "@/lib/supabase/server"

export interface SearchFilters {
    query?: string
    genre?: string
    status?: string
    minRating?: number
    sort?: string
}

export async function searchBooks(filters: SearchFilters) {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        let query = supabase
            .from('books')
            .select('*')
            .eq('user_id', user.id)

        // Search by title or author (case-insensitive)
        if (filters.query && filters.query.trim()) {
            const searchTerm = filters.query.trim()
            query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`)
        }

        // Filter by genre - genre is stored as an array, use contains operator
        if (filters.genre && filters.genre !== "all") {
            query = query.contains('genre', [filters.genre])
        }

        // Filter by reading status
        if (filters.status && filters.status !== "all") {
            query = query.eq('reading_status', filters.status)
        }

        // Filter by minimum rating
        if (filters.minRating && filters.minRating > 0) {
            query = query.gte('rating', filters.minRating)
        }

        // Sorting
        let sortColumn = 'created_at'
        let ascending = false

        switch (filters.sort) {
            case "title_asc":
                sortColumn = 'title'
                ascending = true
                break
            case "title_desc":
                sortColumn = 'title'
                ascending = false
                break
            case "rating_desc":
                sortColumn = 'rating'
                ascending = false
                break
            case "rating_asc":
                sortColumn = 'rating'
                ascending = true
                break
            case "oldest":
                sortColumn = 'created_at'
                ascending = true
                break
            case "newest":
            default:
                sortColumn = 'created_at'
                ascending = false
                break
        }

        query = query.order(sortColumn, { ascending, nullsFirst: false })

        const { data: books, error } = await query

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Transform to match old format with _id
        return (books || []).map(book => ({
            ...book,
            _id: book.id
        }))

    } catch (error) {
        console.error("Search failed:", error)
        return []
    }
}

export async function getUniqueGenres() {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        const { data: books, error } = await supabase
            .from('books')
            .select('genre')
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Extract unique genres from all books
        const allGenres = new Set<string>()
        books?.forEach(book => {
            if (book.genre && Array.isArray(book.genre)) {
                book.genre.forEach((g: string) => allGenres.add(g))
            }
        })

        return Array.from(allGenres).sort()
    } catch (error) {
        console.error("Failed to fetch genres:", error)
        return []
    }
}
