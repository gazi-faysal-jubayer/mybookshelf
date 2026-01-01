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

export function SidebarNav() {
    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
                <NavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    exact={item.exact}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary"
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
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary"
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
            <SheetContent side="left" className="flex flex-col">
                <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <span className="font-serif">BookKeeper</span>
                    </SheetTitle>
                </SheetHeader>
                <nav className="grid gap-2 text-lg font-medium mt-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            exact={item.exact}
                            variant="mobile"
                            className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground"
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    <div className="my-2 border-t" />
                    {mobileOnlyItems.map((item) => (
                        <NavLink
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            variant="mobile"
                            className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground"
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    )
}
