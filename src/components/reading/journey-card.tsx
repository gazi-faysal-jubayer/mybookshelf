"use client"

import { useState } from "react"
import { ReadingJourney, abandonJourney, completeJourney, reopenJourney, updateJourneyName } from "@/app/actions/journeys"
import { format } from "date-fns"
import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    Trash2,
    Star,
    FileText,
    Edit2,
    Check,
    X,
    Ban,
    CheckCircle,
    PlayCircle
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { deleteJourney, hideJourneyFromOwner } from "@/app/actions/journeys"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface JourneyCardProps {
    journey: ReadingJourney
    isActive: boolean
    isOwner: boolean
    onSelect?: () => void
    onRefresh?: () => void
}

export function JourneyCard({ journey, isActive, isOwner, onSelect, onRefresh }: JourneyCardProps) {
    const [isExpanded, setIsExpanded] = useState(isActive)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isHiding, setIsHiding] = useState(false)
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState(journey.session_name || '')
    const [showAbandonDialog, setShowAbandonDialog] = useState(false)
    const [abandonReason, setAbandonReason] = useState('')
    const [isAbandoning, setIsAbandoning] = useState(false)
    const [showCompleteDialog, setShowCompleteDialog] = useState(false)
    const [completeRating, setCompleteRating] = useState(0)
    const [completeReview, setCompleteReview] = useState('')
    const [isCompleting, setIsCompleting] = useState(false)
    const [isResuming, setIsResuming] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteJourney(journey.id)
            if (result.success) {
                toast.success("Reading journey deleted")
                onRefresh?.()
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
                onRefresh?.()
            } else {
                toast.error(result.error || "Failed to hide")
            }
        } catch (error) {
            toast.error("Failed to hide journey")
        } finally {
            setIsHiding(false)
        }
    }

    const handleSaveName = async () => {
        if (!editedName.trim()) {
            toast.error("Please enter a name")
            return
        }
        try {
            const result = await updateJourneyName(journey.id, editedName.trim())
            if (result.success) {
                toast.success("Session name updated")
                setIsEditingName(false)
                onRefresh?.()
            } else {
                toast.error(result.error || "Failed to update name")
            }
        } catch (error) {
            toast.error("Failed to update name")
        }
    }

    const handleAbandon = async () => {
        setIsAbandoning(true)
        try {
            const result = await abandonJourney(journey.id, abandonReason || undefined)
            if (result.success) {
                toast.success("Reading journey abandoned")
                setShowAbandonDialog(false)
                setAbandonReason('')
                onRefresh?.()
            } else {
                toast.error(result.error || "Failed to abandon")
            }
        } catch (error) {
            toast.error("Failed to abandon journey")
        } finally {
            setIsAbandoning(false)
        }
    }

    const handleComplete = async () => {
        setIsCompleting(true)
        try {
            const result = await completeJourney(journey.id, completeRating || undefined, completeReview || undefined)
            if (result.success) {
                toast.success("🎉 Congratulations on completing your reading!")
                setShowCompleteDialog(false)
                setCompleteRating(0)
                setCompleteReview('')
                onRefresh?.()
            } else {
                toast.error(result.error || "Failed to complete")
            }
        } catch (error) {
            toast.error("Failed to complete journey")
        } finally {
            setIsCompleting(false)
        }
    }

    const handleResume = async () => {
        setIsResuming(true)
        try {
            const result = await reopenJourney(journey.id)
            if (result.success) {
                toast.success("Reading resumed!")
                onRefresh?.()
            } else {
                toast.error(result.error || "Failed to resume")
            }
        } catch (error) {
            toast.error("Failed to resume journey")
        } finally {
            setIsResuming(false)
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
        <>
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
                                {isEditingName ? (
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Input
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className="h-8"
                                            placeholder="Session name"
                                        />
                                        <Button variant="ghost" size="sm" onClick={handleSaveName}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditingName(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>{journey.session_name || "Unnamed Session"}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setIsEditingName(true)
                                                setEditedName(journey.session_name || '')
                                            }}
                                        >
                                            <Edit2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(journey.started_at), "MMM d, yyyy")}
                                    {journey.finished_at && (
                                        <span className="text-muted-foreground">
                                            → {format(new Date(journey.finished_at), "MMM d, yyyy")}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1">
                                    {journey.sessions_count || 0} sessions · {journey.thoughts_count || 0} thoughts
                                </div>
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

                        {journey.abandon_reason && journey.status === 'abandoned' && (
                            <div className="mb-4 p-2 bg-muted rounded text-sm">
                                <span className="font-medium">Reason: </span>
                                {journey.abandon_reason}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Status-based actions */}
                            {journey.status === 'active' && (
                                <>
                                    <Button variant="default" size="sm" onClick={() => setShowCompleteDialog(true)}>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Mark Complete
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setShowAbandonDialog(true)}>
                                        <Ban className="h-4 w-4 mr-1" />
                                        Abandon
                                    </Button>
                                </>
                            )}

                            {(journey.status === 'completed' || journey.status === 'abandoned') && (
                                <Button variant="outline" size="sm" onClick={handleResume} disabled={isResuming}>
                                    <PlayCircle className="h-4 w-4 mr-1" />
                                    {isResuming ? "Resuming..." : "Resume Reading"}
                                </Button>
                            )}

                            {/* Delete button */}
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

            {/* Abandon Dialog */}
            <Dialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Abandon Reading</DialogTitle>
                        <DialogDescription>
                            Mark this reading journey as abandoned. You can resume it later if you change your mind.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="abandon-reason">Reason (optional)</Label>
                            <Textarea
                                id="abandon-reason"
                                placeholder="e.g., Got busy, lost interest, will try again later..."
                                value={abandonReason}
                                onChange={(e) => setAbandonReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAbandonDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleAbandon} disabled={isAbandoning}>
                            {isAbandoning ? "Abandoning..." : "Abandon Reading"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete Dialog */}
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>🎉 Complete Reading Journey</DialogTitle>
                        <DialogDescription>
                            Congratulations on finishing! Rate your reading experience and optionally leave a review.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Rating</Label>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setCompleteRating(i + 1)}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            className={cn(
                                                "h-8 w-8 cursor-pointer transition-colors",
                                                i < completeRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-200"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="complete-review">Review (optional)</Label>
                            <Textarea
                                id="complete-review"
                                placeholder="Share your thoughts about the book..."
                                value={completeReview}
                                onChange={(e) => setCompleteReview(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleComplete} disabled={isCompleting}>
                            {isCompleting ? "Completing..." : "Complete Journey"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

