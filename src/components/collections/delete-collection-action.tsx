"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { deleteCollection } from "@/app/actions/collection"

export function DeleteCollectionAction({ collectionId }: { collectionId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault()
        startTransition(async () => {
            try {
                await deleteCollection(collectionId)
                toast.success("Collection deleted")
            } catch (error) {
                toast.error("Failed to delete collection")
            }
        })
    }

    return (
        <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={handleDelete}
            disabled={isPending}
        >
            {isPending ? "Deleting..." : "Delete Collection"}
        </DropdownMenuItem>
    )
}
