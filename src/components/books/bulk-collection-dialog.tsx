"use client"

import { useState, useEffect } from "react"
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
import { getUserCollections } from "@/app/actions/collection"

interface BulkCollectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedCount: number
    onConfirm: (collectionId: string) => Promise<void>
}

export function BulkCollectionDialog({
    open,
    onOpenChange,
    selectedCount,
    onConfirm,
}: BulkCollectionDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [collectionId, setCollectionId] = useState<string>("")
    const [collections, setCollections] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
        if (open) {
            getUserCollections().then((data) => {
                // Map _id to id for consistency
                setCollections(data.map((c: any) => ({ id: c._id || c.id, name: c.name })))
            })
        }
    }, [open])

    const handleConfirm = async () => {
        if (!collectionId) return
        setIsLoading(true)
        try {
            await onConfirm(collectionId)
            onOpenChange(false)
            setCollectionId("")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Add {selectedCount} Book{selectedCount !== 1 ? "s" : ""} to Collection
                    </DialogTitle>
                    <DialogDescription>
                        Select a collection to add the selected books to.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Collection</Label>
                        <Select value={collectionId} onValueChange={setCollectionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select collection" />
                            </SelectTrigger>
                            <SelectContent>
                                {collections.length === 0 ? (
                                    <SelectItem value="__none" disabled>
                                        No collections found
                                    </SelectItem>
                                ) : (
                                    collections.map((collection) => (
                                        <SelectItem key={collection.id} value={collection.id}>
                                            {collection.name}
                                        </SelectItem>
                                    ))
                                )}
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
                        disabled={isLoading || !collectionId || collections.length === 0}
                    >
                        {isLoading ? "Adding..." : "Add to Collection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
