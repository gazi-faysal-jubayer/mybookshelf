"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { removeBookFromCollection } from "@/app/actions/collection"

export function RemoveBookButton({ collectionId, bookId }: { collectionId: string, bookId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleRemove = () => {
        startTransition(async () => {
            try {
                await removeBookFromCollection(collectionId, bookId)
                toast.success("Book removed from collection")
            } catch (error) {
                toast.error("Failed to remove book")
            }
        })
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleRemove}
            disabled={isPending}
            title="Remove from collection"
        >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove from collection</span>
        </Button>
    )
}
