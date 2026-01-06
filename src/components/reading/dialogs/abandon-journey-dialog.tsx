"use client"

import { useState, useEffect } from "react"
import { abandonJourney } from "@/app/actions/journeys"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { PauseCircle } from "lucide-react"

interface AbandonJourneyDialogProps {
    journeyId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const ABANDON_REASONS = [
    { value: "lost_interest", label: "Lost interest in the book" },
    { value: "too_difficult", label: "Too difficult to understand" },
    { value: "not_expected", label: "Not what I expected" },
    { value: "too_busy", label: "Too busy right now" },
    { value: "other", label: "Other reason" },
]

export function AbandonJourneyDialog({
    journeyId,
    open,
    onOpenChange,
    onSuccess
}: AbandonJourneyDialogProps) {
    const [selectedReason, setSelectedReason] = useState("")
    const [customReason, setCustomReason] = useState("")
    const [isAbandoning, setIsAbandoning] = useState(false)

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedReason("")
            setCustomReason("")
        }
    }, [open])

    const handleAbandon = async () => {
        let reasonText = ""

        if (selectedReason) {
            const reason = ABANDON_REASONS.find(r => r.value === selectedReason)
            reasonText = reason?.label || ""
        }

        if (customReason.trim()) {
            reasonText = reasonText
                ? `${reasonText}: ${customReason.trim()}`
                : customReason.trim()
        }

        setIsAbandoning(true)
        try {
            const result = await abandonJourney(journeyId, reasonText || undefined)

            if (result.success) {
                toast.success("Journey marked as abandoned")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "Failed to abandon journey")
            }
        } catch (error) {
            toast.error("Failed to abandon journey")
        } finally {
            setIsAbandoning(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PauseCircle className="h-5 w-5" />
                        Abandon Reading Journey
                    </DialogTitle>
                    <DialogDescription>
                        Mark this journey as abandoned. You can resume it anytime or start a fresh journey later.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            💡 Your reading progress, sessions, and notes will be preserved. You can resume this journey or start a new one anytime.
                        </p>
                    </div>

                    {/* Reason Select */}
                    <div className="space-y-2">
                        <Label htmlFor="abandon-reason">Why are you stopping? (optional)</Label>
                        <Select value={selectedReason} onValueChange={setSelectedReason}>
                            <SelectTrigger id="abandon-reason">
                                <SelectValue placeholder="Select a reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                {ABANDON_REASONS.map((reason) => (
                                    <SelectItem key={reason.value} value={reason.value}>
                                        {reason.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="custom-reason">Additional Notes (optional)</Label>
                        <Textarea
                            id="custom-reason"
                            placeholder="e.g., Will try again later, might pick up a different edition..."
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAbandoning}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleAbandon}
                        disabled={isAbandoning}
                    >
                        {isAbandoning ? "Abandoning..." : "Abandon Journey"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
