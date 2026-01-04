import Link from "next/link"
import { Filter, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { createClient, getUserWithProfile } from "@/lib/supabase/server"
import { BookCard } from "@/components/books/book-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default async function BooksPage() {
    const supabase = await createClient()
    const userWithProfile = await getUserWithProfile()

    // Fetch books for the current user
    const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userWithProfile?.id || '')
        .order('created_at', { ascending: false })

    const booksList = books || []

    return (
        <div className="flex flex-col gap-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
                <RecentActivity />
                <div className="col-span-1 md:col-span-1 lg:col-span-7 relative overflow-hidden flex flex-col justify-center p-8 border rounded-xl bg-card shadow-sm">
                    <div className="relative z-10 max-w-lg">
                        <h3 className="text-2xl font-serif font-medium text-foreground">Welcome back, {userWithProfile?.profile?.full_name || userWithProfile?.email?.split('@')[0] || "Reader"}!</h3>
                        <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                            You have <span className="font-semibold text-primary">{booksList.length} books</span> in your collection.
                            {booksList.filter((b: any) => b.reading_status === "currently_reading").length > 0
                                ? ` You are currently immersing yourself in ${booksList.filter((b: any) => b.reading_status === "currently_reading").length} stories.`
                                : " Ready to start a new adventure?"}
                        </p>
                    </div>
                    {/* Decorative Illustration */}
                    <div className="absolute right-[-20px] bottom-[-40px] opacity-90 pointer-events-none md:block hidden">
                        <img
                            src="/assets/reading-haven.png"
                            alt="Cozy reading nook"
                            className="w-[280px] h-auto object-contain"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">My Library</h1>
                    <p className="text-muted-foreground mt-1 text-base">
                        Your personal sanctuary of stories.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 px-4 gap-2 border-primary/20 hover:bg-secondary/50">
                                <Filter className="h-4 w-4" />
                                <span>Filter</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>
                                Owned
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Wishlist</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Lent Out</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" asChild className="h-10 px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:translate-y-[-1px]">
                        <Link href="/dashboard/books/add">
                            <Plus className="h-4 w-4" />
                            <span>Add Book</span>
                        </Link>
                    </Button>
                </div>
            </div>
            <Separator className="bg-border/60" />

            {booksList.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 rounded-xl border border-dashed border-border/60 p-12 text-center animate-in fade-in-50 bg-secondary/10">
                    <div className="relative w-64 h-64 mb-2">
                        <img
                            src="/assets/books-stack.png"
                            alt="Stack of books"
                            className="w-full h-full object-contain opacity-90 drop-shadow-md"
                        />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h3 className="text-xl font-serif font-semibold text-foreground">Your shelves are waiting</h3>
                        <p className="text-muted-foreground">
                            Every library begins with a single book. Start building your collection today.
                        </p>
                    </div>
                    <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                        <Link href="/dashboard/books/add">Add Your First Book</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {booksList.map((book) => (
                        <BookCard key={book.id} book={{ ...book, _id: book.id }} />
                    ))}
                </div>
            )}
        </div>
    )
}
