"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import connectDB from "@/lib/db"
import Collection from "@/models/Collection"
import mongoose from "mongoose"

// Create a new collection
export async function createCollection(formData: { name: string; description?: string; is_public?: boolean }) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        await connectDB()

        const collection = await Collection.create({
            user_id: session.user.id,
            name: formData.name,
            description: formData.description,
            is_public: formData.is_public || false,
        })

        revalidatePath("/dashboard/collections")
        return { success: true, collectionId: collection._id.toString() }
    } catch (error: any) {
        if (error.code === 11000) {
            throw new Error("You already have a collection with this name")
        }
        console.error("Failed to create collection:", error)
        throw new Error("Failed to create collection")
    }
}

// Delete a collection
export async function deleteCollection(collectionId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        await connectDB()

        const result = await Collection.deleteOne({
            _id: collectionId,
            user_id: session.user.id,
        })

        if (result.deletedCount === 0) {
            throw new Error("Collection not found or unauthorized")
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
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        await connectDB()

        const collection = await Collection.findOne({
            _id: collectionId,
            user_id: session.user.id,
        })

        if (!collection) {
            throw new Error("Collection not found")
        }

        // Check if book is already in collection
        const isBookInCollection = collection.books.some((id: mongoose.Types.ObjectId) => id.toString() === bookId)
        if (isBookInCollection) {
            return { success: true, message: "Book already in collection" }
        }

        collection.books.push(bookId as any)
        await collection.save()

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
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        await connectDB()

        const collection = await Collection.findOne({
            _id: collectionId,
            user_id: session.user.id,
        })

        if (!collection) {
            throw new Error("Collection not found")
        }

        collection.books = collection.books.filter((id: mongoose.Types.ObjectId) => id.toString() !== bookId)
        await collection.save()

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
        const session = await auth()
        if (!session?.user?.id) return []

        await connectDB()

        const collections = await Collection.find({ user_id: session.user.id })
            .select("name _id books")
            .sort({ name: 1 })
            .lean()

        return JSON.parse(JSON.stringify(collections))
    } catch (error) {
        console.error("Failed to fetch collections:", error)
        return []
    }
}
