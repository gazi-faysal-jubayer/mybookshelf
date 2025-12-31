"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"

// Create a new collection
export async function createCollection(formData: { name: string; description?: string; is_public?: boolean }) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { data: collection, error } = await supabase
            .from('collections')
            .insert({
                user_id: user.id,
                name: formData.name,
                description: formData.description,
                is_public: formData.is_public || false,
            })
            .select('id')
            .single()

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error("You already have a collection with this name")
            }
            console.error("Supabase error:", error)
            throw new Error("Failed to create collection")
        }

        revalidatePath("/dashboard/collections")
        return { success: true, collectionId: collection.id }
    } catch (error: any) {
        console.error("Failed to create collection:", error)
        throw error
    }
}

// Delete a collection
export async function deleteCollection(collectionId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('collections')
            .delete()
            .eq('id', collectionId)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to delete collection")
        }

        revalidatePath("/dashboard/collections")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete collection:", error)
        throw new Error("Failed to delete collection")
    }
}

// Add a book to a collection
export async function addBookToCollection(collectionId: string, bookId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Verify the collection belongs to the user
        const { data: collection, error: collectionError } = await supabase
            .from('collections')
            .select('id')
            .eq('id', collectionId)
            .eq('user_id', user.id)
            .single()

        if (collectionError || !collection) {
            throw new Error("Collection not found")
        }

        // Check if book is already in collection
        const { data: existing } = await supabase
            .from('collection_books')
            .select('id')
            .eq('collection_id', collectionId)
            .eq('book_id', bookId)
            .single()

        if (existing) {
            return { success: true, message: "Book already in collection" }
        }

        // Add book to collection
        const { error } = await supabase
            .from('collection_books')
            .insert({
                collection_id: collectionId,
                book_id: bookId,
            })

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to add book to collection")
        }

        revalidatePath(`/dashboard/collections/${collectionId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to add book to collection:", error)
        throw new Error("Failed to add book to collection")
    }
}

// Remove a book from a collection
export async function removeBookFromCollection(collectionId: string, bookId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Verify the collection belongs to the user
        const { data: collection, error: collectionError } = await supabase
            .from('collections')
            .select('id')
            .eq('id', collectionId)
            .eq('user_id', user.id)
            .single()

        if (collectionError || !collection) {
            throw new Error("Collection not found")
        }

        const { error } = await supabase
            .from('collection_books')
            .delete()
            .eq('collection_id', collectionId)
            .eq('book_id', bookId)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to remove book from collection")
        }

        revalidatePath(`/dashboard/collections/${collectionId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to remove book from collection:", error)
        throw new Error("Failed to remove book from collection")
    }
}

// Get user's collections (helper for client components if needed, though they usually use server components)
export async function getUserCollections() {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        const { data: collections, error } = await supabase
            .from('collections')
            .select(`
                id,
                name,
                collection_books (
                    book_id
                )
            `)
            .eq('user_id', user.id)
            .order('name', { ascending: true })

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Transform to match old format
        return collections.map(c => ({
            _id: c.id,
            name: c.name,
            books: c.collection_books?.map((cb: any) => cb.book_id) || []
        }))
    } catch (error) {
        console.error("Failed to fetch collections:", error)
        return []
    }
}
