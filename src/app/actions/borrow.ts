"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// =====================================================
// BORROW REQUEST SYSTEM
// =====================================================

export async function createBorrowRequest(data: {
    bookId: string
    ownerId: string
    proposedDuration: number // days
    exchangeMethod: 'meetup' | 'mail' | 'drop_off'
    meetupLocation?: string
    message?: string
    urgency?: 'casual' | 'soon' | 'urgent'
}) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    if (user.id === data.ownerId) {
        throw new Error("Cannot borrow your own book")
    }

    const supabase = await createClient()

    // Check if book exists and is available
    const { data: book } = await supabase
        .from('books')
        .select('id, title, is_available_for_lending, lending_status, user_id')
        .eq('id', data.bookId)
        .eq('user_id', data.ownerId)
        .single()

    if (!book) throw new Error("Book not found")
    if (!book.is_available_for_lending) throw new Error("Book is not available for lending")
    if (book.lending_status !== 'available') throw new Error("Book is currently lent out")

    // Check if user already has a pending request for this book
    const { data: existingRequest } = await supabase
        .from('borrow_requests')
        .select('id')
        .eq('book_id', data.bookId)
        .eq('borrower_id', user.id)
        .in('status', ['pending', 'counter_offered', 'active'])
        .single()

    if (existingRequest) throw new Error("You already have a pending request for this book")

    // Check owner's lending preferences
    const { data: owner } = await supabase
        .from('profiles')
        .select('require_deposit, deposit_amount, lending_to')
        .eq('id', data.ownerId)
        .single()

    // Create the request
    const { data: request, error } = await supabase
        .from('borrow_requests')
        .insert({
            book_id: data.bookId,
            owner_id: data.ownerId,
            borrower_id: user.id,
            proposed_duration: data.proposedDuration,
            exchange_method: data.exchangeMethod,
            meetup_location: data.meetupLocation,
            borrower_message: data.message,
            urgency: data.urgency || 'casual',
            deposit_required: owner?.require_deposit || false,
            deposit_amount: owner?.deposit_amount || 0,
            status: 'pending'
        })
        .select('id')
        .single()

    if (error) throw new Error("Failed to create borrow request")

    // Notify owner
    await supabase.from('notifications').insert({
        user_id: data.ownerId,
        type: 'info',
        message: `New borrow request for "${book.title}"`,
        link: `/dashboard/lending/requests/${request.id}`
    })

    revalidatePath('/dashboard/lending')
    return { success: true, requestId: request.id }
}

export async function respondToBorrowRequest(
    requestId: string,
    action: 'accept' | 'decline' | 'counter',
    data?: {
        counterDuration?: number
        counterMessage?: string
        pickupDate?: string
    }
) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Get the request
    const { data: request } = await supabase
        .from('borrow_requests')
        .select('*, book:book_id(title)')
        .eq('id', requestId)
        .eq('owner_id', user.id)
        .single()

    if (!request) throw new Error("Request not found")
    if (request.status !== 'pending' && request.status !== 'counter_offered') {
        throw new Error("Request cannot be modified")
    }

    if (action === 'accept') {
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + request.proposed_duration)

        // Update request
        await supabase
            .from('borrow_requests')
            .update({
                status: 'accepted',
                responded_at: new Date().toISOString(),
                pickup_date: data?.pickupDate || null,
                due_date: dueDate.toISOString()
            })
            .eq('id', requestId)

        // Mark book as reserved
        await supabase
            .from('books')
            .update({ lending_status: 'reserved' })
            .eq('id', request.book_id)

        // Notify borrower
        await supabase.from('notifications').insert({
            user_id: request.borrower_id,
            type: 'success',
            message: `Your borrow request for "${request.book.title}" was accepted!`,
            link: `/dashboard/lending/requests/${requestId}`
        })

        // Create conversation for coordination
        const { data: conversation } = await supabase
            .from('conversations')
            .insert({
                type: 'borrow_request',
                borrow_request_id: requestId
            })
            .select('id')
            .single()

        if (conversation) {
            await supabase.from('conversation_participants').insert([
                { conversation_id: conversation.id, user_id: user.id },
                { conversation_id: conversation.id, user_id: request.borrower_id }
            ])
        }

    } else if (action === 'decline') {
        await supabase
            .from('borrow_requests')
            .update({
                status: 'declined',
                responded_at: new Date().toISOString()
            })
            .eq('id', requestId)

        await supabase.from('notifications').insert({
            user_id: request.borrower_id,
            type: 'warning',
            message: `Your borrow request for "${request.book.title}" was declined`,
            link: `/dashboard/lending/requests/${requestId}`
        })

    } else if (action === 'counter') {
        await supabase
            .from('borrow_requests')
            .update({
                status: 'counter_offered',
                counter_duration: data?.counterDuration,
                counter_message: data?.counterMessage,
                responded_at: new Date().toISOString()
            })
            .eq('id', requestId)

        await supabase.from('notifications').insert({
            user_id: request.borrower_id,
            type: 'info',
            message: `Counter offer for "${request.book.title}"`,
            link: `/dashboard/lending/requests/${requestId}`
        })
    }

    revalidatePath('/dashboard/lending')
    return { success: true }
}

