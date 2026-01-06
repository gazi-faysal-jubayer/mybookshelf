import { ConnectionsGridSkeleton } from "@/components/ui/loaders"
import { Skeleton } from "@/components/ui/skeleton"

export default function ConnectionsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            {/* Tabs */}
            <Skeleton className="h-10 w-[300px]" />

            {/* Search */}
            <Skeleton className="h-10 w-full max-w-sm" />

            {/* Connections Grid */}
            <ConnectionsGridSkeleton count={9} />
        </div>
    )
}
