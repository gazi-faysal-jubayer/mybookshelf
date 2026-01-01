"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { searchUsersForMention } from "@/app/actions/social"
import { cn } from "@/lib/utils"
import { Loader2, AtSign } from "lucide-react"

interface UserProfile {
    id: string
    username: string
    full_name: string | null
    profile_picture: string | null
}

interface UserMentionInputProps {
    value?: string
    onChange: (value: string) => void
    onUserSelect?: (user: UserProfile | null) => void
    selectedUser?: UserProfile | null
    placeholder?: string
    className?: string
}

export function UserMentionInput({
    value = "",
    onChange,
    onUserSelect,
    selectedUser,
    placeholder = "Type @ to mention a user...",
    className
}: UserMentionInputProps) {
    const [inputValue, setInputValue] = useState(value)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestions, setSuggestions] = useState<UserProfile[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    // Debounced search
    const searchUsers = useCallback(async (query: string) => {
        if (query.length < 1) {
            setSuggestions([])
            return
        }

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

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setInputValue(newValue)
        onChange(newValue)

        // Check if we're in a mention context
        const lastAtIndex = newValue.lastIndexOf('@')
        if (lastAtIndex !== -1) {
            const afterAt = newValue.slice(lastAtIndex + 1)
            // Only trigger if @ is at start or after a space
            const beforeAt = newValue.slice(0, lastAtIndex)
            if (beforeAt === '' || beforeAt.endsWith(' ')) {
                setMentionQuery(afterAt)
                setShowSuggestions(true)
                searchUsers(afterAt)
                return
            }
        }

        setMentionQuery(null)
        setShowSuggestions(false)

        // Clear selected user if input is manually edited
        if (selectedUser && newValue !== (selectedUser.full_name || selectedUser.username)) {
            onUserSelect?.(null)
        }
    }

    // Handle user selection
    const handleSelectUser = (user: UserProfile) => {
        const displayName = user.full_name || user.username
        setInputValue(displayName)
        onChange(displayName)
        onUserSelect?.(user)
        setShowSuggestions(false)
        setMentionQuery(null)
        inputRef.current?.focus()
    }

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
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
                e.preventDefault()
                handleSelectUser(suggestions[highlightedIndex])
                break
            case 'Escape':
                setShowSuggestions(false)
                break
        }
    }

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Sync external value changes
    useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value)
        }
    }, [value])

    return (
        <div className="relative">
            <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={cn("pl-9", className)}
                />
                {selectedUser && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedUser.profile_picture || undefined} />
                            <AvatarFallback className="text-xs">
                                {(selectedUser.full_name || selectedUser.username).charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-lg"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                            {mentionQuery ? "No users found" : "Type to search users..."}
                        </div>
                    ) : (
                        suggestions.map((user, index) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelectUser(user)}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
                                    index === highlightedIndex
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent/50"
                                )}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.profile_picture || undefined} />
                                    <AvatarFallback>
                                        {(user.full_name || user.username).charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">
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
