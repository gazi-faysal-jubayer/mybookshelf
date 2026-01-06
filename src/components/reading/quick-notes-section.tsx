"use client"

import { useState, useRef, useEffect } from "react"
import { StickyNote, Plus, Star, Trash2, ArrowUp, MoreVertical, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { addQuickNote, deleteQuickNote, toggleNoteStarred, convertNoteToThought } from "@/app/actions/journeys"

interface QuickNote {
    id: string
    content: string
    page_number: number | null
    is_starred: boolean
    created_at: string
}

interface QuickNotesSectionProps {
    journeyId: string
    bookId: string
    notes: QuickNote[]
    isActive: boolean
    onUpdate?: () => void
}

export function QuickNotesSection({
    journeyId,
    bookId,
    notes,
    isActive,
    onUpdate
}: QuickNotesSectionProps) {
    const [isExpanded, setIsExpanded] = useState(notes.length > 0)
    const [inputValue, setInputValue] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Parse page number from input (e.g., "p127: This is my note" or "127: note")
    const parseInput = (input: string): { pageNumber: number | null; content: string } => {
        // Match patterns like "p127:", "P127:", "127:", "page 127:"
        const pageMatch = input.match(/^(?:p(?:age)?\s*)?(\d+)\s*:\s*/i)
        
        if (pageMatch) {
            const pageNumber = parseInt(pageMatch[1], 10)
            const content = input.slice(pageMatch[0].length).trim()
            return { pageNumber, content }
        }
        
        return { pageNumber: null, content: input.trim() }
    }

    const handleSubmit = async () => {
        if (!inputValue.trim() || isSubmitting) return

        const { pageNumber, content } = parseInput(inputValue)
        
        if (!content) {
            toast.error("Please enter a note")
            return
        }

        setIsSubmitting(true)
        try {
            await addQuickNote({
                journeyId,
                bookId,
                content,
                pageNumber
            })
            setInputValue('')
            toast.success("Note added")
            onUpdate?.()
        } catch (error) {
            toast.error("Failed to add note")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleDelete = async (noteId: string) => {
        try {
            await deleteQuickNote(noteId)
            toast.success("Note deleted")
            onUpdate?.()
        } catch (error) {
            toast.error("Failed to delete note")
        }
    }

    const handleToggleStar = async (noteId: string, isStarred: boolean) => {
        try {
            await toggleNoteStarred(noteId, !isStarred)
            onUpdate?.()
        } catch (error) {
            toast.error("Failed to update note")
        }
    }

    const handleConvertToThought = async (noteId: string) => {
        try {
            await convertNoteToThought(noteId)
            toast.success("Converted to detailed thought")
            onUpdate?.()
        } catch (error) {
            toast.error("Failed to convert note")
        }
    }

    // Sort notes: starred first, then by date
    const sortedNotes = [...notes].sort((a, b) => {
        if (a.is_starred && !b.is_starred) return -1
        if (!a.is_starred && b.is_starred) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return (
        <Card>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CardHeader className="pb-2">
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <StickyNote className="h-5 w-5" />
                            Quick Notes
                            {notes.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {notes.length}
                                </Badge>
                            )}
                        </CardTitle>
                    </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="space-y-3">
                        {/* Quick Add Input */}
                        {isActive && (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Add a quick note... (p127: for page)"
                                        className="pr-10"
                                        disabled={isSubmitting}
                                        maxLength={280}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        {inputValue.length}/280
                                    </span>
                                </div>
                                <Button 
                                    size="icon" 
                                    onClick={handleSubmit}
                                    disabled={!inputValue.trim() || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Notes List */}
                        {sortedNotes.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No quick notes yet</p>
                                {isActive && (
                                    <p className="text-xs mt-1">
                                        Type a note above and press Enter to save
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sortedNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        className={cn(
                                            "group flex items-start gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                                            note.is_starred && "border-yellow-400/50 bg-yellow-50/50 dark:bg-yellow-900/10"
                                        )}
                                    >
                                        {/* Star indicator */}
                                        <button
                                            onClick={() => handleToggleStar(note.id, note.is_starred)}
                                            className="mt-0.5 flex-shrink-0"
                                        >
                                            <Star 
                                                className={cn(
                                                    "h-4 w-4 transition-colors",
                                                    note.is_starred 
                                                        ? "fill-yellow-400 text-yellow-400" 
                                                        : "text-muted-foreground/40 hover:text-yellow-400"
                                                )}
                                            />
                                        </button>

                                        {/* Note content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm leading-relaxed break-words">
                                                {note.content}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                {note.page_number && (
                                                    <span className="font-medium">p.{note.page_number}</span>
                                                )}
                                                <span>{format(new Date(note.created_at), "MMM d")}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MoreVertical className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleConvertToThought(note.id)}>
                                                    <ArrowUp className="h-4 w-4 mr-2" />
                                                    Expand to Thought
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(note.id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    )
}
