"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types
export type VisibilityLevel = 'public' | 'connections' | 'private'
export type JourneyStatus = 'active' | 'completed' | 'abandoned' | 'archived'

export interface ReadingJourney {
    id: string
    book_id: string
    user_id: string
    status: JourneyStatus
    visibility: VisibilityLevel
    started_at: string
    finished_at: string | null
    rating: number | null
    review: string | null
    session_name: string | null
    abandon_reason: string | null
    is_hidden_by_owner: boolean
    created_at: string
    updated_at: string
    // Joined data
    book?: {
        title: string
        author: string
        cover_image: string | null
    }
    user?: {
        username: string
        full_name: string | null
        profile_picture: string | null
    }
    sessions_count?: number
    thoughts_count?: number
}

// Create a new reading journey (reading season)
export async function createNewJourney(
    bookId: string,
    visibility: VisibilityLevel = 'public',
    sessionName?: string
): Promise<{ success: boolean; journeyId?: string; error?: string; activeJourneyId?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        // Check if there's already an active journey for this book
        const { data: existingJourney } = await supabase
            .from("reading_journeys")
            .select("id, status")
            .eq("book_id", bookId)
            .eq("user_id", user.id)
            .eq("status", "active")
            .single()

        if (existingJourney) {
            return {
                success: false,
                error: "You already have an active reading journey for this book. Please complete or archive it first.",
                activeJourneyId: existingJourney.id
            }
        }

        // Generate default session name if not provided
        let finalSessionName = sessionName
        if (!finalSessionName) {
            const { count } = await supabase
                .from("reading_journeys")
                .select("*", { count: "exact", head: true })
                .eq("book_id", bookId)
                .eq("user_id", user.id)

            finalSessionName = count === 0 ? "First Read" : `Re-read #${(count || 0) + 1}`
        }

        // Create new journey
        const { data: journey, error } = await supabase
            .from("reading_journeys")
            .insert({
                book_id: bookId,
                user_id: user.id,
                status: "active",
                visibility: visibility,
                session_name: finalSessionName,
            })
            .select()
            .single()

        if (error) throw new Error(error.message)

        // Post activity to feed (if visibility allows)
        if (visibility !== 'private') {
            try {
                await supabase.from('activities').insert({
                    user_id: user.id,
                    activity_type: 'book_started',
                    book_id: bookId,
                    is_public: visibility === 'public',
                    metadata: {
                        journey_id: journey.id,
                        session_name: finalSessionName
                    }
                })
            } catch (activityError) {
                // Don't fail the journey creation if activity posting fails
                console.error("Failed to create activity:", activityError)
            }
        }

        // Update book reading status
        await supabase
            .from("books")
            .update({
                reading_status: "currently_reading",
                reading_started_at: new Date().toISOString()
            })
            .eq("id", bookId)
            .eq("user_id", user.id)

        revalidatePath(`/dashboard/books/${bookId}`)
        revalidatePath("/dashboard")

        return { success: true, journeyId: journey.id }
    } catch (error) {
        console.error("Error creating journey:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to create journey" }
    }
}

// Get active journey for a book
export async function getActiveJourney(bookId: string): Promise<ReadingJourney | null> {
    try {
        const user = await getUser()
        if (!user) return null

        const supabase = await createClient()

        const { data, error } = await supabase
            .from("reading_journeys")
            .select(`
                *,
                book:books(title, author, cover_image),
                sessions_count:reading_sessions(count),
                thoughts_count:reading_thoughts(count)
            `)
            .eq("book_id", bookId)
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("started_at", { ascending: false })
            .limit(1)
            .single()

        if (error) {
            console.error("Error fetching active journey:", error)
            return null
        }

        return data
    } catch (error) {
        console.error("Error in getActiveJourney:", error)
        return null
    }
}

