import Link from "next/link"
import { BookGrid } from "./book-grid"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp } from "lucide-react"

interface TrendingSectionProps {
    books: any[]
}

export function TrendingSection({ books }: TrendingSectionProps) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Trending This Week</h2>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/discover?sort=trending">
                        View all
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
                Popular books in the community this week
            </p>
            <BookGrid books={books} />
        </section>
    )
}
