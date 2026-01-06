"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createPost } from "@/app/actions/posts"
import { getActiveJourney, createNewJourney } from "@/app/actions/journeys"

// Interface for reading thoughts (during-reading notes)
export interface ReadingThought {
    id: string
    book_id: string
    user_id: string
    page_number: number | null
    chapter: string | null
    content: string
    contains_spoilers: boolean
    created_at: string
    updated_at: string
}

// Interface for final book reviews (using existing book_reviews table)
export interface BookReview {
    id: string
    book_id: string
    user_id: string
    rating: number
    review_text: string | null
    contains_spoilers: boolean
    tags: string[]
    helpful_count: number
    // New optional columns added by migration
    would_recommend?: string | null
    is_public?: boolean
    title?: string | null
    favorite_quotes?: string[] | null
    created_at: string
    updated_at: string
}

// Add a during-reading thought (uses reading_thoughts table)
export async function addDuringReadingThought(bookId: string, data: {
    page_number?: number
    chapter?: string
    content: string
    contains_spoilers?: boolean
}, journeyId?: string) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    // Use provided journeyId or fall back to getting/creating active journey
    let activeJourneyId = journeyId
    if (!activeJourneyId) {
        let activeJourney = await getActiveJourney(bookId)
        if (!activeJourney) {
            const result = await createNewJourney(bookId, 'public')
            if (result.success && result.journeyId) {
                activeJourney = await getActiveJourney(bookId)
            }
        }
        activeJourneyId = activeJourney?.id || null
    }

    const { error } = await supabase.from("reading_thoughts").insert({
        book_id: bookId,
        user_id: user.id,
        journey_id: activeJourneyId,
        page_number: data.page_number,
        chapter: data.chapter,
        content: data.content,
        contains_spoilers: data.contains_spoilers || false,
    })

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/books/${bookId}`)

    return { success: true }
}

// Add a final review (uses existing book_reviews table)
export async function addFinalReview(bookId: string, data: {
    title?: string
    content: string
    rating?: number
    would_recommend?: "yes" | "no" | "maybe"
    contains_spoilers?: boolean
    is_public?: boolean
    favorite_quotes?: string[]
}) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    // Get or create active journey
    let activeJourney = await getActiveJourney(bookId)
    if (!activeJourney) {
        const result = await createNewJourney(bookId, 'public')
        if (result.success && result.journeyId) {
            activeJourney = await getActiveJourney(bookId)
        }
    }

    // Check if a review already exists for this book by this user and journey
    const { data: existingReview } = await supabase
        .from("book_reviews")
        .select("id")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .eq("journey_id", activeJourney?.id || null)
        .single()

    const reviewData = {
        rating: data.rating || 5, // rating is required in existing schema
        review_text: data.content,
        contains_spoilers: data.contains_spoilers ?? false,
        // New optional columns
        title: data.title,
        would_recommend: data.would_recommend,
        is_public: data.is_public ?? true,
        favorite_quotes: data.favorite_quotes,
    }

    if (existingReview) {
        // Update existing review
        const { error } = await supabase
            .from("book_reviews")
            .update(reviewData)
            .eq("id", existingReview.id)

        if (error) throw new Error(error.message)
    } else {
        // Insert new review linked to journey
        const { error } = await supabase.from("book_reviews").insert({
            book_id: bookId,
            user_id: user.id,
            journey_id: activeJourney?.id || null,
            ...reviewData,
        })

        if (error) throw new Error(error.message)
    }

    // Also update the book's rating if provided
    if (data.rating) {
        await supabase
            .from("books")
            .update({ rating: data.rating })
            .eq("id", bookId)
            .eq("user_id", user.id)
    }

    revalidatePath(`/dashboard/books/${bookId}`)

    // Create Feed Post
    if (data.is_public !== false) {
        try {
            // Get book details for the post
            const { data: book } = await supabase
                .from("books")
                .select("title, author")
                .eq("id", bookId)
                .single()

            if (book) {
                const ratingStars = "⭐".repeat(data.rating || 5)
                await createPost({
                    content: `wrote a review for "${book.title}" by ${book.author}\n\n${ratingStars}\n\n${data.content.substring(0, 100)}${data.content.length > 100 ? "..." : ""}`,
                    visibility: "public",
                    bookId: bookId
                })
            }
        } catch (e) {
            console.error("Failed to create review post:", e)
        }
    }

    return { success: true }
}

// Update a reading thought
export async function updateReadingThought(thoughtId: string, data: {
    page_number?: number
    chapter?: string
    content?: string
    contains_spoilers?: boolean
}) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    // Get thought to find book_id for revalidation
    const { data: thought } = await supabase
        .from("reading_thoughts")
        .select("book_id")
        .eq("id", thoughtId)
        .eq("user_id", user.id)
        .single()

    if (!thought) throw new Error("Thought not found")

    const { error } = await supabase
        .from("reading_thoughts")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", thoughtId)
        .eq("user_id", user.id)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/books/${thought.book_id}`)

    return { success: true }
}

// Delete a reading thought
export async function deleteReadingThought(thoughtId: string) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    // Get thought to find book_id for revalidation
    const { data: thought } = await supabase
        .from("reading_thoughts")
        .select("book_id")
        .eq("id", thoughtId)
        .eq("user_id", user.id)
        .single()

    const { error } = await supabase
        .from("reading_thoughts")
        .delete()
        .eq("id", thoughtId)
        .eq("user_id", user.id)

    if (error) throw new Error(error.message)

    if (thought) {
        revalidatePath(`/dashboard/books/${thought.book_id}`)
    }

    return { success: true }
}

// Delete a final review
export async function deleteReview(reviewId: string) {
    const user = await getUser()
    if (!user) throw new Error("Not authenticated")

    const supabase = await createClient()

    // Get review to find book_id for revalidation
    const { data: review } = await supabase
        .from("book_reviews")
        .select("book_id")
        .eq("id", reviewId)
        .eq("user_id", user.id)
        .single()

    const { error } = await supabase
        .from("book_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id)

    if (error) throw new Error(error.message)

    if (review) {
        revalidatePath(`/dashboard/books/${review.book_id}`)
    }

    return { success: true }
}

// Get reading thoughts for a book
export async function getReadingThoughts(bookId: string): Promise<ReadingThought[]> {
    const user = await getUser()
    if (!user) return []

    const supabase = await createClient()

    const { data, error } = await supabase
        .from("reading_thoughts")
        .select("*")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .order("page_number", { ascending: true, nullsFirst: false })

    if (error) {
        console.error("Error fetching reading thoughts:", error)
        return []
    }

    return data || []
}

// Get final review for a book
export async function getFinalReview(bookId: string): Promise<BookReview | null> {
    const user = await getUser()
    if (!user) return null

    const supabase = await createClient()

    const { data, error } = await supabase
        .from("book_reviews")
        .select("*")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .single()

    if (error) {
        return null
    }

    return data
}
