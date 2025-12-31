"use server"

import { auth } from "@/auth"
import connectDB from "@/lib/db"
import Book from "@/models/Book"
import { revalidatePath } from "next/cache"

export async function addBook(data: any) {
    try {
        const session = await auth()

        if (!session || !session.user || !session.user.id) {
            throw new Error("Unauthorized")
        }

        await connectDB()

        const newBook = await Book.create({
            ...data,
            user_id: session.user.id,
        })

        revalidatePath("/dashboard")
        revalidatePath("/books")

        return { success: true, bookId: newBook._id.toString() }
    } catch (error) {
        console.error("Failed to add book:", error)
        throw new Error("Failed to add book")
    }
}

export async function updateBook(id: string, data: any) {
    try {
        const session = await auth()

        if (!session || !session.user || !session.user.id) {
            throw new Error("Unauthorized")
        }

        await connectDB()

        const updatedBook = await Book.findOneAndUpdate(
            { _id: id, user_id: session.user.id },
            data,
            { new: true }
        )

        if (!updatedBook) {
            throw new Error("Book not found")
        }

        revalidatePath("/dashboard")
        revalidatePath("/books")
        revalidatePath(`/books/${id}`)

        return { success: true }
    } catch (error) {
        console.error("Failed to update book:", error)
        throw new Error("Failed to update book")
    }
}

export async function deleteBook(id: string) {
    try {
        const session = await auth()

        if (!session || !session.user || !session.user.id) {
            throw new Error("Unauthorized")
        }

        await connectDB()

        const deletedBook = await Book.findOneAndDelete({ _id: id, user_id: session.user.id })

        if (!deletedBook) {
            throw new Error("Book not found")
        }

        revalidatePath("/dashboard")
        revalidatePath("/books")

        return { success: true }
    } catch (error) {
        console.error("Failed to delete book:", error)
        throw new Error("Failed to delete book")
    }
}
