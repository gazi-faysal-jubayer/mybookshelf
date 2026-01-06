"use client"

import { useState } from "react"
import { createNewJourney, archiveJourney } from "@/app/actions/journeys"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Globe, Users, Lock, Archive } from "lucide-react"

interface CreateJourneyDialogProps {
    bookId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    activeJourneyId?: string | null
}

export function CreateJourneyDialog({
    bookId,
    open,
    onOpenChange,
    onSuccess,
    activeJourneyId
}: CreateJourneyDialogProps) {
    const [journeyName, setJourneyName] = useState("")
    const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>('connections')
    const [isCreating, setIsCreating] = useState(false)
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
    const [isArchiving, setIsArchiving] = useState(false)

    const handleArchiveAndCreate = async () => {
        if (!activeJourneyId) {
            toast.error("No active journey found")
            console.error("activeJourneyId is missing:", activeJourneyId)
            return
        }

        console.log("Starting archive for journey:", activeJourneyId)
        setIsArchiving(true)
        try {
            const archiveResult = await archiveJourney(activeJourneyId)
            console.log("Archive result:", archiveResult)

            if (archiveResult.success) {
                toast.success("Active journey archived")
                setShowArchiveConfirm(false)
                // Now create the new journey
                await handleCreate()
            } else {
                toast.error(archiveResult.error || "Failed to archive journey")
            }
        } catch (error) {
            console.error("Archive error:", error)
            toast.error("Failed to archive journey")
        } finally {
            setIsArchiving(false)
        }
    }

    const handleCreate = async () => {
        console.log("handleCreate called with:", { bookId, visibility, journeyName })
        setIsCreating(true)
        try {
            const result = await createNewJourney(
                bookId,
                visibility,
                journeyName.trim() || undefined
            )
            console.log("Create journey result:", result)

            if (result.success) {
                toast.success("New reading journey started!")
                setJourneyName("")
                setVisibility('connections')
                onOpenChange(false)
                onSuccess?.()
            } else {
                // If error is about active journey, show archive option
                if (result.error?.includes("already have an active")) {
                    console.log("Active journey detected, showing archive dialog")
                    setShowArchiveConfirm(true)
                } else {
                    toast.error(result.error || "Failed to create journey")
                }
            }
        } catch (error) {
            console.error("Create journey error:", error)
            toast.error("Failed to create journey")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Start New Reading Journey</DialogTitle>
                        <DialogDescription>
                            Begin a fresh reading experience for this book. Each journey is completely independent with its own progress, notes, and settings.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Journey Name */}
                        <div className="space-y-2">
                            <Label htmlFor="journey-name">Journey Name (optional)</Label>
                            <Input
                                id="journey-name"
                                placeholder="e.g., Summer Re-read, Book Club Read"
                                value={journeyName}
                                onChange={(e) => setJourneyName(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty for auto-generated name (e.g., "First Read", "Re-read #2")
                            </p>
                        </div>

                        {/* Privacy Settings */}
                        <div className="space-y-3">
                            <Label>Who can see this journey?</Label>
                            <RadioGroup value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                                <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="public" id="public" className="mt-0.5" />
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="public" className="font-medium cursor-pointer flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            Public
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Anyone can see this journey
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="connections" id="connections" className="mt-0.5" />
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="connections" className="font-medium cursor-pointer flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Connections
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Only friends and followers can see
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value="private" id="private" className="mt-0.5" />
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="private" className="font-medium cursor-pointer flex items-center gap-2">
                                            <Lock className="h-4 w-4" />
                                            Private
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Only you can see this journey
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={isCreating}>
                            {isCreating ? "Starting..." : "Start Journey"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Archive Confirmation Dialog */}
            <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Active Journey?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You already have an active reading journey for this book. Would you like to archive it and start a new journey?
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Archive className="h-4 w-4" />
                                    What happens when you archive:
                                </p>
                                <ul className="text-sm mt-2 space-y-1 ml-6 list-disc">
                                    <li>Current journey will be marked as archived</li>
                                    <li>All your sessions and notes are preserved</li>
                                    <li>You can view it anytime in your journey history</li>
                                    <li>A fresh journey will start immediately</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isArchiving}>Keep Current</AlertDialogCancel>
                        <Button
                            onClick={(e) => {
                                e.preventDefault()
                                handleArchiveAndCreate()
                            }}
                            disabled={isArchiving}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isArchiving ? "Archiving..." : "Archive & Start New"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
