"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// =====================================================
// GLOBAL BOOK DISCOVERY
// =====================================================

export async function discoverBooks(filters: {
    query?: string
    genre?: string
    availableOnly?: boolean
    nearbyOnly?: boolean
    maxDistance?: number // km
    minRating?: number
    sortBy?: 'relevance' | 'distance' | 'rating' | 'newest'
    page?: number
}) {
    const user = await getUser()
    const supabase = await createClient()
    
    const limit = 20
    const page = filters.page || 1
    const offset = (page - 1) * limit

    // Get current user's location if needed
    let userLat: number | null = null
    let userLon: number | null = null
    
    if (filters.nearbyOnly && user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('latitude, longitude')
            .eq('id', user.id)
            .single()
        userLat = profile?.latitude
        userLon = profile?.longitude
    }

    // Build query
    let query = supabase
        .from('books')
        .select(`
            id,
            title,
            author,
            isbn,
            cover_image,
            genre,
            rating,
            lending_status,
            is_available_for_lending,
            lending_condition,
            user_id,
            owner:user_id (
                id,
                username,
                full_name,
                profile_picture,
                city,
                country,
                latitude,
                longitude,
                lending_reputation,
                total_books_lent
            )
        `)

    // Apply filters
    if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,author.ilike.%${filters.query}%,isbn.eq.${filters.query}`)
    }

    if (filters.genre) {
        query = query.contains('genre', [filters.genre])
    }

    if (filters.availableOnly) {
        query = query.eq('is_available_for_lending', true).eq('lending_status', 'available')
    }

    if (filters.minRating) {
        query = query.gte('rating', filters.minRating)
    }

    // Exclude user's own books
    if (user) {
        query = query.neq('user_id', user.id)
    }

    // Apply sorting
    if (filters.sortBy === 'rating') {
        query = query.order('rating', { ascending: false, nullsFirst: false })
    } else if (filters.sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
    } else {
        query = query.order('title', { ascending: true })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: books, error } = await query

    if (error) return { books: [], total: 0 }

    // Post-process for distance filtering if needed
    let processedBooks = books || []

    if (filters.nearbyOnly && userLat && userLon) {
        processedBooks = processedBooks
            .map(book => {
                const owner = book.owner as any
                if (owner?.latitude && owner?.longitude) {
                    const distance = calculateDistance(userLat!, userLon!, owner.latitude, owner.longitude)
                    return { ...book, distance }
                }
                return { ...book, distance: null }
            })
            .filter(book => {
                if (book.distance === null) return false
                return book.distance <= (filters.maxDistance || 50)
            })
            .sort((a, b) => (a.distance || 999) - (b.distance || 999))
    }

    return { books: processedBooks, total: processedBooks.length }
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180)
}

// =====================================================
// BOOK PAGE - Community Stats
// =====================================================

export async function getBookCommunityStats(bookIdentifier: { id?: string, isbn?: string, title?: string }) {
    const user = await getUser()
    const supabase = await createClient()

    // Find all copies of this book
    let query = supabase
        .from('books')
        .select(`
            id,
            user_id,
            reading_status,
            rating,
            is_available_for_lending,
            lending_status,
            lending_condition,
            owner:user_id (
                id,
                username,
                full_name,
                profile_picture,
                city,
                country,
                latitude,
                longitude,
                lending_reputation,
                total_books_lent
            )
        `)

    if (bookIdentifier.id) {
        // Get book details first
        const { data: book } = await supabase
            .from('books')
            .select('isbn, title, author')
            .eq('id', bookIdentifier.id)
            .single()
        
        if (book?.isbn) {
            query = query.eq('isbn', book.isbn)
        } else if (book?.title) {
            query = query.ilike('title', book.title).ilike('author', book.author || '')
        }
    } else if (bookIdentifier.isbn) {
        query = query.eq('isbn', bookIdentifier.isbn)
    } else if (bookIdentifier.title) {
        query = query.ilike('title', `%${bookIdentifier.title}%`)
    }

    const { data: books } = await query

    if (!books || books.length === 0) {
        return {
            totalOwners: 0,
            totalRead: 0,
            totalReading: 0,
            totalWishlist: 0,
            availableForLending: 0,
            averageRating: null,
            owners: [],
            readers: []
        }
    }

    const owners = books.map(b => ({
        ...(b.owner as any),
        bookId: b.id,
        condition: b.lending_condition,
        isAvailable: b.is_available_for_lending && b.lending_status === 'available'
    }))

    const uniqueOwners = Array.from(new Map(owners.map((o: any) => [o.id, o])).values())

    return {
        totalOwners: uniqueOwners.length,
        totalRead: books.filter(b => b.reading_status === 'completed').length,
        totalReading: books.filter(b => b.reading_status === 'currently_reading').length,
        totalWishlist: 0, // Would need to query wishlists
        availableForLending: books.filter(b => b.is_available_for_lending && b.lending_status === 'available').length,
        averageRating: books.filter(b => b.rating).reduce((acc, b) => acc + (b.rating || 0), 0) / books.filter(b => b.rating).length || null,
        owners: uniqueOwners.filter((o: any) => o.isAvailable),
        readers: uniqueOwners.filter((o: any) => !o.isAvailable)
    }
}

// =====================================================
// BOOK REVIEWS (Community)
// =====================================================

export async function writeBookReview(data: {
    bookId: string
    rating: number
    reviewText?: string
    containsSpoilers?: boolean
    tags?: string[]
}) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('book_reviews')
        .upsert({
            book_id: data.bookId,
            user_id: user.id,
            rating: data.rating,
            review_text: data.reviewText,
            contains_spoilers: data.containsSpoilers || false,
            tags: data.tags || []
        }, {
            onConflict: 'book_id,user_id'
        })

    if (error) throw new Error("Failed to save review")

    // Create activity
    await supabase.from('activities').insert({
        user_id: user.id,
        activity_type: 'review_written',
        book_id: data.bookId
    })

    revalidatePath('/dashboard/books')
    return { success: true }
}

export async function getBookReviews(bookId: string, page = 1) {
    const supabase = await createClient()
    const limit = 10
    const offset = (page - 1) * limit

    const { data, count } = await supabase
        .from('book_reviews')
        .select(`
            *,
            user:user_id (id, username, full_name, profile_picture)
        `, { count: 'exact' })
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    return { reviews: data || [], total: count || 0 }
}

export async function voteReview(reviewId: string, isHelpful: boolean) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('review_votes')
        .upsert({
            review_id: reviewId,
            user_id: user.id,
            is_helpful: isHelpful
        }, {
            onConflict: 'review_id,user_id'
        })

    if (error) throw new Error("Failed to vote")

    // Update helpful count
    const { count } = await supabase
        .from('review_votes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId)
        .eq('is_helpful', true)

    await supabase
        .from('book_reviews')
        .update({ helpful_count: count || 0 })
        .eq('id', reviewId)

    revalidatePath('/dashboard/books')
    return { success: true }
}

// =====================================================
// TRENDING & RECOMMENDATIONS
// =====================================================

export async function getTrendingBooks(limit = 10) {
    const supabase = await createClient()

    // Get books with most activity in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activities } = await supabase
        .from('activities')
        .select('book_id')
        .in('activity_type', ['book_added', 'book_finished', 'review_written'])
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('book_id', 'is', null)

    if (!activities) return []

    // Count occurrences
    const bookCounts = activities.reduce((acc: Record<string, number>, a) => {
        if (a.book_id) {
            acc[a.book_id] = (acc[a.book_id] || 0) + 1
        }
        return acc
    }, {})

    // Get top book IDs
    const topBookIds = Object.entries(bookCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id)

    if (topBookIds.length === 0) return []

    // Fetch book details
    const { data: books } = await supabase
        .from('books')
        .select('id, title, author, cover_image, rating, genre')
        .in('id', topBookIds)

    return books || []
}

export async function getRecommendedBooks(limit = 10) {
    const user = await getUser()
    if (!user) return []

    const supabase = await createClient()

    // Get user's favorite genres
    const { data: userBooks } = await supabase
        .from('books')
        .select('genre, rating')
        .eq('user_id', user.id)
        .eq('reading_status', 'completed')
        .order('rating', { ascending: false })
        .limit(20)

    if (!userBooks || userBooks.length === 0) {
        return getTrendingBooks(limit)
    }

    // Extract genres from highly rated books
    const topGenres: string[] = []
    userBooks.forEach(book => {
        if (book.genre && book.rating && book.rating >= 4) {
            book.genre.forEach((g: string) => {
                if (!topGenres.includes(g)) topGenres.push(g)
            })
        }
    })

    if (topGenres.length === 0) {
        return getTrendingBooks(limit)
    }

    // Find books in those genres that user doesn't own
    const { data: recommendations } = await supabase
        .from('books')
        .select('id, title, author, cover_image, rating, genre, user_id')
        .neq('user_id', user.id)
        .gte('rating', 4)
        .overlaps('genre', topGenres)
        .order('rating', { ascending: false })
        .limit(limit)

    return recommendations || []
}

// =====================================================
// NEARBY BOOKS
// =====================================================

export async function getNearbyBooks(maxDistance = 25, limit = 20) {
    const user = await getUser()
    if (!user) return []

    const supabase = await createClient()

    // Get user's location
    const { data: profile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single()

    if (!profile?.latitude || !profile?.longitude) {
        return []
    }

    // Get all available books with owner locations
    const { data: books } = await supabase
        .from('books')
        .select(`
            id,
            title,
            author,
            cover_image,
            genre,
            lending_condition,
            owner:user_id (
                id,
                username,
                full_name,
                profile_picture,
                city,
                latitude,
                longitude,
                lending_reputation
            )
        `)
        .eq('is_available_for_lending', true)
        .eq('lending_status', 'available')
        .neq('user_id', user.id)

    if (!books) return []

    // Calculate distances and filter
    const nearbyBooks = books
        .map(book => {
            const owner = book.owner as any
            if (!owner?.latitude || !owner?.longitude) return null
            
            const distance = calculateDistance(
                profile.latitude,
                profile.longitude,
                owner.latitude,
                owner.longitude
            )
            
            if (distance > maxDistance) return null
            
            return { ...book, distance: Math.round(distance * 10) / 10 }
        })
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)

    return nearbyBooks
}
