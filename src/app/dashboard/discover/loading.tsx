import { BookGridSkeleton } from "@/components/ui/loaders"
import { Skeleton } from "@/components/ui/skeleton"

export default function DiscoverLoading() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Search */}
            <Skeleton className="h-12 w-full max-w-xl" />

            {/* Categories */}
            <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
                ))}
            </div>

            {/* Featured Section */}
            <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Popular Section */}
            <div className="space-y-4">
                <Skeleton className="h-6 w-36" />
                <BookGridSkeleton count={6} />
            </div>
        </div>
    )
}
