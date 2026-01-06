"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Spinner-based loaders for dynamic/unknown content

interface TabLoaderProps {
    className?: string
    text?: string
}

export function TabLoader({ className, text = "Loading..." }: TabLoaderProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 text-muted-foreground",
            className
        )}>
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm">{text}</p>
        </div>
    )
}

interface PageLoaderProps {
    className?: string
}

export function PageLoader({ className }: PageLoaderProps) {
    return (
        <div className={cn(
            "flex items-center justify-center min-h-[400px]",
            className
        )}>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
}

interface CardLoaderProps {
    className?: string
}

export function CardLoader({ className }: CardLoaderProps) {
    return (
        <div className={cn(
            "flex items-center justify-center p-8",
            className
        )}>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
    )
}

interface InlineLoaderProps {
    className?: string
    size?: "sm" | "md" | "lg"
}

export function InlineLoader({ className, size = "md" }: InlineLoaderProps) {
    const sizeClasses = {
        sm: "h-3 w-3",
        md: "h-4 w-4", 
        lg: "h-6 w-6"
    }
    
    return (
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
    )
}

// Skeleton-based loaders for known layouts

export function BookCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-[2/3] w-full" />
            <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
            </CardContent>
        </Card>
    )
}

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <BookCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
            </CardContent>
        </Card>
    )
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function FeedPostSkeleton() {
    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                </div>
            </CardContent>
        </Card>
    )
}

export function FeedSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <FeedPostSkeleton key={i} />
            ))}
        </div>
    )
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <div className="flex items-center gap-4 p-4 border-b">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
            ))}
        </div>
    )
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <Card>
            <div className="p-4 border-b">
                <div className="flex items-center gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} columns={columns} />
            ))}
        </Card>
    )
}

export function JourneyCardSkeleton() {
    return (
        <Card className="flex-shrink-0 w-[240px] h-[200px]">
            <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded" />
                </div>
                <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent className="p-3 pt-0 flex flex-col items-center">
                <Skeleton className="h-[75px] w-[75px] rounded-full my-1" />
                <Skeleton className="h-3 w-24 mt-2" />
                <Skeleton className="h-3 w-20 mt-1" />
            </CardContent>
        </Card>
    )
}

export function JourneyTimelineSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="flex gap-4 overflow-hidden pb-2">
            {Array.from({ length: count }).map((_, i) => (
                <JourneyCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function ReadingProgressSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-32 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </CardContent>
        </Card>
    )
}

export function QuickNotesSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-6" />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border-l-2 border-muted pl-3 py-1">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-3 w-20 mt-2" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export function SessionViewerSkeleton() {
    return (
        <div className="space-y-6">
            {/* Journey Header */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-28" />
                            <Skeleton className="h-9 w-20" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Progress Card */}
            <Card>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <Skeleton className="h-[120px] w-[120px] rounded-full" />
                        <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                    <Skeleton className="h-2 w-full rounded-full mt-4" />
                </CardContent>
            </Card>
        </div>
    )
}

export function BookDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex gap-6">
                <Skeleton className="w-[180px] h-[270px] rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Skeleton className="h-10 w-36" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
            <Skeleton className="h-10 w-[400px]" />
            
            {/* Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <ReadingProgressSkeleton />
                </div>
                <div className="space-y-6">
                    <QuickNotesSkeleton />
                </div>
            </div>
        </div>
    )
}

export function UserCardSkeleton() {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function ConnectionsGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <UserCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function CollectionCardSkeleton() {
    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                <div className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-12 rounded" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function CollectionsGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <CollectionCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function MessageSkeleton() {
    return (
        <div className="flex gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-3/4 rounded-lg" />
            </div>
        </div>
    )
}

export function ConversationSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <MessageSkeleton key={i} />
            ))}
        </div>
    )
}
