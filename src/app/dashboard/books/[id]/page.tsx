import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, BookOpen, Tag, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient, getUser } from "@/lib/supabase/server"
import { format } from "date-fns"

export default async function BookPage({ params }: { params: { id: string } }) {
    const user = await getUser()
    if (!user) return notFound()

    const supabase = await createClient()

    // Await the params object before accessing properties
    const { id } = await params

    const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error || !book) {
        notFound()
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="grid gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
                    <p className="text-muted-foreground text-lg">{book.author}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/books/${book.id}/edit`}>Edit</Link>
                    </Button>
                    <Button variant="destructive">Delete</Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-wrap gap-4 mb-6">
                            <Badge variant={book.ownership_status === "owned" ? "default" : "secondary"}>
                                {book.ownership_status.replace(/_/g, " ")}
                            </Badge>
                            <Badge variant="outline">
                                {book.reading_status.replace(/_/g, " ")}
                            </Badge>
                            <Badge variant="outline">
                                {book.format}
                            </Badge>
                        </div>

                        {book.description && (
                            <div className="prose dark:prose-invert max-w-none">
                                <h3 className="text-lg font-semibold mb-2">Description</h3>
                                <p>{book.description}</p>
                            </div>
                        )}

                        {book.review && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2">My Review</h3>
                                <div className="bg-muted p-4 rounded-md italic">
                                    "{book.review}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold">Details</h3>
                        <Separator />
                        <div className="grid gap-2 text-sm">
                            {book.isbn && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">ISBN</span>
                                    <span>{book.isbn}</span>
                                </div>
                            )}
                            {book.publisher && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Publisher</span>
                                    <span>{book.publisher}</span>
                                </div>
                            )}
                            {book.publication_year && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Year</span>
                                    <span>{book.publication_year}</span>
                                </div>
                            )}
                            {book.purchase_date && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Purchased</span>
                                    <span>{format(new Date(book.purchase_date), "PPP")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