// Get all journeys for a book (with privacy filtering)
export async function getAllJourneys(
    bookId: string,
    userId?: string
): Promise<ReadingJourney[]> {
    try {
        const user = await getUser()
        const supabase = await createClient()

        let query = supabase
            .from("reading_journeys")
            .select(`
                *,
                book:books(title, author, cover_image),
                user:profiles(username, full_name, profile_picture),
                sessions_count:reading_sessions(count),
                thoughts_count:reading_thoughts(count)
            `)
            .eq("book_id", bookId)
            .order("started_at", { ascending: false })

        // Filter by specific user if provided
        if (userId) {
            query = query.eq("user_id", userId)
        }

        const { data, error } = await query

        if (error) {
            console.error("Error fetching journeys:", error)
            return []
        }

        // Privacy filtering is handled by RLS policies
        return data || []
    } catch (error) {
        console.error("Error in getAllJourneys:", error)
        return []
    }
}

// Get a specific journey by ID
export async function getJourneyById(journeyId: string): Promise<ReadingJourney | null> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("reading_journeys")
            .select(`
                *,
                book:books(title, author, cover_image),
                user:profiles(username, full_name, profile_picture),
                sessions_count:reading_sessions(count),
                thoughts_count:reading_thoughts(count)
            `)
            .eq("id", journeyId)
            .single()

        if (error) {
            console.error("Error fetching journey:", error)
            return null
        }

        return data
    } catch (error) {
        console.error("Error in getJourneyById:", error)
        return null
    }
}

// Complete a journey
export async function completeJourney(
    journeyId: string,
    rating?: number,
    review?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        // Get the journey first to check visibility
        const { data: existingJourney } = await supabase
            .from("reading_journeys")
            .select("book_id, visibility, session_name")
            .eq("id", journeyId)
            .eq("user_id", user.id)
            .single()

        if (!existingJourney) throw new Error("Journey not found")

        const { error } = await supabase
            .from("reading_journeys")
            .update({
                status: "completed",
                finished_at: new Date().toISOString(),
                rating: rating || null,
                review: review || null,
            })
            .eq("id", journeyId)
            .eq("user_id", user.id)

        if (error) throw new Error(error.message)

        // Post activity to feed (if visibility allows)
        if (existingJourney.visibility !== 'private') {
            try {
                await supabase.from('activities').insert({
                    user_id: user.id,
                    activity_type: 'book_finished',
                    book_id: existingJourney.book_id,
                    is_public: existingJourney.visibility === 'public',
                    metadata: {
                        journey_id: journeyId,
                        session_name: existingJourney.session_name,
                        rating: rating || null
                    }
                })
            } catch (activityError) {
                console.error("Failed to create activity:", activityError)
            }
        }

        // Update book reading status
        await supabase
            .from("books")
            .update({
                reading_status: "completed",
                reading_finished_at: new Date().toISOString()
            })
            .eq("id", existingJourney.book_id)
            .eq("user_id", user.id)

        revalidatePath(`/dashboard/books/${existingJourney.book_id}`)
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error) {
        console.error("Error completing journey:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to complete journey" }
    }
}

// Archive a journey
export async function archiveJourney(journeyId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        const { error } = await supabase
            .from("reading_journeys")
            .update({ status: "archived" })
            .eq("id", journeyId)
            .eq("user_id", user.id)
            .in("status", ["completed", "abandoned"])

        if (error) throw new Error(error.message)

        // Get journey details for revalidation
        const { data: journey } = await supabase
            .from("reading_journeys")
            .select("book_id")
            .eq("id", journeyId)
            .single()

        if (journey) {
            revalidatePath(`/dashboard/books/${journey.book_id}`)
            revalidatePath("/dashboard")
        }

        return { success: true }
    } catch (error) {
        console.error("Error archiving journey:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to archive journey" }
    }
}

// Reopen a journey (from archived/completed to active)
export async function reopenJourney(journeyId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        // First, check if there's already an active journey for this book
        const { data: journey } = await supabase
            .from("reading_journeys")
            .select("book_id")
            .eq("id", journeyId)
            .eq("user_id", user.id)
            .single()

        if (!journey) throw new Error("Journey not found")

        const { data: activeJourney } = await supabase
            .from("reading_journeys")
            .select("id")
            .eq("book_id", journey.book_id)
            .eq("user_id", user.id)
            .eq("status", "active")
            .single()

        if (activeJourney) {
            return {
                success: false,
                error: "You already have an active journey for this book. Please complete or archive it first."
            }
        }

        const { error } = await supabase
            .from("reading_journeys")
            .update({
                status: "active",
                finished_at: null // Clear finished date when reopening
            })
            .eq("id", journeyId)
            .eq("user_id", user.id)

        if (error) throw new Error(error.message)

        revalidatePath(`/dashboard/books/${journey.book_id}`)
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error) {
        console.error("Error reopening journey:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to reopen journey" }
    }
}

