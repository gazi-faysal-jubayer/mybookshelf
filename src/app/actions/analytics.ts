"use server"

import { createClient, getUser } from "@/lib/supabase/server"

export async function getReadingStats() {
    try {
        const user = await getUser()
        if (!user) return null

        const supabase = await createClient()

        // Get completed books
        const { data: completedBooks, error } = await supabase
            .from('books')
            .select('pages, genre, updated_at')
            .eq('user_id', user.id)
            .eq('reading_status', 'completed')
            .returns<{ pages: number | null, genre: string[], updated_at: string }[]>()

        if (error) {
            console.error("Supabase error:", error)
            return null
        }

        // 1. Total Books Completed
        const totalBooksRead = completedBooks?.length || 0

        // 2. Total Pages Read
        const totalPagesRead = completedBooks?.reduce((sum, book) => sum + (book.pages || 0), 0) || 0

        // 3. Genre Distribution
        const genreCounts: Record<string, number> = {}
        completedBooks?.forEach(book => {
            if (book.genre && Array.isArray(book.genre)) {
                book.genre.forEach((g: string) => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1
                })
            }
        })

        const genreData = Object.entries(genreCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5) // Top 5 genres

        // 4. Monthly Activity (Last 6 months)
        const last6Months = new Array(6).fill(0).map((_, i) => {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            return {
                name: d.toLocaleString('default', { month: 'short' }),
                month: d.getMonth(),
                year: d.getFullYear(),
                count: 0
            }
        }).reverse()

        completedBooks?.forEach(book => {
            const date = new Date(book.updated_at)
            const monthIdx = last6Months.findIndex(m => m.month === date.getMonth() && m.year === date.getFullYear())
            if (monthIdx !== -1) {
                last6Months[monthIdx].count++
            }
        })

        return {
            totalBooksRead,
            totalPagesRead,
            genreData,
            monthlyActivity: last6Months.map(m => ({ name: m.name, count: m.count }))
        }

    } catch (error) {
        console.error("Failed to fetch analytics:", error)
        return null
    }
}
