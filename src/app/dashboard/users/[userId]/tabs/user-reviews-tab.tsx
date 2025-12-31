"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "@/lib/utils"
import { Star, BookOpen } from "lucide-react"

interface UserReviewsTabProps {
    userId: string
}

interface Review {
    id: string
    rating: number
    review_text?: string
    created_at: string
    helpful_count: number
    book: {
        id: string
        title: string
        author: string
        cover_image?: string
    }
}

export function UserReviewsTab({ userId }: UserReviewsTabProps) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchReviews() {
            setLoading(true)
            const supabase = createClient()

            const { data } = await supabase
                .from('book_reviews')
                .select(`
                    id,
                    rating,
                    review_text,
                    created_at,
                    helpful_count,
                    book:book_id (id, title, author, cover_image)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20)

            setReviews((data as Review[]) || [])
            setLoading(false)
        }

        fetchReviews()
    }, [userId])

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                <Skeleton className="h-24 w-16 rounded" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No reviews written yet.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <Card key={review.id}>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            {/* Book Cover */}
                            <Link 
                                href={`/dashboard/books/${review.book.id}`}
                                className="flex-shrink-0"
                            >
                                <div className="relative h-24 w-16 rounded overflow-hidden bg-muted">
                                    {review.book.cover_image ? (
                                        <Image
                                            src={review.book.cover_image}
                                            alt={review.book.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Review Content */}
                            <div className="flex-1 min-w-0">
                                <Link 
                                    href={`/dashboard/books/${review.book.id}`}
                                    className="hover:underline"
                                >
                                    <h3 className="font-medium line-clamp-1">
                                        {review.book.title}
                                    </h3>
                                </Link>
                                <p className="text-sm text-muted-foreground">
                                    {review.book.author}
                                </p>

                                {/* Rating */}
                                <div className="flex items-center gap-1 mt-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                                i < review.rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-muted-foreground/30"
                                            }`}
                                        />
                                    ))}
                                </div>

                                {/* Review Text */}
                                {review.review_text && (
                                    <p className="text-sm mt-2 line-clamp-3">
                                        {review.review_text}
                                    </p>
                                )}

                                {/* Meta */}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>
                                        {formatDistanceToNow(new Date(review.created_at))}
                                    </span>
                                    {review.helpful_count > 0 && (
                                        <span>
                                            {review.helpful_count} found helpful
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
