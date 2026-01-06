import { BookGridSkeleton } from "@/components/ui/loaders"
import { Skeleton } from "@/components/ui/skeleton"

export default function BookmarksLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Skeleton className="h-10 w-full max-w-sm" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Bookmarks Grid */}
            <BookGridSkeleton count={8} />
        </div>
    )
}
