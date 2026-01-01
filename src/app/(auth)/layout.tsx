import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen hero-pattern flex flex-col">
            {/* Simple nav */}
            <nav className="p-4 flex items-center justify-between">
                <Link href="/" className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span className="font-semibold">MyBookshelf</span>
                </Link>
                <ThemeToggle />
            </nav>

            {/* Auth content */}
            <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    {children}
                </div>
            </div>

            {/* Decorative elements */}
            <div className="fixed top-20 right-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <div className="fixed bottom-20 left-10 w-40 h-40 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        </div>
    )
}
