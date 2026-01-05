"use client"

import { useState } from "react"
import { ReadingJourney } from "@/app/actions/journeys"
import { format } from "date-fns"
import {
    BookOpen,
    Calendar,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    Trash2,
    Star,
    FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteJourney, hideJourneyFromOwner, updateJourneyVisibility } from "@/app/actions/journeys"
import { cn } from "@/lib/utils"

interface JourneyCardProps {
    journey: ReadingJourney
    isActive: boolean
    isOwner: boolean
    onSelect?: () => void
}

export function JourneyCard({ journey, isActive, isOwner, onSelect }: JourneyCardProps) {
    const [isExpanded, setIsExpanded] = useState(isActive)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isHiding, setIsHiding] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteJourney(journey.id)
            if (result.success) {
                toast.success("Reading journey deleted")
            } else {
                toast.error(result.error || "Failed to delete")
            }
        } catch (error) {
            toast.error("Failed to delete journey")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleHide = async () => {
        setIsHiding(true)
        try {
            const result = await hideJourneyFromOwner(journey.id, !journey.is_hidden_by_owner)
            if (result.success) {
                toast.success(journey.is_hidden_by_owner ? "Journey unhidden" : "Journey hidden")
            } else {
                toast.error(result.error || "Failed to hide")
            }
        } catch (error) {
            toast.error("Failed to hide journey")
        } finally {
            setIsHiding(false)
        }
    }

    const handleVisibilityChange = async (visibility: 'public' | 'connections' | 'private') => {
        try {
            const result = await updateJourneyVisibility(journey.id, visibility)
            if (result.success) {
                toast.success(`Visibility changed to ${visibility}`)
            } else {
                toast.error(result.error || "Failed to update visibility")
            }
        } catch (error) {
            toast.error("Failed to update visibility")
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500'
            case 'completed':
                return 'bg-blue-500'
            case 'abandoned':
                return 'bg-gray-500'
            case 'archived':
                return 'bg-purple-500'
            default:
                return 'bg-gray-400'
        }
    }

    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'public':
                return <Eye className="h-3 w-3" />
            case 'connections':
                return <FileText className="h-3 w-3" />
            case 'private':
                return <EyeOff className="h-3 w-3" />
            default:
                return <Eye className="h-3 w-3" />
        }
    }

    return (
        <Card
            className={cn(
                "transition-all cursor-pointer hover:shadow-lg",
                isActive && "ring-2 ring-primary"
            )}
            onClick={onSelect}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(journey.status)}>
                                {journey.status}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                                {getVisibilityIcon(journey.visibility)}
                                {journey.visibility}
                            </Badge>
                            {journey.is_hidden_by_owner && (
                                <Badge variant="destructive">Hidden by Owner</Badge>
                            )}
                        </div>
                        <CardTitle className="mt-2 text-lg">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(journey.started_at), "MMM d, yyyy")}
                                {journey.finished_at && (
                                    <span className="text-sm text-muted-foreground">
                                        → {format(new Date(journey.finished_at), "MMM d, yyyy")}
                                    </span>
                                )}
                            </div>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {journey.sessions_count || 0} sessions · {journey.thoughts_count || 0} thoughts
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsExpanded(!isExpanded)
                        }}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent>
                    {journey.rating && (
                        <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        "h-4 w-4",
                                        i < journey.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {journey.review && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {journey.review}
                        </p>
                    )}

                    <div className="flex gap-2">
                        {/* Delete button - only journey creator */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this reading journey?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete this journey and all associated sessions and thoughts.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Hide button - only book owner, not for own journeys */}
                        {isOwner && (
                            <Button variant="outline" size="sm" onClick={handleHide} disabled={isHiding}>
                                {journey.is_hidden_by_owner ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                                {journey.is_hidden_by_owner ? "Unhide" : "Hide"}
                            </Button>
                        )}

                    </div>
                </CardContent>
            )}
        </Card>
    )
}
