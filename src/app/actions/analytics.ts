"use server"

import { createClient, getUser } from "@/lib/supabase/server"

export async function getReadingStats() {
    try {
        const user = await getUser()
        if (!user) return null

        const supabase = await createClient()

        // Get completed books
        const { data: completedBooks } = await supabase
            .from('books')
            .select('pages, genre, updated_at')
            .eq('user_id', user.id)
            .eq('reading_status', 'completed')
            .returns<{ pages: number | null, genre: string[], updated_at: string }[]>() // Use 'pages' column, though schema says 'pages' it might be 'total_pages' depending on migration, but let's stick to existing code or check. Schema 002 says 'pages', schema 001/012 updates might have used 'total_pages'. 002 says `pages INTEGER`. Let's assume `pages`.

        // Get reading sessions for granular stats
        const { data: sessions } = await supabase
            .from('reading_sessions')
            .select('pages_read, session_date')
            .eq('user_id', user.id)
            .gte('session_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
            .order('session_date', { ascending: true })

        // 1. Total Books Completed
        const totalBooksRead = completedBooks?.length || 0

        // 2. Total Pages Read (from sessions if available, fallback to books)
        // We'll calculate a "All Time" pages read from all sessions if we fetched all, but for now let's just use what we have or do a separate count.
        // Actually, for "All Time Pages", a separate query is better.
        const { data: allSessionsSum } = await supabase.rpc('get_total_pages_read', { user_uuid: user.id })
        // If RPC doesn't exist, fallback to sessions calculation or just books.
        // Let's stick to safe client-side calc for now if dataset small, or just sum 'total_pages' of completed books + current progress.
        // Existing code used completedBooks.reduce. Let's keep that but augment with current progress? 
        // Simple approach: Total Pages = Sum of pages_read in ALL sessions.
        const { data: totalPagesResult } = await supabase
            .from('reading_sessions')
            .select('pages_read')
            .eq('user_id', user.id)

        const totalPagesRead = totalPagesResult?.reduce((sum, s) => sum + (s.pages_read || 0), 0) || 0

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
            .slice(0, 5)

        // 4. Monthly Activity (Books Finished) - Last 6 months
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

        // 5. Daily Reading Activity (Pages Read) - Last 30 days
        const last30Days = new Array(30).fill(0).map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (29 - i))
            return {
                date: d.toISOString().split('T')[0],
                name: d.getDate().toString(), // Just day number for chart
                pages: 0
            }
        })

        sessions?.forEach(session => {
            const sessionDate = new Date(session.session_date).toISOString().split('T')[0]
            const dayStat = last30Days.find(d => d.date === sessionDate)
            if (dayStat) {
                dayStat.pages += session.pages_read
            }
        })

        return {
            totalBooksRead,
            totalPagesRead,
            genreData,
            monthlyActivity: last6Months.map(m => ({ name: m.name, count: m.count })), // Books finished
            dailyActivity: last30Days.map(d => ({ name: d.name, pages: d.pages })) // Pages read
        }

    } catch (error) {
        console.error("Failed to fetch analytics:", error)
        return null
    }
}
