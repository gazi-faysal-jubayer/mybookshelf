"use server"

import { auth } from "@/auth"
import connectDB from "@/lib/db"
import Book from "@/models/Book"

export async function getReadingStats() {
    try {
        const session = await auth()
        if (!session?.user?.id) return null

        await connectDB()

        const userId = session.user.id

        // 1. Total Books Completed
        const totalBooksRead = await Book.countDocuments({
            user_id: userId,
            reading_status: "completed",
        })

        // 2. Total Pages Read (for completed books)
        // using aggregate for sum
        const pagesResult = await Book.aggregate([
            {
                $match: {
                    user_id: userId, // Ensure we cast to ObjectId if needed, but mongoose usually handles string here if schema matches
                    // Actually aggregate with mongoose sometimes needs explicit ObjectId casting if raw values are Strings in DB but Schema is ObjectId.
                    // But AuthJs userid is string. Mongoose ref is ObjectId. 
                    // Let's rely on Mongoose automatic casting or manual if it fails.
                    // Safe way: just find using model logic or simple iteration if dataset is small.
                    // For scalability, let's try aggregate.
                    reading_status: "completed"
                }
            },
            {
                $group: {
                    _id: null,
                    totalPages: { $sum: "$pages" }
                }
            }
        ])

        // Fix for aggregate match if user_id is stored as ObjectId
        // We might need new mongoose.Types.ObjectId(userId)
        // Let's try simple find first to avoid casting issues in this "use server" context without importing mongoose types if possible,
        // or just import mongoose.

        // Actually, let's import mongoose to be safe.
        // But wait, I'll stick to a simpler approach first given we might not have huge data.
        // Fetching all completed books is safer for logic if stats are complex.
        const completedBooks = await Book.find({
            user_id: userId,
            reading_status: "completed"
        }).select("pages genre updatedAt purchase_info").lean()

        const totalPagesRead = completedBooks.reduce((sum, book) => sum + (book.pages || 0), 0)

        // 3. Genre Distribution
        const genreCounts: Record<string, number> = {}
        completedBooks.forEach(book => {
            if (book.genre && Array.isArray(book.genre)) {
                book.genre.forEach(g => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1
                })
            }
        })

        const genreData = Object.entries(genreCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5) // Top 5 genres

        // 4. Monthly Activity (Last 6 months)
        /*
          We want to group by Month.
          If `purchase_info.date` or `updatedAt` is used as "read date".
          Ideally we'd have a "finished_at" date.
          For now, I'll use `updatedAt` as a proxy for when it was marked completed.
        */
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

        completedBooks.forEach(book => {
            const date = new Date(book.updatedAt)
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
