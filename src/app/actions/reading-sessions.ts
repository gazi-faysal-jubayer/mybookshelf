"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createPost } from "@/app/actions/posts"
import { createNewJourney, getActiveJourney } from "@/app/actions/journeys"
import * as fs from 'fs';
import * as path from 'path';

function logToFile(message: string, data?: any) {
    const logPath = path.join(process.cwd(), 'server-debug.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (e) {
        console.error("Failed to write to log file", e);
    }
}

export interface ReadingSession {
    id: string
    book_id: string
    user_id: string
    session_date: string
    start_page: number | null
    end_page: number | null
    pages_read: number
    duration_minutes: number | null
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
    logToFile("Adding reading session START", { bookId, data })
    try {
        const user = await getUser()
        if (!user) {
            logToFile("addReadingSession: User not authenticated")
            throw new Error("Not authenticated")
        }
        logToFile("addReadingSession: User authenticated", { userId: user.id })

        const supabase = await createClient()

        // Get current book data
        const { data: book, error: bookError } = await supabase
            .from("books")
            .select("title, author, cover_image, current_page, pages, reading_started_at")
            .eq("id", bookId)
            .eq("user_id", user.id)
            .single()

        if (bookError || !book) {
            logToFile("addReadingSession: Book not found error", { bookError, bookId, userId: user.id })
            throw new Error("Book not found")
        }

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

        // Get or create active journey
        let activeJourney = await getActiveJourney(bookId)
        if (!activeJourney) {
            const result = await createNewJourney(bookId, 'public')
            if (result.success && result.journeyId) {
                activeJourney = await getActiveJourney(bookId)
            }
        }

        if (!activeJourney) {
            throw new Error("Failed to create or get active journey")
        }

        logToFile("Active journey found/created", { journeyId: activeJourney.id })

        const insertData = {
            book_id: bookId,
            user_id: user.id,
            journey_id: activeJourney.id,
            session_date: data.session_date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
            start_page: data.start_page,
            end_page: data.end_page,
            pages_read: data.pages_read,
            duration_minutes: data.time_spent_minutes,
            notes: data.notes,
            mood: data.mood,
        }
        logToFile("Inserting session:", insertData)

        // Insert reading session
        const { data: session, error: sessionError } = await supabase
            .from("reading_sessions")
            .insert(insertData)
            .select()
            .single()

        if (sessionError) {
            logToFile("Session insert error:", sessionError)
            throw new Error(sessionError.message)
        }

        logToFile("Session inserted successfully", session)

        // Create feed post (optimistic - don't fail session if this fails)
        try {
            const { error: postError } = await supabase.from("posts").insert({
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

            if (postError) {
                logToFile("Failed to create feed post:", postError)
            }
        } catch (error) {
            logToFile("Error creating feed post:", error)
        }

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
    } catch (e) {
        logToFile("Top level error in addReadingSession:", e)
        throw e
    }
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
export async function finishReading(bookId: string, rating?: number, review?: string) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    try {
        // 1. Get book details
        const { data: book, error: bookError } = await supabase
            .from("books")
            .select("title, author, cover_image, pages, reading_started_at")
            .eq("id", bookId)
            .eq("user_id", user.id)
            .single()

        if (bookError || !book) throw new Error("Book not found")

        // 2. Get or create active journey
        let activeJourney = await getActiveJourney(bookId)
        if (!activeJourney) {
            const result = await createNewJourney(bookId, 'public')
            if (result.success && result.journeyId) {
                activeJourney = await getActiveJourney(bookId)
            }
        }

        // 3. Complete the active journey
        if (activeJourney) {
            await supabase
                .from("reading_journeys")
                .update({
                    status: 'completed',
                    finished_at: new Date().toISOString(),
                    rating: rating,
                    review: review,
                })
                .eq("id", activeJourney.id)
                .eq("user_id", user.id)
        }

        // 4. Update Book Status
        const updateData: any = {
            reading_status: "completed",
            reading_finished_at: new Date().toISOString(),
        }

        if (book.pages) {
            updateData.current_page = book.pages
        }

        if (rating) {
            updateData.rating = rating
        }

        if (review) {
            updateData.review = review // Assuming book table has review column, if not, it's just in journey
        }

        const { error: updateError } = await supabase
            .from("books")
            .update(updateData)
            .eq("id", bookId)
            .eq("user_id", user.id)

        if (updateError) throw new Error(updateError.message)

        // 5. Create Feed Post
        await createPost({
            content: `just finished reading "${book.title}" by ${book.author}!`,
            visibility: "public",
            bookId: bookId
        }).catch(err => console.error("Failed to create completion post:", err))

        revalidatePath(`/dashboard/books/${bookId}`)
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error) {
        console.error("Finish reading error:", error)
        throw error
    }
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
    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    const sessionsWithTime = sessions.filter((s) => s.duration_minutes)

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