export async function acceptCounterOffer(requestId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { data: request } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('id', requestId)
        .eq('borrower_id', user.id)
        .eq('status', 'counter_offered')
        .single()

    if (!request) throw new Error("Request not found")

    // Update the proposed duration to counter duration
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (request.counter_duration || request.proposed_duration))

    await supabase
        .from('borrow_requests')
        .update({
            status: 'accepted',
            proposed_duration: request.counter_duration || request.proposed_duration,
            due_date: dueDate.toISOString()
        })
        .eq('id', requestId)

    await supabase
        .from('books')
        .update({ lending_status: 'reserved' })
        .eq('id', request.book_id)

    revalidatePath('/dashboard/lending')
    return { success: true }
}

export async function confirmPickup(requestId: string, conditionPhotos?: string[]) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { data: request } = await supabase
        .from('borrow_requests')
        .select('*, book:book_id(lending_condition)')
        .eq('id', requestId)
        .eq('owner_id', user.id)
        .eq('status', 'accepted')
        .single()

    if (!request) throw new Error("Request not found")

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + request.proposed_duration)

    await supabase
        .from('borrow_requests')
        .update({
            status: 'active',
            pickup_date: new Date().toISOString(),
            due_date: dueDate.toISOString(),
            condition_at_lending: request.book?.lending_condition,
            condition_photos_lending: conditionPhotos || []
        })
        .eq('id', requestId)

    await supabase
        .from('books')
        .update({ 
            lending_status: 'lent_out',
            times_lent: (request.book as any)?.times_lent + 1 || 1
        })
        .eq('id', request.book_id)

    // Create activity
    await supabase.from('activities').insert({
        user_id: user.id,
        activity_type: 'book_lent',
        book_id: request.book_id,
        related_user_id: request.borrower_id
    })

    revalidatePath('/dashboard/lending')
    return { success: true }
}

export async function initiateReturn(requestId: string, conditionPhotos?: string[], notes?: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { data: request } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('id', requestId)
        .eq('borrower_id', user.id)
        .eq('status', 'active')
        .single()

    if (!request) throw new Error("Request not found")

    await supabase
        .from('borrow_requests')
        .update({
            status: 'return_pending',
            condition_photos_return: conditionPhotos || [],
            condition_at_return: notes
        })
        .eq('id', requestId)

    await supabase.from('notifications').insert({
        user_id: request.owner_id,
        type: 'info',
        message: 'Borrower is ready to return your book',
        link: `/dashboard/lending/requests/${requestId}`
    })

    revalidatePath('/dashboard/lending')
    return { success: true }
}

export async function confirmReturn(requestId: string, conditionOk: boolean) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { data: request } = await supabase
        .from('borrow_requests')
        .select('*, book:book_id(title)')
        .eq('id', requestId)
        .eq('owner_id', user.id)
        .eq('status', 'return_pending')
        .single()

    if (!request) throw new Error("Request not found")

    await supabase
        .from('borrow_requests')
        .update({
            status: conditionOk ? 'completed' : 'disputed',
            actual_return_date: new Date().toISOString()
        })
        .eq('id', requestId)

    await supabase
        .from('books')
        .update({ lending_status: 'available' })
        .eq('id', request.book_id)

    // Create activity
    await supabase.from('activities').insert({
        user_id: request.borrower_id,
        activity_type: 'book_returned',
        book_id: request.book_id,
        related_user_id: user.id
    })

    // Prompt for reviews
    await supabase.from('notifications').insert([
        {
            user_id: user.id,
            type: 'info',
            message: 'Rate your borrower',
            link: `/dashboard/lending/review/${requestId}?role=owner`
        },
        {
            user_id: request.borrower_id,
            type: 'info',
            message: 'Rate your lending experience',
            link: `/dashboard/lending/review/${requestId}?role=borrower`
        }
    ])

    revalidatePath('/dashboard/lending')
    return { success: true }
}

