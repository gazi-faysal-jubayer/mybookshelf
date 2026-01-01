"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface NavLinkProps {
    href: string
    children: React.ReactNode
    icon?: LucideIcon
    className?: string
    exact?: boolean
    variant?: "desktop" | "mobile"
}

export function NavLink({
    href,
    children,
    icon: Icon,
    className,
    exact = false,
    variant = "desktop"
}: NavLinkProps) {
    const pathname = usePathname()

    const isActive = exact
        ? pathname === href
        : pathname === href || pathname.startsWith(href + "/")

    // Special case: /dashboard should only match exactly, not /dashboard/*
    const isActiveAdjusted = href === "/dashboard"
        ? pathname === "/dashboard"
        : isActive

    if (variant === "mobile") {
        return (
            <Link
                href={href}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                    isActiveAdjusted
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    className
                )}
            >
                {Icon && <Icon className="h-5 w-5" />}
                {children}
            </Link>
        )
    }

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-1.5 transition-colors text-sm font-medium",
                isActiveAdjusted
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                className
            )}
        >
            {Icon && <Icon className="h-4 w-4" />}
            {children}
        </Link>
    )
}
