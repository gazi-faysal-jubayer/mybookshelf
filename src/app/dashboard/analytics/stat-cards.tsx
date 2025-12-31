import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Layers } from "lucide-react"

interface StatCardsProps {
    totalBooks: number
    totalPages: number
}

export function StatCards({ totalBooks, totalPages }: StatCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Books Read
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalBooks}</div>
                    <p className="text-xs text-muted-foreground">
                        Lifetime completed
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Pages Read
                    </CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPages.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Total pages turned
                    </p>
                </CardContent>
            </Card>
            {/* Future placeholders */}
        </div>
    )
}
