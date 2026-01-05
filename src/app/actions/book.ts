"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"

export async function addBook(data: any) {
    try {
        const user = await getUser()
        if (!user) {
            return { success: false, error: "Unauthorized - please log in" }
        }

        const supabase = await createClient()

        // Transform nested objects to flat structure
        // Clean up undefined values - don't send them to Supabase
        const bookData: Record<string, any> = {
            user_id: user.id,
            title: data.title,
            author: data.author,
        }

        // Only add optional fields if they have values
        if (data.isbn) bookData.isbn = data.isbn
        if (data.publisher) bookData.publisher = data.publisher
        if (data.publication_year) bookData.publication_year = data.publication_year
        if (data.pages) bookData.pages = data.pages
        if (data.language) bookData.language = data.language
        if (data.genre) bookData.genre = Array.isArray(data.genre) ? data.genre : [data.genre]
        if (data.cover_image) bookData.cover_image = data.cover_image
        if (data.description) bookData.description = data.description
        if (data.format) bookData.format = data.format
        if (data.condition) bookData.condition = data.condition
        if (data.ownership_status) bookData.ownership_status = data.ownership_status
        if (data.reading_status) bookData.reading_status = data.reading_status
        if (data.lending_status) bookData.lending_status = data.lending_status
        if (data.rating !== undefined && data.rating !== null) bookData.rating = data.rating
        if (data.review) bookData.review = data.review
        if (data.tags && data.tags.length > 0) bookData.tags = data.tags
        if (data.notes) bookData.notes = data.notes

        // Flatten purchase_info
        if (data.purchase_info?.date) bookData.purchase_date = data.purchase_info.date
        if (data.purchase_info?.price) bookData.purchase_price = data.purchase_info.price
        if (data.purchase_info?.location) bookData.purchase_location = data.purchase_info.location
        if (data.purchase_info?.currency) bookData.purchase_currency = data.purchase_info.currency
        if (data.purchase_info?.link) bookData.purchase_link = data.purchase_info.link

        // Flatten borrowed_info
        if (data.borrowed_info?.owner_name) bookData.borrowed_owner_name = data.borrowed_info.owner_name
        if (data.borrowed_info?.owner_user_id) bookData.borrowed_owner_user_id = data.borrowed_info.owner_user_id
        if (data.borrowed_info?.borrow_date) bookData.borrowed_borrow_date = data.borrowed_info.borrow_date
        if (data.borrowed_info?.due_date) bookData.borrowed_due_date = data.borrowed_info.due_date
        if (data.borrowed_info?.return_date) bookData.borrowed_return_date = data.borrowed_info.return_date

        console.log("Adding book with data:", JSON.stringify(bookData, null, 2))

        const { data: newBook, error } = await supabase
            .from('books')
            .insert(bookData)
            .select('id')
            .single()

        if (error) {
            console.error("Supabase error:", error)
            return { success: false, error: `Database error: ${error.message}` }
        }

        if (!newBook) {
            return { success: false, error: "Book was not created - no data returned" }
        }

        // Handle borrowed book with linked owner user
        const ownerUserId = data.borrowed_info?.owner_user_id
        if (data.ownership_status === 'borrowed_from_others' && ownerUserId) {
            // Check if owner has this book (by title + author)
            const { data: ownerBooks } = await supabase
                .from('books')
                .select('id')
                .eq('user_id', ownerUserId)
                .ilike('title', data.title)
                .ilike('author', data.author)
                .limit(1)

            if (!ownerBooks || ownerBooks.length === 0) {
                // Owner doesn't have this book - create a book add request
                const { data: newRequest, error: requestError } = await supabase
                    .from('book_add_requests')
                    .insert({
                        requester_id: user.id,
                        owner_id: ownerUserId,
                        book_title: data.title,
                        book_author: data.author,
                        book_isbn: data.isbn || null,
                        book_cover_image: data.cover_image || null,
                        book_publisher: data.publisher || null,
                        book_format: data.format || null,
                        requester_book_id: newBook.id,
                        status: 'pending'
                    })
                    .select('id')
                    .single()

                if (requestError) {
                    console.error("Failed to create book add request:", requestError)
                } else {
                    // Get requester's profile for notification
                    const { data: requesterProfile } = await supabase
                        .from('profiles')
                        .select('username, full_name')
                        .eq('id', user.id)
                        .single()

                    const requesterName = requesterProfile?.full_name || requesterProfile?.username || 'Someone'

                    // Send notification to owner with request ID
                    await createNotification(
                        ownerUserId,
                        'info',
                        `${requesterName} borrowed "${data.title}" from you and is requesting you to add it to your shelf.`,
                        '/dashboard/books',
                        {
                            relatedUserId: user.id,
                            relatedBookRequestId: newRequest.id,
                            category: 'book_add_request'
                        }
                    )
                }
            }
        }

        revalidatePath("/dashboard")
        revalidatePath("/books")

        return { success: true, bookId: newBook.id }
    } catch (error) {
        console.error("Failed to add book:", error)
        const message = error instanceof Error ? error.message : "Unknown error occurred"
        return { success: false, error: message }
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

export async function bulkDeleteBooks(ids: string[]) {
    try {
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        if (ids.length === 0) {
            return { success: true, deleted: 0 }
        }

        const supabase = await createClient()

        const { error, count } = await supabase
            .from('books')
            .delete()
            .in('id', ids)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to delete books")
        }

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/books")

        return { success: true, deleted: count || ids.length }
    } catch (error) {
        console.error("Failed to delete books:", error)
        throw new Error("Failed to delete books")
    }
}

export async function bulkUpdateStatus(ids: string[], readingStatus: string) {
    try {
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        if (ids.length === 0) {
            return { success: true, updated: 0 }
        }

        const supabase = await createClient()

        const { error, count } = await supabase
            .from('books')
            .update({ reading_status: readingStatus })
            .in('id', ids)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to update book status")
        }

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/books")

        return { success: true, updated: count || ids.length }
    } catch (error) {
        console.error("Failed to update book status:", error)
        throw new Error("Failed to update book status")
    }
}

