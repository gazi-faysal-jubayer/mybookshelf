"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Check, Plus } from "lucide-react"

import {
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { getUserCollections, addBookToCollection } from "@/app/actions/collection"

export function AddToCollectionMenuItem({ bookId }: { bookId: string }) {
    const [collections, setCollections] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Load collections when menu opens (optimized: or load once)
    // For simplicity, we'll load on mount but triggered by parent interaction ideally.
    // Given it's a client component inside a dropdown, it mounts when dropdown opens usually if lazy loaded?
    // Actually Radix dropdown items mount when content opens.

    useEffect(() => {
        const load = async () => {
            setIsLoading(true)
            const cols = await getUserCollections()
            setCollections(cols)
            setIsLoading(false)
        }
        load()
    }, [])

    const handleAddToCollection = async (collectionId: string) => {
        try {
            await addBookToCollection(collectionId, bookId)
            toast.success("Added to collection")
        } catch (error) {
            toast.error("Failed to add to collection")
        }
    }

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Plus className="mr-2 h-4 w-4" />
                Add to Collection
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
                {isLoading ? (
                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                ) : collections.length === 0 ? (
                    <DropdownMenuItem disabled>No collections</DropdownMenuItem>
                ) : (
                    collections.map((collection) => (
                        <DropdownMenuItem
                            key={collection.id}
                            onClick={() => handleAddToCollection(collection.id)}
                        >
                            {collection.books?.some((b: any) => b.book_id === bookId) && <Check className="mr-2 h-4 w-4" />}
                            {collection.name}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    )
}
