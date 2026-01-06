"use client"

import { useState } from "react"
import { createNewJourney } from "@/app/actions/journeys"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Globe, Users, Lock } from "lucide-react"

interface CreateJourneyDialogProps {
    bookId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function CreateJourneyDialog({
    bookId,
    open,
    onOpenChange,
    onSuccess
}: CreateJourneyDialogProps) {
    const [journeyName, setJourneyName] = useState("")
    const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>('connections')
    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = async () => {
        setIsCreating(true)
        try {
            const result = await createNewJourney(
                bookId,
                visibility,
                journeyName.trim() || undefined
            )

            if (result.success) {
                toast.success("New reading journey started!")
                setJourneyName("")
                setVisibility('connections')
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "Failed to create journey")
            }
        } catch (error) {
            toast.error("Failed to create journey")
        } finally {
            setIsCreating(false)
        }
    }

    return (
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
    )
}
