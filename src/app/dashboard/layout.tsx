import Link from "next/link"
import { CircleUser, Menu, Package2, Search, BookOpen, Compass, MessageSquare, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GlobalSearch } from "@/components/search/global-search"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ThemeToggle } from "@/components/ui/theme-toggle"

async function signOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
                <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-lg font-semibold md:text-base"
                    >
                        <BookOpen className="h-6 w-6" />
                        <span className="hidden lg:inline">BookKeeper</span>
                    </Link>
                    <Link
                        href="/dashboard"
                        className="text-foreground transition-colors hover:text-foreground"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/dashboard/discover"
                        className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1"
                    >
                        <Compass className="h-4 w-4" />
                        Discover
                    </Link>
                    <Link
                        href="/dashboard/books"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        My Books
                    </Link>
                    <Link
                        href="/dashboard/messages"
                        className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1"
                    >
                        <MessageSquare className="h-4 w-4" />
                        Messages
                    </Link>
                    <Link
                        href="/dashboard/collections"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Collections
                    </Link>
                </nav>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 md:hidden"
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <nav className="grid gap-6 text-lg font-medium">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 text-lg font-semibold"
                            >
                                <BookOpen className="h-6 w-6" />
                                BookKeeper
                            </Link>
                            <Link href="/dashboard" className="hover:text-foreground">
                                Dashboard
                            </Link>
                            <Link
                                href="/dashboard/discover"
                                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                            >
                                <Compass className="h-5 w-5" />
                                Discover
                            </Link>
                            <Link
                                href="/dashboard/books"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                My Books
                            </Link>
                            <Link
                                href="/dashboard/messages"
                                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                            >
                                <MessageSquare className="h-5 w-5" />
                                Messages
                            </Link>
                            <Link
                                href="/dashboard/collections"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Collections
                            </Link>
                            <Link
                                href="/dashboard/wishlist"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Wishlist
                            </Link>
                            <Link
                                href="/dashboard/analytics"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Analytics
                            </Link>
                        </nav>
                    </SheetContent>
                </Sheet>
                <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                    <GlobalSearch />
                    <NotificationBell />
                    <ThemeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/users/${user.id}`}>My Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/wishlist">Wishlist</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/analytics">Analytics</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <form
                                action={async () => {
                                    "use server"
                                    await signOut()
                                }}
                            >
                                <button className="w-full text-left" type="submit">
                                    <DropdownMenuItem>Logout</DropdownMenuItem>
                                </button>
                            </form>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
                {children}
            </main>
        </div>
    )
}
