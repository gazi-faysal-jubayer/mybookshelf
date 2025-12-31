"use server"

import { auth } from "@/auth"
import connectDB from "@/lib/db"
import Book from "@/models/Book"

export interface SearchFilters {
    query?: string
    genre?: string
    status?: string
    minRating?: number
    sort?: string
}

export async function searchBooks(filters: SearchFilters) {
    try {
        const session = await auth()
        if (!session?.user?.id) return []

        await connectDB()

        const query: any = { user_id: session.user.id }

        if (filters.query) {
            // Case-insensitive search on title or author
            query.$or = [
                { title: { $regex: filters.query, $options: "i" } },
                { author: { $regex: filters.query, $options: "i" } },
            ]
        }

        if (filters.genre && filters.genre !== "all") {
            query.genre = filters.genre
        }

        if (filters.status && filters.status !== "all") {
            query.reading_status = filters.status
        }

        if (filters.minRating && filters.minRating > 0) {
            query.rating = { $gte: filters.minRating }
        }

        let sortOption: any = { createdAt: -1 } // Default sort

        if (filters.sort === "title_asc") sortOption = { title: 1 }
        if (filters.sort === "title_desc") sortOption = { title: -1 }
        if (filters.sort === "rating_desc") sortOption = { rating: -1 }
        if (filters.sort === "rating_asc") sortOption = { rating: 1 }
        if (filters.sort === "newest") sortOption = { createdAt: -1 }
        if (filters.sort === "oldest") sortOption = { createdAt: 1 }

        const books = await Book.find(query)
            .sort(sortOption)
            .lean()

        // Convert _id and dates to plain strings/numbers if needed for client, 
        // though .lean() returns POJO, ObjectIds usually need toString() for key props in React lists if strict.
        return JSON.parse(JSON.stringify(books))

    } catch (error) {
        console.error("Search failed:", error)
        throw new Error("Failed to search books")
    }
}

export async function getUniqueGenres() {
    try {
        const session = await auth()
        if (!session?.user?.id) return []
        await connectDB()

        const genres = await Book.distinct("genre", { user_id: session.user.id })
        return genres.sort()
    } catch (error) {
        console.error("Failed to fetch genres:", error)
        return []
    }
}
