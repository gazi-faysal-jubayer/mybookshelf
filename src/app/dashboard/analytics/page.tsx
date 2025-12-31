import { Suspense } from "react"
import { getReadingStats } from "@/app/actions/analytics"
import { StatCards } from "./stat-cards"
import { GenreChart } from "./charts/genre-chart"
import { ActivityChart } from "./charts/activity-chart"

export default async function AnalyticsPage() {
    const stats = await getReadingStats()

    if (!stats) {
        return <div>Failed to load analytics.</div>
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Reading Insights</h1>

            <StatCards
                totalBooks={stats.totalBooksRead}
                totalPages={stats.totalPagesRead}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <ActivityChart data={stats.monthlyActivity} />
                <GenreChart data={stats.genreData} />
            </div>
        </div>
    )
}
