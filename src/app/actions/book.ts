"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addBook(data: any) {
    try {
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        const supabase = await createClient()

        // Transform nested objects to flat structure
        const bookData = {
            user_id: user.id,
            title: data.title,
            author: data.author,
            isbn: data.isbn,
            publisher: data.publisher,
            publication_year: data.publication_year,
            pages: data.pages,
            language: data.language,
            genre: data.genre ? (Array.isArray(data.genre) ? data.genre : [data.genre]) : [],
            cover_image: data.cover_image,
            description: data.description,
            format: data.format,
            condition: data.condition,
            // Flatten purchase_info
            purchase_date: data.purchase_info?.date,
            purchase_price: data.purchase_info?.price,
            purchase_location: data.purchase_info?.location,
            purchase_currency: data.purchase_info?.currency || 'USD',
            purchase_link: data.purchase_info?.link,
            // Flatten borrowed_info
            borrowed_owner_name: data.borrowed_info?.owner_name,
            borrowed_borrow_date: data.borrowed_info?.borrow_date,
            borrowed_due_date: data.borrowed_info?.due_date,
            borrowed_return_date: data.borrowed_info?.return_date,
            // Status fields
            ownership_status: data.ownership_status || 'owned',
            reading_status: data.reading_status || 'to_read',
            lending_status: data.lending_status || 'available',
            rating: data.rating,
            review: data.review,
            tags: data.tags || [],
            notes: data.notes,
        }

        const { data: newBook, error } = await supabase
            .from('books')
            .insert(bookData)
            .select('id')
            .single()

        if (error || !newBook) {
            console.error("Supabase error:", error)
            throw new Error("Failed to add book")
        }

        revalidatePath("/dashboard")
        revalidatePath("/books")

        return { success: true, bookId: newBook.id }
    } catch (error) {
        console.error("Failed to add book:", error)
        throw new Error("Failed to add book")
    }
}

export async function updateBook(id: string, data: any) {
    try {
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        const supabase = await createClient()

        // Transform nested objects to flat structure
        const bookData: any = {}
        
        // Only include fields that are provided
        if (data.title !== undefined) bookData.title = data.title
        if (data.author !== undefined) bookData.author = data.author
        if (data.isbn !== undefined) bookData.isbn = data.isbn
        if (data.publisher !== undefined) bookData.publisher = data.publisher
        if (data.publication_year !== undefined) bookData.publication_year = data.publication_year
        if (data.pages !== undefined) bookData.pages = data.pages
        if (data.language !== undefined) bookData.language = data.language
        if (data.genre !== undefined) bookData.genre = data.genre
        if (data.cover_image !== undefined) bookData.cover_image = data.cover_image
        if (data.description !== undefined) bookData.description = data.description
        if (data.format !== undefined) bookData.format = data.format
        if (data.condition !== undefined) bookData.condition = data.condition
        if (data.ownership_status !== undefined) bookData.ownership_status = data.ownership_status
        if (data.reading_status !== undefined) bookData.reading_status = data.reading_status
        if (data.lending_status !== undefined) bookData.lending_status = data.lending_status
        if (data.rating !== undefined) bookData.rating = data.rating
        if (data.review !== undefined) bookData.review = data.review
        if (data.tags !== undefined) bookData.tags = data.tags
        if (data.notes !== undefined) bookData.notes = data.notes

        // Handle nested purchase_info
        if (data.purchase_info) {
            if (data.purchase_info.date !== undefined) bookData.purchase_date = data.purchase_info.date
            if (data.purchase_info.price !== undefined) bookData.purchase_price = data.purchase_info.price
            if (data.purchase_info.location !== undefined) bookData.purchase_location = data.purchase_info.location
            if (data.purchase_info.currency !== undefined) bookData.purchase_currency = data.purchase_info.currency
            if (data.purchase_info.link !== undefined) bookData.purchase_link = data.purchase_info.link
        }

        // Handle nested borrowed_info
        if (data.borrowed_info) {
            if (data.borrowed_info.owner_name !== undefined) bookData.borrowed_owner_name = data.borrowed_info.owner_name
            if (data.borrowed_info.borrow_date !== undefined) bookData.borrowed_borrow_date = data.borrowed_info.borrow_date
            if (data.borrowed_info.due_date !== undefined) bookData.borrowed_due_date = data.borrowed_info.due_date
            if (data.borrowed_info.return_date !== undefined) bookData.borrowed_return_date = data.borrowed_info.return_date
        }

        const { error } = await supabase
            .from('books')
            .update(bookData)
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to update book")
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
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to delete book")
        }

        revalidatePath("/dashboard")
        revalidatePath("/books")

        return { success: true }
    } catch (error) {
        console.error("Failed to delete book:", error)
        throw new Error("Failed to delete book")
    }
}

export async function getBook(id: string) {
    try {
        const user = await getUser()
        if (!user) {
            return null
        }

        const supabase = await createClient()

        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error) {
            console.error("Supabase error:", error)
            return null
        }

        return book
    } catch (error) {
        console.error("Failed to get book:", error)
        return null
    }
}

export async function getUserBooks() {
    try {
        const user = await getUser()
        if (!user) {
            return []
        }

        const supabase = await createClient()

        const { data: books, error } = await supabase
            .from('books')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        return books
    } catch (error) {
        console.error("Failed to get books:", error)
        return []
    }
}
