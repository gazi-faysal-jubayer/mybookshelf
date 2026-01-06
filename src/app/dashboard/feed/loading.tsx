import { FeedSkeleton } from "@/components/ui/loaders"
import { Skeleton } from "@/components/ui/skeleton"

export default function FeedLoading() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-28" />
            </div>

            {/* Feed Posts */}
            <FeedSkeleton count={5} />
        </div>
    )
}
