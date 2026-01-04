"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ReadingSession {
    id: string
    book_id: string
    user_id: string
    session_date: string
    start_page: number | null
    end_page: number | null
    pages_read: number
    time_spent_minutes: number | null
    notes: string | null
    mood: string | null
    session_rating: number | null
    created_at: string
}

export interface AddSessionData {
    session_date?: Date
    start_page?: number
    end_page?: number
    pages_read: number
    time_spent_minutes?: number
    notes?: string
    mood?: string
    session_rating?: number
}

// Start reading a book
export async function startReading(bookId: string, totalPages?: number) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    const updateData: any = {
        reading_status: "currently_reading",
        reading_started_at: new Date().toISOString(),
        current_page: 0,
    }

    if (totalPages) {
        updateData.pages = totalPages
    }

    const { error } = await supabase
        .from("books")
        .update(updateData)
        .eq("id", bookId)
        .eq("user_id", user.id)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/books/${bookId}`)
    revalidatePath("/dashboard")

    return { success: true }
}

// Add a reading session
export async function addReadingSession(bookId: string, data: AddSessionData) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    // Get current book data
    const { data: book } = await supabase
        .from("books")
        .select("title, author, cover_image, current_page, pages, reading_started_at")
        .eq("id", bookId)
        .eq("user_id", user.id)
        .single()

    if (!book) throw new Error("Book not found")

    // If reading hasn't started yet, start it
    if (!book.reading_started_at) {
        await supabase
            .from("books")
            .update({
                reading_status: "currently_reading",
                reading_started_at: new Date().toISOString(),
            })
            .eq("id", bookId)
            .eq("user_id", user.id)
    }

    // Insert reading session
    const { data: session, error: sessionError } = await supabase
        .from("reading_sessions")
        .insert({
            book_id: bookId,
            user_id: user.id,
            session_date: data.session_date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
            start_page: data.start_page,
            end_page: data.end_page,
            // pages_read is generated automatically by DB
            time_spent_minutes: data.time_spent_minutes,
            notes: data.notes,
            mood: data.mood,
            session_rating: data.session_rating,
        })
        .select()
        .single()

    if (sessionError) throw new Error(sessionError.message)

    // Create feed post
    await supabase.from("posts").insert({
        user_id: user.id,
        type: "reading_session",
        content: data.notes || `Read ${data.pages_read} pages of ${book.title}`,
        metadata: {
            bookId: bookId,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookCover: book.cover_image,
            pagesRead: data.pages_read,
            sessionId: session.id,
            mood: data.mood
        }
    })

    // Update book's current page
    const newCurrentPage = data.end_page || (book.current_page || 0) + data.pages_read
    const isFinished = book.pages && newCurrentPage >= book.pages

    await supabase
        .from("books")
        .update({
            current_page: newCurrentPage,
            reading_status: isFinished ? "completed" : "currently_reading",
            reading_finished_at: isFinished ? new Date().toISOString() : null,
        })
        .eq("id", bookId)
        .eq("user_id", user.id)

    revalidatePath(`/dashboard/books/${bookId}`)
    revalidatePath("/dashboard")

    return { success: true }
}

// Update progress (quick update)
export async function updateProgress(bookId: string, currentPage: number) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    // Get book data
    const { data: book } = await supabase
        .from("books")
        .select("current_page, pages")
        .eq("id", bookId)
        .eq("user_id", user.id)
        .single()

    if (!book) throw new Error("Book not found")

    const isFinished = book.pages && currentPage >= book.pages

    const { error } = await supabase
        .from("books")
        .update({
            current_page: currentPage,
            reading_status: isFinished ? "completed" : "currently_reading",
            reading_finished_at: isFinished ? new Date().toISOString() : null,
        })
        .eq("id", bookId)
        .eq("user_id", user.id)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/books/${bookId}`)
    revalidatePath("/dashboard")

    return { success: true }
}

// Update total pages
// Update total pages
export async function updateTotalPages(bookId: string, totalPages: number) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    if (!totalPages || totalPages < 1) {
        throw new Error("Total pages must be a positive number")
    }

    const supabase = await createClient()

    // First check if book exists and belongs to user
    const { data: book, error: checkError } = await supabase
        .from("books")
        .select("id")
        .eq("id", bookId)
        .eq("user_id", user.id)
        .single()

    if (checkError || !book) {
        throw new Error("Book not found or access denied")
    }

    const { error } = await supabase
        .from("books")
        .update({ pages: totalPages })
        .eq("id", bookId)
        .eq("user_id", user.id)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/books/${bookId}`)

    return { success: true }
}

// Finish reading a book
export async function finishReading(bookId: string, rating?: number) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    // Get book's total pages to set current_page
    const { data: book } = await supabase
        .from("books")
        .select("pages")
        .eq("id", bookId)
        .eq("user_id", user.id)
        .single()

    const updateData: any = {
        reading_status: "completed",
        reading_finished_at: new Date().toISOString(),
    }

    if (book?.pages) {
        updateData.current_page = book.pages
    }

    if (rating) {
        updateData.rating = rating
    }

    const { error } = await supabase
        .from("books")
        .update(updateData)
        .eq("id", bookId)
        .eq("user_id", user.id)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/books/${bookId}`)
    revalidatePath("/dashboard")

    return { success: true }
}

// Get reading sessions for a book
export async function getReadingSessions(bookId: string): Promise<ReadingSession[]> {
    const user = await getUser()
    if (!user) return []

    const supabase = await createClient()

    const { data, error } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .order("session_date", { ascending: false })

    if (error) {
        console.error("Error fetching reading sessions:", error)
        return []
    }

    return data || []
}

// Get reading stats for a book
export async function getReadingStats(bookId: string) {
    const user = await getUser()
    if (!user) return null

    const supabase = await createClient()

    const { data: sessions } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("book_id", bookId)
        .eq("user_id", user.id)

    if (!sessions || sessions.length === 0) {
        return {
            totalSessions: 0,
            totalPagesRead: 0,
            totalTimeSpent: 0,
            averagePagesPerSession: 0,
            averageTimePerSession: 0,
            longestSession: 0,
            readingDays: 0,
        }
    }

    const totalPagesRead = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0)
    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.time_spent_minutes || 0), 0)
    const sessionsWithTime = sessions.filter((s) => s.time_spent_minutes)

    return {
        totalSessions: sessions.length,
        totalPagesRead,
        totalTimeSpent,
        averagePagesPerSession: Math.round(totalPagesRead / sessions.length),
        averageTimePerSession: sessionsWithTime.length
            ? Math.round(totalTimeSpent / sessionsWithTime.length)
            : 0,
        longestSession: Math.max(...sessions.map((s) => s.pages_read || 0)),
        readingDays: new Set(sessions.map((s) => s.session_date)).size,
    }
}

// Delete a reading session
export async function deleteReadingSession(sessionId: string) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    // Get session to find book_id for revalidation
    const { data: session } = await supabase
        .from("reading_sessions")
        .select("book_id")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single()

    const { error } = await supabase
        .from("reading_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id)

    if (error) throw new Error(error.message)

    if (session) {
        revalidatePath(`/dashboard/books/${session.book_id}`)
    }

    return { success: true }
}
