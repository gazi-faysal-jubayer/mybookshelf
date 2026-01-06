import { notFound } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { BookPageClient } from "@/components/books/book-page-client"

interface BookPageProps {
    params: { id: string }
    searchParams: { journey?: string; tab?: string }
}

export default async function BookPage({ params, searchParams }: BookPageProps) {
    const user = await getUser()
    if (!user) return notFound()

    const supabase = await createClient()

    // Await the params and searchParams objects before accessing properties
    const { id } = await params
    const { journey: journeyId, tab: defaultTab } = await searchParams

    // Fetch book with related data
    const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error || !book) {
        notFound()
    }

    // Fetch reading thoughts (during-reading notes) - all for the book
    const { data: thoughts } = await supabase
        .from('reading_thoughts')
        .select('*')
        .eq('book_id', id)
        .eq('user_id', user.id)
        .order('page_number', { ascending: true, nullsFirst: false })

    // Fetch final review from book_reviews
    const { data: finalReview } = await supabase
        .from('book_reviews')
        .select('*')
        .eq('book_id', id)
        .eq('user_id', user.id)
        .single()

    return (
        <BookPageClient
            book={book}
            userId={user.id}
            thoughts={thoughts || []}
            finalReview={finalReview}
            initialJourneyId={journeyId}
            defaultTab={defaultTab}
        />
    )
}
