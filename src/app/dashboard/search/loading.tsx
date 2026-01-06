import { BookGridSkeleton, UserCardSkeleton } from "@/components/ui/loaders"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SearchLoading() {
    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-12 w-full max-w-2xl" />
            </div>

            {/* Tabs */}
            <Skeleton className="h-10 w-[300px]" />

            {/* Search Results */}
            <div className="space-y-6">
                {/* Books Section */}
                <div className="space-y-4">
                    <Skeleton className="h-5 w-24" />
                    <BookGridSkeleton count={6} />
                </div>

                {/* Users Section */}
                <div className="space-y-4">
                    <Skeleton className="h-5 w-20" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <UserCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
