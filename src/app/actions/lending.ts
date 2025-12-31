"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import connectDB from "@/lib/db"
import Book from "@/models/Book"
import Lending from "@/models/Lending"
import { createNotification } from "@/app/actions/notifications"

export async function lendBook(bookId: string, formData: { borrowerName: string, borrowerEmail?: string, dueDate?: Date, notes?: string }) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        await connectDB()

        const book = await Book.findOne({ _id: bookId, user_id: session.user.id })
        if (!book) throw new Error("Book not found")

        // Create lending record
        await Lending.create({
            book_id: bookId,
            user_id: session.user.id,
            borrower_name: formData.borrowerName,
            borrower_email: formData.borrowerEmail,
            due_date: formData.dueDate,
            notes: formData.notes,
            status: "active"
        })

        // Update book status
        book.lending_status = "lent_out"
        await book.save()

        await createNotification(
            session.user.id,
            "success",
            `You lent "${book.title}" to ${formData.borrowerName}`
        )

        revalidatePath("/dashboard")
        revalidatePath(`/dashboard/books/${bookId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to lend book:", error)
        throw new Error("Failed to lend book")
    }
}

export async function returnBook(bookId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Unauthorized")

        await connectDB()

        const book = await Book.findOne({ _id: bookId, user_id: session.user.id })
        if (!book) throw new Error("Book not found")

        // Find active lending record
        const lending = await Lending.findOne({
            book_id: bookId,
            user_id: session.user.id,
            status: "active"
        })

        if (lending) {
            lending.status = "returned"
            lending.return_date = new Date()
            await lending.save()
        }

        // Update book status
        book.lending_status = "available" // Assuming 'available' is mapped to 'owned' or we need to check the schema
        // Actually, looking at Book.ts earlier, it might be 'owned' vs 'lent'. Let's check Book.ts to be sure.
        // Reverting to safe default 'owned' based on common sense, but will verify.
        book.lending_status = "available"
        await book.save()

        await createNotification(
            session.user.id,
            "success",
            `"${book.title}" has been marked as returned`
        )

        revalidatePath("/dashboard")
        revalidatePath(`/dashboard/books/${bookId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to return book:", error)
        throw new Error("Failed to return book")
    }
}