// Delete a journey (creator only)
export async function deleteJourney(journeyId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        // Get journey details for revalidation
        const { data: journey } = await supabase
            .from("reading_journeys")
            .select("book_id")
            .eq("id", journeyId)
            .eq("user_id", user.id)
            .single()

        const { error } = await supabase
            .from("reading_journeys")
            .delete()
            .eq("id", journeyId)
            .eq("user_id", user.id)

        if (error) throw new Error(error.message)

        if (journey) {
            revalidatePath(`/dashboard/books/${journey.book_id}`)
            revalidatePath("/dashboard")
        }

        return { success: true }
    } catch (error) {
        console.error("Error deleting journey:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete journey" }
    }
}

// Hide journey from owner (book owner only)
export async function hideJourneyFromOwner(
    journeyId: string,
    hide: boolean = true
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        // Verify user is the book owner
        const { data: journey } = await supabase
            .from("reading_journeys")
            .select("book_id, user_id")
            .eq("id", journeyId)
            .single()

        if (!journey) throw new Error("Journey not found")

        const { data: book } = await supabase
            .from("books")
            .select("user_id")
            .eq("id", journey.book_id)
            .eq("user_id", user.id)
            .single()

        if (!book) throw new Error("Only the book owner can hide journeys")

        // Don't allow hiding own journey this way
        if (journey.user_id === user.id) {
            return { success: false, error: "Use delete or update visibility to manage your own journeys" }
        }

        const { error } = await supabase
            .from("reading_journeys")
            .update({ is_hidden_by_owner: hide })
            .eq("id", journeyId)

        if (error) throw new Error(error.message)

        revalidatePath(`/dashboard/books/${journey.book_id}`)
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error) {
        console.error("Error hiding journey:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to hide journey" }
    }
}

// Update journey visibility
export async function updateJourneyVisibility(
    journeyId: string,
    visibility: VisibilityLevel
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        const { data: journey, error } = await supabase
            .from("reading_journeys")
            .update({ visibility })
            .eq("id", journeyId)
            .eq("user_id", user.id)
            .select("book_id")
            .single()

        if (error) throw new Error(error.message)

        if (journey) {
            revalidatePath(`/dashboard/books/${journey.book_id}`)
            revalidatePath("/dashboard")
        }

        return { success: true }
    } catch (error) {
        console.error("Error updating journey visibility:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to update visibility" }
    }
}

// Get journey statistics
export async function getJourneyStats(journeyId: string) {
    try {
        const supabase = await createClient()

        const { data: sessions } = await supabase
            .from("reading_sessions")
            .select("*")
            .eq("journey_id", journeyId)

        const { data: thoughts } = await supabase
            .from("reading_thoughts")
            .select("id")
            .eq("journey_id", journeyId)

        if (!sessions || sessions.length === 0) {
            return {
                totalSessions: 0,
                totalPagesRead: 0,
                totalTimeSpent: 0,
                totalThoughts: thoughts?.length || 0,
                averagePagesPerSession: 0,
                averageTimePerSession: 0,
            }
        }

        const totalPagesRead = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0)
        const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
        const sessionsWithTime = sessions.filter((s) => s.duration_minutes)

        return {
            totalSessions: sessions.length,
            totalPagesRead,
            totalTimeSpent,
            totalThoughts: thoughts?.length || 0,
            averagePagesPerSession: Math.round(totalPagesRead / sessions.length),
            averageTimePerSession: sessionsWithTime.length
                ? Math.round(totalTimeSpent / sessionsWithTime.length)
                : 0,
        }
    } catch (error) {
        console.error("Error getting journey stats:", error)
        return null
    }
}

