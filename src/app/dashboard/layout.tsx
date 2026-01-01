import Link from "next/link"
import { CircleUser, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GlobalSearch } from "@/components/search/global-search"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SidebarNav, MobileNav } from "@/components/navigation/dashboard-nav"

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
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block sticky top-0 h-screen overflow-hidden">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <span className="font-serif text-lg">BookKeeper</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <SidebarNav />
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 lg:h-[60px] lg:px-6">
                    <MobileNav />
                    <div className="w-full flex-1">
                        <GlobalSearch />
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <ThemeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="rounded-full">
                                    <CircleUser className="h-5 w-5" />
                                    <span className="sr-only">Toggle user menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
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
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
