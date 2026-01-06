import { ConversationSkeleton, UserCardSkeleton } from "@/components/ui/loaders"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MessagesLoading() {
    return (
        <div className="flex h-[calc(100vh-120px)] gap-4">
            {/* Conversations List */}
            <Card className="w-80 flex-shrink-0">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                            <Skeleton className="h-3 w-10" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Message Area */}
            <Card className="flex-1 flex flex-col">
                <CardHeader className="border-b pb-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 py-4">
                    <ConversationSkeleton />
                </CardContent>
                <div className="p-4 border-t">
                    <div className="flex gap-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-10" />
                    </div>
                </div>
            </Card>
        </div>
    )
}