export async function cancelBorrowRequest(requestId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { data: request } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('id', requestId)
        .eq('borrower_id', user.id)
        .in('status', ['pending', 'counter_offered'])
        .single()

    if (!request) throw new Error("Request not found or cannot be cancelled")

    await supabase
        .from('borrow_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)

    revalidatePath('/dashboard/lending')
    return { success: true }
}

// =====================================================
// GET REQUESTS
// =====================================================

export async function getMyBorrowRequests(type: 'incoming' | 'outgoing' | 'active') {
    const user = await getUser()
    if (!user) return []

    const supabase = await createClient()

    let query = supabase
        .from('borrow_requests')
        .select(`
            *,
            book:book_id (id, title, author, cover_image),
            owner:owner_id (id, username, full_name, profile_picture, city),
            borrower:borrower_id (id, username, full_name, profile_picture, city)
        `)
        .order('created_at', { ascending: false })

    if (type === 'incoming') {
        query = query.eq('owner_id', user.id).in('status', ['pending', 'counter_offered'])
    } else if (type === 'outgoing') {
        query = query.eq('borrower_id', user.id).in('status', ['pending', 'counter_offered', 'accepted'])
    } else if (type === 'active') {
        query = query
            .or(`owner_id.eq.${user.id},borrower_id.eq.${user.id}`)
            .in('status', ['active', 'return_pending'])
    }

    const { data } = await query
    return data || []
}

export async function getBorrowRequestDetails(requestId: string) {
    const user = await getUser()
    if (!user) return null

    const supabase = await createClient()

    const { data } = await supabase
        .from('borrow_requests')
        .select(`
            *,
            book:book_id (*),
            owner:owner_id (id, username, full_name, profile_picture, city, lending_reputation, total_books_lent),
            borrower:borrower_id (id, username, full_name, profile_picture, city, borrowing_reputation, total_books_borrowed)
        `)
        .eq('id', requestId)
        .or(`owner_id.eq.${user.id},borrower_id.eq.${user.id}`)
        .single()

    return data
}

// =====================================================
// TRANSACTION REVIEWS
// =====================================================

export async function submitTransactionReview(data: {
    requestId: string
    revieweeId: string
    role: 'owner' | 'borrower'
    overallRating: number
    communicationRating?: number
    timelinessRating?: number
    bookConditionRating?: number
    reviewText?: string
}) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Verify the request exists and user was part of it
    const { data: request } = await supabase
        .from('borrow_requests')
        .select('id, owner_id, borrower_id, status')
        .eq('id', data.requestId)
        .eq('status', 'completed')
        .single()

    if (!request) throw new Error("Request not found or not completed")

    const isOwner = request.owner_id === user.id
    const isBorrower = request.borrower_id === user.id
    if (!isOwner && !isBorrower) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('transaction_reviews')
        .insert({
            borrow_request_id: data.requestId,
            reviewer_id: user.id,
            reviewee_id: data.revieweeId,
            reviewer_role: isOwner ? 'owner' : 'borrower',
            overall_rating: data.overallRating,
            communication_rating: data.communicationRating,
            timeliness_rating: data.timelinessRating,
            book_condition_rating: data.bookConditionRating,
            review_text: data.reviewText
        })

    if (error) {
        if (error.code === '23505') throw new Error("You already reviewed this transaction")
        throw new Error("Failed to submit review")
    }

    revalidatePath('/dashboard/lending')
    return { success: true }
}

export async function getUserTransactionReviews(userId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('transaction_reviews')
        .select(`
            *,
            reviewer:reviewer_id (id, username, full_name, profile_picture),
            borrow_request:borrow_request_id (book:book_id(title, cover_image))
        `)
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

    return data || []
}
