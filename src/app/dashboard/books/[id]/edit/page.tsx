import { BookForm } from "@/components/books/book-form"
import { Separator } from "@/components/ui/separator"
import Book from "@/models/Book"
import connectDB from "@/lib/db"
import { auth } from "@/auth"
import { notFound } from "next/navigation"

export default async function EditBookPage({ params }: { params: { id: string } }) {
    await connectDB()
    const session = await auth()
    const { id } = await params

    try {
        const book = await Book.findOne({ _id: id, user_id: session?.user?.id }).lean()

        if (!book) {
            notFound()
        }

        // Transform _id to string for the form if needed, or implement EditBookForm that takes data
        // For now we will just re-use BookForm concept but pass initial data.
        // However, the current BookForm inside components doesn't accept initialData props.
        // We need to refactor BookForm or create EditBookForm.

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Edit Book</h3>
                    <p className="text-sm text-muted-foreground">
                        Update book details.
                    </p>
                </div>
                <Separator />
                <div className="max-w-2xl">
                    <BookForm initialData={book} bookId={id} />
                </div>
            </div>
        )

    } catch (error) {
        notFound()
    }
}
