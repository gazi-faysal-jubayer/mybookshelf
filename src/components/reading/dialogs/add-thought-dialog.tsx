"use client"

import { useState, useEffect } from "react"
import { addDuringReadingThought } from "@/app/actions/reviews"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

interface AddThoughtDialogProps {
    bookId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function AddThoughtDialog({
    bookId,
    open,
    onOpenChange,
    onSuccess
}: AddThoughtDialogProps) {
    const [content, setContent] = useState("")
    const [pageNumber, setPageNumber] = useState("")
    const [chapter, setChapter] = useState("")
    const [containsSpoilers, setContainsSpoilers] = useState(false)
    const [isAdding, setIsAdding] = useState(false)

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setContent("")
            setPageNumber("")
            setChapter("")
            setContainsSpoilers(false)
        }
    }, [open])

    const handleAddThought = async () => {
        if (!content.trim()) {
            toast.error("Please enter your thought")
            return
        }

        setIsAdding(true)
        try {
            const result = await addDuringReadingThought(bookId, {
                content: content.trim(),
                page_number: pageNumber ? parseInt(pageNumber) : undefined,
                chapter: chapter.trim() || undefined,
                contains_spoilers: containsSpoilers
            })

            if (result.success) {
                toast.success("Thought added!")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error("Failed to add thought")
            }
        } catch (error) {
            toast.error("Failed to add thought")
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Add Reading Thought</DialogTitle>
                    <DialogDescription>
                        Record a thought, insight, or note about what you're reading.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Main Content */}
                    <div className="space-y-2">
                        <Label htmlFor="thought-content">Your Thought *</Label>
                        <Textarea
                            id="thought-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What are you thinking about this book?"
                            rows={5}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Share your reflections, insights, or reactions to what you're reading
                        </p>
                    </div>

                    {/* Page and Chapter */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="thought-page">Page Number</Label>
                            <Input
                                id="thought-page"
                                type="number"
                                min="1"
                                value={pageNumber}
                                onChange={(e) => setPageNumber(e.target.value)}
                                placeholder="e.g., 127"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="thought-chapter">Chapter</Label>
                            <Input
                                id="thought-chapter"
                                value={chapter}
                                onChange={(e) => setChapter(e.target.value)}
                                placeholder="e.g., Chapter 5"
                            />
                        </div>
                    </div>

                    {/* Spoiler Warning */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <div className="space-y-0.5">
                                <Label htmlFor="thought-spoiler" className="cursor-pointer font-medium">
                                    Contains Spoilers
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    This thought reveals plot details
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="thought-spoiler"
                            checked={containsSpoilers}
                            onCheckedChange={setContainsSpoilers}
                        />
                    </div>

                    {containsSpoilers && (
                        <div className="text-sm text-muted-foreground bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            ⚠️ This thought will be blurred by default and shown with a spoiler warning
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
                        Cancel
                    </Button>
                    <Button onClick={handleAddThought} disabled={isAdding || !content.trim()}>
                        {isAdding ? "Adding..." : "Add Thought"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
