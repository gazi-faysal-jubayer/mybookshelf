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
    visibility: VisibilityLevel = 'public'
): Promise<{ success: boolean; journeyId?: string; error?: string }> {
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
                error: "You already have an active reading journey for this book. Please complete or archive it first."
            }
        }

        // Create new journey
        const { data: journey, error } = await supabase
            .from("reading_journeys")
            .insert({
                book_id: bookId,
                user_id: user.id,
                status: "active",
                visibility: visibility,
            })
            .select()
            .single()

        if (error) throw new Error(error.message)

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