export async function bulkAddToCollection(bookIds: string[], collectionId: string) {
    try {
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        if (bookIds.length === 0) {
            return { success: true, added: 0 }
        }

        const supabase = await createClient()

        // First verify the collection belongs to the user
        const { data: collection, error: collectionError } = await supabase
            .from('collections')
            .select('id')
            .eq('id', collectionId)
            .eq('user_id', user.id)
            .single()

        if (collectionError || !collection) {
            throw new Error("Collection not found")
        }

        // Create collection_books entries, ignoring duplicates
        const entries = bookIds.map((bookId) => ({
            collection_id: collectionId,
            book_id: bookId,
        }))

        const { error } = await supabase
            .from('collection_books')
            .upsert(entries, { onConflict: 'collection_id,book_id', ignoreDuplicates: true })

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to add books to collection")
        }

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/books")
        revalidatePath("/dashboard/collections")

        return { success: true, added: bookIds.length }
    } catch (error) {
        console.error("Failed to add books to collection:", error)
        throw new Error("Failed to add books to collection")
    }
}

// =====================================================
// BOOK ADD REQUESTS
// =====================================================

export async function getBookAddRequests() {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        const { data: requests, error } = await supabase
            .from('book_add_requests')
            .select(`
                *,
                requester:requester_id (
                    id,
                    username,
                    full_name,
                    profile_picture
                )
            `)
            .eq('owner_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Failed to fetch book add requests:", error)
            return []
        }

        return requests || []
    } catch (error) {
        console.error("Failed to get book add requests:", error)
        return []
    }
}

export async function respondToBookAddRequest(
    requestId: string,
    response: 'approved' | 'declined'
) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Get the request details
        const { data: request, error: fetchError } = await supabase
            .from('book_add_requests')
            .select('*')
            .eq('id', requestId)
            .eq('owner_id', user.id)
            .single()

        if (fetchError || !request) {
            throw new Error("Request not found")
        }

        if (request.status !== 'pending') {
            throw new Error("Request already processed")
        }

        if (response === 'approved') {
            // Create the book in owner's shelf
            const { data: newBook, error: bookError } = await supabase
                .from('books')
                .insert({
                    user_id: user.id,
                    title: request.book_title,
                    author: request.book_author,
                    isbn: request.book_isbn,
                    cover_image: request.book_cover_image,
                    publisher: request.book_publisher,
                    format: request.book_format || 'paperback',
                    ownership_status: 'owned',
                    lending_status: 'lent_out',
                    reading_status: 'completed'
                })
                .select('id')
                .single()

            if (bookError) {
                console.error("Failed to create book:", bookError)
                throw new Error("Failed to add book to shelf")
            }

            // Update request with owner_book_id
            await supabase
                .from('book_add_requests')
                .update({
                    status: 'approved',
                    owner_book_id: newBook.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId)

            // Get owner's name for notification
            const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', user.id)
                .single()

            const ownerName = ownerProfile?.full_name || ownerProfile?.username || 'The owner'

            // Notify requester
            await createNotification(
                request.requester_id,
                'success',
                `${ownerName} approved your request to add "${request.book_title}" to their shelf!`,
                '/dashboard/books',
                {
                    relatedUserId: user.id,
                    category: 'book_add_approved'
                }
            )
        } else {
            // Decline the request
            await supabase
                .from('book_add_requests')
                .update({
                    status: 'declined',
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId)

            // Get owner's name for notification
            const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', user.id)
                .single()

            const ownerName = ownerProfile?.full_name || ownerProfile?.username || 'The owner'

            // Notify requester
            await createNotification(
                request.requester_id,
                'info',
                `${ownerName} declined the request to add "${request.book_title}" to their shelf.`,
                undefined,
                {
                    relatedUserId: user.id,
                    category: 'book_add_declined'
                }
            )
        }

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/books")

        return { success: true }
    } catch (error) {
        console.error("Failed to respond to book add request:", error)
        const message = error instanceof Error ? error.message : "Failed to process request"
        throw new Error(message)
    }
}

export async function toggleFavorite(bookId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Get current status
        const { data: book, error: fetchError } = await supabase
            .from('books')
            .select('is_favorite')
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !book) throw new Error("Book not found")

        const newStatus = !book.is_favorite

        const { error: updateError } = await supabase
            .from('books')
            .update({ is_favorite: newStatus })
            .eq('id', bookId)
            .eq('user_id', user.id)

        if (updateError) throw new Error("Failed to update favorite status")

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/books")
        revalidatePath(`/dashboard/books/${bookId}`)

        return { success: true, isFavorite: newStatus }
    } catch (error) {
        console.error("Failed to toggle favorite:", error)
        throw error
    }
}
