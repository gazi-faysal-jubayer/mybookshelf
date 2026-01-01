"use client"

import { useState } from "react"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface BulkStatusDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedCount: number
    onConfirm: (readingStatus: string) => Promise<void>
}

export function BulkStatusDialog({
    open,
    onOpenChange,
    selectedCount,
    onConfirm,
}: BulkStatusDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<string>("")

    const handleConfirm = async () => {
        if (!status) return
        setIsLoading(true)
        try {
            await onConfirm(status)
            onOpenChange(false)
            setStatus("")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Change Status for {selectedCount} Book{selectedCount !== 1 ? "s" : ""}
                    </DialogTitle>
                    <DialogDescription>
                        Select the new reading status for the selected books.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Reading Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="to_read">To Read</SelectItem>
                                <SelectItem value="currently_reading">Currently Reading</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="abandoned">Abandoned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !status}
                    >
                        {isLoading ? "Updating..." : "Update Status"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
