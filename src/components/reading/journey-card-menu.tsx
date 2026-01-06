"use client"

import { useState } from "react"
import { ReadingJourney, deleteJourney, hideJourneyFromOwner, updateJourneyName, updateJourneyVisibility, reopenJourney } from "@/app/actions/journeys"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Edit2,
    Lock,
    Share2,
    FileDown,
    Trash2,
    EyeOff,
    Eye,
    Globe,
    Users,
    PlayCircle,
    MoreVertical
} from "lucide-react"

interface JourneyCardMenuProps {
    journey: ReadingJourney
    isOwner: boolean
    onUpdate?: () => void
}

export function JourneyCardMenu({ journey, isOwner, onUpdate }: JourneyCardMenuProps) {
    const [showRenameDialog, setShowRenameDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [newName, setNewName] = useState(journey.session_name || "")
    const [isRenaming, setIsRenaming] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleRename = async () => {
        if (!newName.trim()) {
            toast.error("Please enter a name")
            return
        }

        setIsRenaming(true)
        try {
            const result = await updateJourneyName(journey.id, newName.trim())
            if (result.success) {
                toast.success("Journey renamed!")
                setShowRenameDialog(false)
                onUpdate?.()
            } else {
                toast.error(result.error || "Failed to rename")
            }
        } catch (error) {
            toast.error("Failed to rename journey")
        } finally {
            setIsRenaming(false)
        }
    }

    const handleChangeVisibility = async (visibility: 'public' | 'connections' | 'private') => {
        try {
            const result = await updateJourneyVisibility(journey.id, visibility)
            if (result.success) {
                toast.success(`Privacy changed to ${visibility}`)
                onUpdate?.()
            } else {
                toast.error(result.error || "Failed to update privacy")
            }
        } catch (error) {
            toast.error("Failed to update privacy")
        }
    }

    const handleShare = () => {
        const url = `${window.location.origin}/journeys/${journey.id}`
        navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard!")
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteJourney(journey.id)
            if (result.success) {
                toast.success("Journey deleted")
                setShowDeleteDialog(false)
                onUpdate?.()
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
        try {
            const result = await hideJourneyFromOwner(journey.id, !journey.is_hidden_by_owner)
            if (result.success) {
                toast.success(journey.is_hidden_by_owner ? "Journey unhidden" : "Journey hidden")
                onUpdate?.()
            } else {
                toast.error(result.error || "Failed to hide/unhide")
            }
        } catch (error) {
            toast.error("Failed to hide/unhide journey")
        }
    }

    const handleResume = async () => {
        try {
            const result = await reopenJourney(journey.id)
            if (result.success) {
                toast.success("Journey resumed!")
                onUpdate?.()
            } else {
                toast.error(result.error || "Failed to resume")
            }
        } catch (error) {
            toast.error("Failed to resume journey")
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100 bg-background/80 hover:bg-background"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {/* Rename */}
                    <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename Journey
                    </DropdownMenuItem>

                    {/* Privacy */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Lock className="h-4 w-4 mr-2" />
                            Change Privacy
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleChangeVisibility('public')}>
                                <Globe className="h-4 w-4 mr-2" />
                                Public
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeVisibility('connections')}>
                                <Users className="h-4 w-4 mr-2" />
                                Connections
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeVisibility('private')}>
                                <Lock className="h-4 w-4 mr-2" />
                                Private
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Share */}
                    {journey.visibility !== 'private' && (
                        <DropdownMenuItem onClick={handleShare}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Journey
                        </DropdownMenuItem>
                    )}

                    {/* Export (placeholder) */}
                    <DropdownMenuItem disabled>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export as PDF
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Resume (if abandoned/completed/archived) */}
                    {(journey.status === 'abandoned' || journey.status === 'completed' || journey.status === 'archived') && (
                        <DropdownMenuItem onClick={handleResume}>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Resume Reading
                        </DropdownMenuItem>
                    )}

                    {/* Hide (book owner only) */}
                    {isOwner && (
                        <DropdownMenuItem onClick={handleHide}>
                            {journey.is_hidden_by_owner ? (
                                <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Unhide Journey
                                </>
                            ) : (
                                <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide Journey
                                </>
                            )}
                        </DropdownMenuItem>
                    )}

                    {/* Delete */}
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Journey
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Rename Dialog */}
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Journey</DialogTitle>
                        <DialogDescription>
                            Give this reading journey a memorable name
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newName}
                            onChange={(e: any) => setNewName(e.target.value)}
                            placeholder="e.g., Summer Re-read 2024"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRename} disabled={isRenaming || !newName.trim()}>
                            {isRenaming ? "Renaming..." : "Rename"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Reading Journey?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this journey and all associated:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Reading sessions ({journey.sessions_count || 0} sessions)</li>
                                <li>Reading thoughts ({journey.thoughts_count || 0} thoughts)</li>
                                <li>Your review (if written)</li>
                            </ul>
                            <p className="mt-3 font-semibold text-destructive">
                                This action cannot be undone!
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete Forever"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
