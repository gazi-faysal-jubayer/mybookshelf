"use client"

import Link from "next/link"
import { BookOpen, Compass, MessageSquare, Library, Heart, BarChart3, Book, Menu, Newspaper, Users, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { NavLink } from "./nav-link"
import { useState } from "react"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: undefined, exact: true },
    { href: "/dashboard/feed", label: "Feed", icon: Newspaper },
    { href: "/dashboard/discover", label: "Discover", icon: Compass },
    { href: "/dashboard/books", label: "My Books", icon: Book },
    { href: "/dashboard/connections", label: "Connections", icon: Users },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark },
]

const mobileOnlyItems = [
    { href: "/dashboard/collections", label: "Collections", icon: Library },
    { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
]

export function DesktopNav() {
    return (
        <nav className="hidden md:flex md:items-center md:gap-1 lg:gap-2">
            <Link
                href="/dashboard"
                className="flex items-center gap-2 text-lg font-semibold mr-4"
            >
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="hidden lg:inline font-serif">BookKeeper</span>
            </Link>
            {navItems.map((item) => (
                <NavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    exact={item.exact}
                    className="px-3 py-2 rounded-md hover:bg-muted"
                >
                    {item.label}
                </NavLink>
            ))}
        </nav>
    )
}

export function MobileNav() {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
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
            <SheetContent side="left" className="w-72">
                <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <span className="font-serif">BookKeeper</span>
                    </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            exact={item.exact}
                            variant="mobile"
                            className=""
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    <div className="my-4 border-t" />
                    {mobileOnlyItems.map((item) => (
                        <NavLink
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            variant="mobile"
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    )
}
