"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { searchUsersForMention } from "@/app/actions/social"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface UserProfile {
    id: string
    username: string
    full_name: string | null
    profile_picture: string | null
}

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void // Ensure generic matches standard
    onMention?: (user: UserProfile) => void
}

export function MentionTextarea({
    value,
    onChange,
    onMention,
    className,
    ...props
}: MentionTextareaProps) {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestions, setSuggestions] = useState<UserProfile[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)
    const [cursorPosition, setCursorPosition] = useState<number>(0)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    const searchUsers = useCallback(async (query: string) => {
        setIsLoading(true)
        try {
            const results = await searchUsersForMention(query)
            setSuggestions(results)
            setHighlightedIndex(0)
        } catch (error) {
            console.error("Search failed:", error)
            setSuggestions([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        const newCursorPos = e.target.selectionStart
        setCursorPosition(e.target.selectionStart)
        onChange(e)

        // Find the word being typed
        const textBeforeCursor = newValue.slice(0, newCursorPos)
        const words = textBeforeCursor.split(/\s/)
        const currentWord = words[words.length - 1]

        if (currentWord.startsWith('@') && currentWord.length > 1) {
            const query = currentWord.slice(1)
            setMentionQuery(query)
            setShowSuggestions(true)
            searchUsers(query)
        } else {
            setShowSuggestions(false)
            setMentionQuery(null)
        }
    }

    const handleSelectUser = (user: UserProfile) => {
        const textBeforeCursor = value.slice(0, cursorPosition)
        const textAfterCursor = value.slice(cursorPosition)

        const words = textBeforeCursor.split(/\s/)
        const currentWord = words[words.length - 1]

        // Remove the partial mention query
        const textBeforeMention = textBeforeCursor.slice(0, -currentWord.length)

        const newValue = `${textBeforeMention}@${user.username} ${textAfterCursor}`

        // Create a synthetic event to trigger onChange
        const syntheticEvent = {
            target: { value: newValue },
            currentTarget: { value: newValue }
        } as React.ChangeEvent<HTMLTextAreaElement>

        onChange(syntheticEvent)
        setShowSuggestions(false)
        onMention?.(user)

        // Reset focus
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                const newPos = textBeforeMention.length + user.username.length + 2 // @ + space
                textareaRef.current.setSelectionRange(newPos, newPos)
            }
        }, 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showSuggestions || suggestions.length === 0) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightedIndex(i => (i + 1) % suggestions.length)
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightedIndex(i => (i - 1 + suggestions.length) % suggestions.length)
                break
            case 'Enter':
            case 'Tab':
                e.preventDefault()
                handleSelectUser(suggestions[highlightedIndex])
                break
            case 'Escape':
                setShowSuggestions(false)
                break
        }
    }

    return (
        <div className="relative">
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={className}
                {...props}
            />

            {showSuggestions && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 mt-1 w-64 rounded-md border bg-popover p-1 shadow-lg"
                    style={{
                        // Rudimentary positioning: just below the textarea or fixed at bottom left
                        // Properly calculating caret coordinates is complex without a library
                        top: "100%",
                        left: 0
                    }}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                            No users found
                        </div>
                    ) : (
                        suggestions.map((user, index) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelectUser(user)}
                                className={cn(
                                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                                    index === highlightedIndex
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent/50"
                                )}
                            >
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.profile_picture || undefined} />
                                    <AvatarFallback className="text-[10px]">
                                        {(user.full_name || user.username).charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start truncate overflow-hidden">
                                    <span className="font-medium truncate w-full text-left">
                                        {user.full_name || user.username}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        @{user.username}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