// Update journey session name
export async function updateJourneyName(
    journeyId: string,
    name: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        const { data: journey, error } = await supabase
            .from("reading_journeys")
            .update({ session_name: name })
            .eq("id", journeyId)
            .eq("user_id", user.id)
            .select("book_id")
            .single()

        if (error) throw new Error(error.message)

        if (journey) {
            revalidatePath(`/dashboard/books/${journey.book_id}`)
            revalidatePath("/dashboard")
        }

        return { success: true }
    } catch (error) {
        console.error("Error updating journey name:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to update name" }
    }
}

// Abandon a journey with optional reason
export async function abandonJourney(
    journeyId: string,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        const { data: journey, error } = await supabase
            .from("reading_journeys")
            .update({
                status: "abandoned",
                finished_at: new Date().toISOString(),
                abandon_reason: reason || null,
            })
            .eq("id", journeyId)
            .eq("user_id", user.id)
            .eq("status", "active")
            .select("book_id")
            .single()

        if (error) throw new Error(error.message)

        if (journey) {
            revalidatePath(`/dashboard/books/${journey.book_id}`)
            revalidatePath("/dashboard")
        }

        return { success: true }
    } catch (error) {
        console.error("Error abandoning journey:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to abandon journey" }
    }
}

// Quick Notes Actions

interface AddQuickNoteParams {
    journeyId: string
    bookId: string
    content: string
    pageNumber?: number | null
}

// Add a quick note (stored as reading_thought with note_type = 'quick_note')
export async function addQuickNote(params: AddQuickNoteParams): Promise<{ success: boolean; noteId?: string; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        // Validate content length
        if (params.content.length > 280) {
            return { success: false, error: "Quick notes must be 280 characters or less" }
        }

        const { data: note, error } = await supabase
            .from("reading_thoughts")
            .insert({
                journey_id: params.journeyId,
                book_id: params.bookId,
                user_id: user.id,
                content: params.content,
                page_number: params.pageNumber || null,
                note_type: 'quick_note',
                is_starred: false,
            })
            .select()
            .single()

        if (error) throw new Error(error.message)

        revalidatePath(`/dashboard/books/${params.bookId}`)

        return { success: true, noteId: note.id }
    } catch (error) {
        console.error("Error adding quick note:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to add note" }
    }
}

// Delete a quick note
export async function deleteQuickNote(noteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        const { data: note, error } = await supabase
            .from("reading_thoughts")
            .delete()
            .eq("id", noteId)
            .eq("user_id", user.id)
            .select("book_id")
            .single()

        if (error) throw new Error(error.message)

        if (note) {
            revalidatePath(`/dashboard/books/${note.book_id}`)
        }

        return { success: true }
    } catch (error) {
        console.error("Error deleting quick note:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete note" }
    }
}

// Toggle starred status on a note
export async function toggleNoteStarred(noteId: string, isStarred: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        const { data: note, error } = await supabase
            .from("reading_thoughts")
            .update({ is_starred: isStarred })
            .eq("id", noteId)
            .eq("user_id", user.id)
            .select("book_id")
            .single()

        if (error) throw new Error(error.message)

        if (note) {
            revalidatePath(`/dashboard/books/${note.book_id}`)
        }

        return { success: true }
    } catch (error) {
        console.error("Error toggling note starred:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to update note" }
    }
}

// Convert a quick note to a detailed thought
export async function convertNoteToThought(noteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user) throw new Error("Not authenticated")

        const supabase = await createClient()

        const { data: note, error } = await supabase
            .from("reading_thoughts")
            .update({
                note_type: 'detailed_thought',
                is_starred: false // Reset starred when converting
            })
            .eq("id", noteId)
            .eq("user_id", user.id)
            .eq("note_type", "quick_note")
            .select("book_id")
            .single()

        if (error) throw new Error(error.message)

        if (note) {
            revalidatePath(`/dashboard/books/${note.book_id}`)
        }

        return { success: true }
    } catch (error) {
        console.error("Error converting note to thought:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to convert note" }
    }
}
