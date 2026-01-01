"use client"

import { X, Trash2, FolderPlus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BulkActionsBarProps {
    selectedCount: number
    onDelete: () => void
    onChangeStatus: () => void
    onAddToCollection: () => void
    onCancel: () => void
    isLoading?: boolean
}

export function BulkActionsBar({
    selectedCount,
    onDelete,
    onChangeStatus,
    onAddToCollection,
    onCancel,
    isLoading = false,
}: BulkActionsBarProps) {
    if (selectedCount === 0) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 animate-in slide-in-from-bottom-2">
            <div className="container mx-auto flex items-center justify-between gap-4 max-w-4xl">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {selectedCount} book{selectedCount !== 1 ? "s" : ""} selected
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={onAddToCollection}
                        disabled={isLoading}
                    >
                        <FolderPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add to Collection</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={onChangeStatus}
                        disabled={isLoading}
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Change Status</span>
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={onDelete}
                        disabled={isLoading}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
