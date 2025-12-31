import { BookForm } from "@/components/books/book-form"
import { Separator } from "@/components/ui/separator"

export default function AddBookPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Add Book</h3>
                <p className="text-sm text-muted-foreground">
                    Add a new book to your collection.
                </p>
            </div>
            <Separator />
            <div className="max-w-2xl">
                <BookForm />
            </div>
        </div>
    )
}
