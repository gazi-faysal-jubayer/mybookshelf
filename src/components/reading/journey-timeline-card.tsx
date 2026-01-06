"use client"

import { ReadingJourney } from "@/app/actions/journeys"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Globe, Users, Lock, BookOpen, CheckCircle2, PauseCircle, Star } from "lucide-react"
import { format, formatDistanceToNow, differenceInDays } from "date-fns"
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
    const getStatusIcon = () => {
        switch (journey.status) {
            case 'active':
                return <BookOpen className="h-3 w-3" />
            case 'completed':
                return <CheckCircle2 className="h-3 w-3" />
            case 'abandoned':
                return <PauseCircle className="h-3 w-3" />
            default:
                return null
        }
    }

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

    const getDateDisplay = () => {
        const startDate = new Date(journey.started_at)
        
        if (journey.status === 'completed' && journey.finished_at) {
            const finishDate = new Date(journey.finished_at)
            const daysTaken = differenceInDays(finishDate, startDate)
            return `Finished in ${daysTaken} ${daysTaken === 1 ? 'day' : 'days'}`
        }
        
        if (journey.status === 'abandoned') {
            return `Stopped at ${Math.round(progress)}%`
        }
        
        const daysAgo = differenceInDays(new Date(), startDate)
        return daysAgo === 0 ? 'Started today' : `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`
    }

    return (
        <Card
            onClick={onClick}
            className={cn(
                "relative flex-shrink-0 w-[240px] min-w-[240px] max-w-[260px] h-[200px] cursor-pointer transition-all duration-200",
                "hover:shadow-lg hover:-translate-y-0.5",
                isActive && "ring-2 ring-primary shadow-xl scale-[1.02] bg-accent/30",
                journey.status === 'active' && !isActive && "border-green-500/30",
                journey.status === 'completed' && !isActive && "border-blue-500/30"
            )}
        >
            <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between">
                    <Badge className={cn("text-xs gap-1", getStatusBadgeColor(journey.status))}>
                        {getStatusIcon()}
                        {journey.status === 'active' ? 'Reading' : journey.status}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        onClick={onMenuClick}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
                <h3 className="font-semibold text-sm line-clamp-1 mt-1.5">
                    {journey.session_name || "Reading Journey"}
                </h3>
            </CardHeader>

            <CardContent className="p-3 pt-0 flex flex-col items-center justify-between flex-1">
                {/* Circular Progress */}
                <div className="my-1">
                    <CircularProgress value={progress} size={75} strokeWidth={6} status={journey.status} />
                </div>

                {/* Info */}
                <div className="text-xs text-center text-muted-foreground space-y-0.5 w-full">
                    <p className="truncate text-muted-foreground">
                        {getDateDisplay()}
                    </p>
                    <p className="font-medium text-foreground">
                        {journey.status === 'completed' && journey.rating ? (
                            <span className="flex items-center justify-center gap-1">
                                {totalPages} pages • {journey.rating}<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            </span>
                        ) : (
                            <>{pagesRead}{totalPages ? `/${totalPages}` : ''} pages • {Math.round(progress)}%</>
                        )}
                    </p>
                </div>
            </CardContent>

            {/* Privacy Icon - Bottom Right */}
            <div className="absolute bottom-2 right-2 text-muted-foreground/60">
                {getVisibilityIcon()}
            </div>
        </Card>
    )
}
