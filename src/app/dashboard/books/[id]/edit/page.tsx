import { BookForm } from "@/components/books/book-form"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

export default async function EditBookPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect("/login")
    }
    
    const { id } = await params

    const { data: book, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

    if (error || !book) {
        notFound()
    }

    // Transform dates for the form
    const formData = {
        ...book,
        borrowed_info: book.borrowed_info ? {
            ...book.borrowed_info,
            borrow_date: book.borrowed_info.borrow_date ? new Date(book.borrowed_info.borrow_date) : undefined,
            due_date: book.borrowed_info.due_date ? new Date(book.borrowed_info.due_date) : undefined,
        } : undefined,
        purchase_info: book.purchase_info ? {
            ...book.purchase_info,
            date: book.purchase_info.date ? new Date(book.purchase_info.date) : undefined,
        } : undefined,
    }

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
                <BookForm initialData={formData} bookId={id} />
            </div>
        </div>
    )
}
