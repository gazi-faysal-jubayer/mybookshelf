import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Book as BookIcon, Calendar, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import connectDB from "@/lib/db"
import Collection from "@/models/Collection"
import { auth } from "@/auth"
import { RemoveBookButton } from "@/components/collections/remove-book-button"
import { DeleteCollectionAction } from "@/components/collections/delete-collection-action"

interface CollectionDetailPageProps {
    params: {
        id: string
    }
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
    const { id } = params
    await connectDB()
    const session = await auth()

    if (!session?.user?.id) return notFound()

    const collection = await Collection.findOne({ _id: id, user_id: session.user.id })
        .populate("books")
        .lean()

    if (!collection) return notFound()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/collections">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">{collection.name}</h1>
                        {collection.is_public && <Badge variant="secondary">Public</Badge>}
                    </div>

                    <p className="text-muted-foreground">
                        {collection.description || "No description"}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DeleteCollectionAction collectionId={collection._id.toString()} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Books ({collection.books.length})</h2>
            </div>

            {collection.books.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    <p>This collection is empty.</p>
                    <Button variant="link" asChild>
                        <Link href="/dashboard">Browse your library to add books</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {collection.books.map((book: any) => (
                        <Card key={book._id.toString()} className="flex flex-col h-full group relative">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <RemoveBookButton collectionId={collection._id.toString()} bookId={book._id.toString()} />
                            </div>
                            <CardHeader>
                                <div className="grid gap-1">
                                    <CardTitle className="line-clamp-1">
                                        <Link href={`/dashboard/books/${book._id}`} className="hover:underline">
                                            {book.title}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="line-clamp-1">{book.author}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <div className="flex space-x-4 text-sm text-muted-foreground mb-4">
                                    <div className="flex items-center">
                                        <BookIcon className="mr-1 h-3 w-3" />
                                        {book.format}
                                    </div>
                                    {book.purchase_info?.date && (
                                        <div className="flex items-center">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            {format(new Date(book.purchase_info.date), "MMM yyyy")}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">{book.ownership_status.replace(/_/g, " ")}</Badge>
                                    <Badge variant="secondary">{book.reading_status.replace(/_/g, " ")}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
