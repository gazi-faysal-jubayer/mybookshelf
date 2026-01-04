import { Suspense } from "react"
import { getReadingStats } from "@/app/actions/analytics"
import { StatCards } from "./stat-cards"
import { GenreChart } from "./charts/genre-chart"
import { ActivityChart } from "./charts/activity-chart"

export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button"
import { BarChart3, BookOpen } from "lucide-react"
import Link from "next/link"

export default async function AnalyticsPage() {
    const stats = await getReadingStats()

    if (!stats) {
        return <div>Failed to load analytics.</div>
    }

    if (stats.totalBooksRead === 0) {
        return <EmptyAnalytics />
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Reading Insights</h1>

            <StatCards
                totalBooks={stats.totalBooksRead}
                totalPages={stats.totalPagesRead}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <ActivityChart
                    data={stats.dailyActivity}
                    title="Reading Activity (Last 30 Days)"
                    description="Pages read per day"
                    dataKey="pages"
                />
                <ActivityChart
                    data={stats.monthlyActivity}
                    title="Books Value"
                    description="Books finished per month"
                    dataKey="count"
                />
                <GenreChart data={stats.genreData} />
            </div>
        </div>
    )
}

function EmptyAnalytics() {
    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reading Insights</h1>
                <p className="text-muted-foreground mt-2">
                    Start reading to unlock detailed statistics about your reading habits.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Visual Placeholder */}
                <div className="border rounded-xl p-8 bg-muted/20 border-dashed flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="h-8 w-8 text-primary opacity-50" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="font-semibold text-lg">Your charts will appear here</h3>
                        <p className="text-sm text-muted-foreground">
                            We'll track your monthly activity, favorite genres, and reading pace automatically as you finish books.
                        </p>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="border rounded-xl p-8 flex flex-col justify-center space-y-6">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            How it works
                        </h3>
                        <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
                            <li>Mark books as "Currently Reading" to track progress</li>
                            <li>Mark books as "Completed" to add to your stats</li>
                            <li>Rate and review books to build your profile</li>
                        </ul>
                    </div>

                    <div className="pt-4">
                        <Button asChild size="lg" className="w-full md:w-auto">
                            <Link href="/dashboard/books/add">
                                Add Your First Book
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
