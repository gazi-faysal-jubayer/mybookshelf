import { CollectionsGridSkeleton } from "@/components/ui/loaders"
import { Skeleton } from "@/components/ui/skeleton"

export default function CollectionsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <Skeleton className="h-10 flex-1 max-w-sm" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Collections Grid */}
            <CollectionsGridSkeleton count={6} />
        </div>
    )
}
