import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function BookCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-[2/3]" />
            <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </CardContent>
        </Card>
    )
}
