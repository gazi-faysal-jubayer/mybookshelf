import Link from "next/link"
import { BookGrid } from "./book-grid"
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin } from "lucide-react"

interface NearbySectionProps {
    books: any[]
}

export function NearbySection({ books }: NearbySectionProps) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Books Near You</h2>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/discover?nearby=true">
                        View all
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
                Available for lending within 25 km of your location
            </p>
            <BookGrid books={books} />
        </section>
    )
}
