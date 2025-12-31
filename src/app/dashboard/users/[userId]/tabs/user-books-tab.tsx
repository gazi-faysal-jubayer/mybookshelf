"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Star, ArrowRight } from "lucide-react"

interface UserBooksTabProps {
    userId: string
    isOwnProfile: boolean
}

interface Book {
    id: string
    title: string
    author: string
    cover_image?: string
    rating?: number
    reading_status?: string
    is_available_for_lending?: boolean
    lending_condition?: string
}

export function UserBooksTab({ userId, isOwnProfile }: UserBooksTabProps) {
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'available' | 'reading' | 'completed'>('all')

    useEffect(() => {
        async function fetchBooks() {
            setLoading(true)
            const supabase = createClient()

            let query = supabase
                .from('books')
                .select('id, title, author, cover_image, rating, reading_status, is_available_for_lending, lending_condition')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (filter === 'available') {
                query = query.eq('is_available_for_lending', true)
            } else if (filter === 'reading') {
                query = query.eq('reading_status', 'currently_reading')
            } else if (filter === 'completed') {
                query = query.eq('reading_status', 'completed')
            }

            const { data } = await query.limit(20)
            setBooks(data || [])
            setLoading(false)
        }

        fetchBooks()
    }, [userId, filter])

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    All Books
                </Button>
                <Button
                    variant={filter === 'available' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('available')}
                >
                    Available to Borrow
                </Button>
                <Button
                    variant={filter === 'reading' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('reading')}
                >
                    Currently Reading
                </Button>
                <Button
                    variant={filter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </Button>
            </div>

            {/* Books Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <Skeleton className="aspect-[2/3]" />
                            <CardContent className="p-3">
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-3 w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    {filter === 'all' 
                        ? "No books in the library yet."
                        : `No ${filter === 'available' ? 'available' : filter} books.`}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {books.map((book) => (
                        <Link key={book.id} href={`/dashboard/books/${book.id}`}>
                            <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
                                <div className="relative aspect-[2/3] bg-muted">
                                    {book.cover_image ? (
                                        <Image
                                            src={book.cover_image}
                                            alt={book.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                    )}
                                    {book.is_available_for_lending && (
                                        <Badge className="absolute top-2 right-2 bg-green-500">
                                            Available
                                        </Badge>
                                    )}
                                </div>
                                <CardContent className="p-3">
                                    <h3 className="font-medium line-clamp-1 group-hover:text-primary">
                                        {book.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {book.author}
                                    </p>
                                    {book.rating && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            <span className="text-xs">{book.rating}/5</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* View All Link */}
            {books.length >= 20 && (
                <div className="text-center pt-4">
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/users/${userId}/books`}>
                            View All Books
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
