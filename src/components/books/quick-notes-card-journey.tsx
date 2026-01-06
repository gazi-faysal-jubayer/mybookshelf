"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addDuringReadingThought } from "@/app/actions/reviews"
import { Book, Loader2, Plus } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface ReadingThought {
    id: string
    content: string
    page_number: number | null
    created_at: string
}

interface QuickNotesCardWithJourneyProps {
    bookId: string
    journeyId?: string
    thoughts: ReadingThought[]
    onUpdate?: () => void
}

export function QuickNotesCardWithJourney({ 
    bookId, 
    journeyId,
    thoughts,
    onUpdate 
}: QuickNotesCardWithJourneyProps) {
    const [isAdding, setIsAdding] = useState(false)
    const [newNote, setNewNote] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Sort thoughts by date (newest first) and take top 3
    const recentThoughts = [...thoughts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)

    const handleAddNote = async () => {
        if (!newNote.trim()) return

        setIsLoading(true)
        try {
            await addDuringReadingThought(bookId, {
                content: newNote,
                page_number: undefined,
            }, journeyId)
            setNewNote("")
            setIsAdding(false)
            toast.success("Note added!")
            onUpdate?.()
        } catch {
            toast.error("Failed to add note")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Quick Notes
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setIsAdding(!isAdding)}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Add New Note Input */}
                    {isAdding && (
                        <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-2">
                            <Textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Type your note..."
                                className="min-h-[60px] text-sm"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsAdding(false)}
                                    className="h-7 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAddNote}
                                    disabled={isLoading || !newNote.trim()}
                                    className="h-7 text-xs"
                                >
                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* List Recent Notes */}
                    {recentThoughts.length > 0 ? (
                        <div className="space-y-3">
                            {recentThoughts.map((thought) => (
                                <div key={thought.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                                    <p className="line-clamp-3 text-muted-foreground">{thought.content}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                            {format(new Date(thought.created_at), "MMM d, yyyy")}
                                        </span>
                                        {thought.page_number && (
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Book className="h-3 w-3" />
                                                Pg {thought.page_number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {thoughts.length > 3 && (
                                <p className="text-xs text-center text-muted-foreground">
                                    + {thoughts.length - 3} more notes
                                </p>
                            )}
                        </div>
                    ) : (
                        !isAdding && (
                            <div
                                onClick={() => setIsAdding(true)}
                                className="text-sm text-muted-foreground italic h-[60px] flex items-center justify-center border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                {journeyId ? "No notes for this journey yet..." : "Click to add a note..."}
                            </div>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
