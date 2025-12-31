"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
import { createNotification } from "@/app/actions/notifications"

export async function lendBook(bookId: string, formData: { borrowerName: string, borrowerEmail?: string, dueDate?: Date, notes?: string }) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Get the book
        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('id, title')
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single()

        if (bookError || !book) throw new Error("Book not found")

        // Create lending record
        const { error: lendingError } = await supabase
            .from('lendings')
            .insert({
                book_id: bookId,
                user_id: user.id,
                borrower_name: formData.borrowerName,
                borrower_email: formData.borrowerEmail,
                due_date: formData.dueDate?.toISOString(),
                notes: formData.notes,
                status: 'active'
            })

        if (lendingError) {
            console.error("Supabase error:", lendingError)
            throw new Error("Failed to create lending record")
        }

        // Update book status
        const { error: updateError } = await supabase
            .from('books')
            .update({ lending_status: 'lent_out' })
            .eq('id', bookId)
            .eq('user_id', user.id)

        if (updateError) {
            console.error("Supabase error:", updateError)
        }

        await createNotification(
            user.id,
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
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Get the book
        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('id, title')
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single()

        if (bookError || !book) throw new Error("Book not found")

        // Find active lending record and update it
        const { error: lendingError } = await supabase
            .from('lendings')
            .update({
                status: 'returned',
                return_date: new Date().toISOString()
            })
            .eq('book_id', bookId)
            .eq('user_id', user.id)
            .eq('status', 'active')

        if (lendingError) {
            console.error("Supabase error:", lendingError)
        }

        // Update book status
        const { error: updateError } = await supabase
            .from('books')
            .update({ lending_status: 'available' })
            .eq('id', bookId)
            .eq('user_id', user.id)

        if (updateError) {
            console.error("Supabase error:", updateError)
        }

        await createNotification(
            user.id,
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
