"use client"

import { ReadingJourney } from "@/app/actions/journeys"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Globe, Users, Lock } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface JourneyTimelineCardProps {
    journey: ReadingJourney
    isActive: boolean
    progress: number
    totalPages?: number
    onClick: () => void
    onMenuClick: (e: React.MouseEvent) => void
}

// Circular Progress Component
function CircularProgress({
    value,
    size = 100,
    strokeWidth = 8,
    status = 'active'
}: {
    value: number
    size?: number
    strokeWidth?: number
    status?: string
}) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    const getStatusColor = () => {
        switch (status) {
            case 'active':
                return 'text-green-500'
            case 'completed':
                return 'text-blue-500'
            case 'abandoned':
                return 'text-gray-400'
            default:
                return 'text-primary'
        }
    }

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/20"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn("transition-all duration-500", getStatusColor())}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{Math.round(value)}%</span>
            </div>
        </div>
    )
}

export function JourneyTimelineCard({
    journey,
    isActive,
    progress,
    totalPages,
    onClick,
    onMenuClick
}: JourneyTimelineCardProps) {
    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500 hover:bg-green-600'
            case 'completed':
                return 'bg-blue-500 hover:bg-blue-600'
            case 'abandoned':
                return 'bg-gray-500 hover:bg-gray-600'
            case 'archived':
                return 'bg-purple-500 hover:bg-purple-600'
            default:
                return 'bg-gray-400 hover:bg-gray-500'
        }
    }

    const getVisibilityIcon = () => {
        switch (journey.visibility) {
            case 'public':
                return <Globe className="h-3 w-3" />
            case 'connections':
                return <Users className="h-3 w-3" />
            case 'private':
                return <Lock className="h-3 w-3" />
            default:
                return <Globe className="h-3 w-3" />
        }
    }

    const pagesRead = totalPages ? Math.round((progress / 100) * totalPages) : 0

    return (
        <Card
            onClick={onClick}
            className={cn(
                "flex-shrink-0 w-[280px] md:w-[240px] lg:w-[260px] h-[200px] cursor-pointer transition-all hover:shadow-lg",
                isActive && "ring-2 ring-primary shadow-lg scale-[1.02]"
            )}
        >
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <Badge className={cn("text-xs", getStatusBadgeColor(journey.status))}>
                        {journey.status}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={onMenuClick}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 mt-2">
                    {journey.session_name || "Unnamed Journey"}
                </h3>
            </CardHeader>

            <CardContent className="p-4 pt-0 flex flex-col items-center">
                {/* Circular Progress */}
                <div className="my-2">
                    <CircularProgress value={progress} size={80} strokeWidth={6} status={journey.status} />
                </div>

                {/* Date Info */}
                <div className="text-xs text-center text-muted-foreground space-y-0.5 w-full">
                    <p className="truncate">
                        {journey.status === 'completed' && journey.finished_at
                            ? `Finished ${format(new Date(journey.finished_at), "MMM d, yyyy")}`
                            : `Started ${formatDistanceToNow(new Date(journey.started_at), { addSuffix: true })}`
                        }
                    </p>
                    <p className="font-medium text-foreground">
                        {pagesRead}{totalPages ? `/${totalPages}` : ''} pages
                    </p>
                </div>

                {/* Privacy Icon */}
                <div className="absolute bottom-3 right-3 text-muted-foreground">
                    {getVisibilityIcon()}
                </div>
            </CardContent>
        </Card>
    )
}
