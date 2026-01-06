"use client"

import { useState, useRef, useEffect } from "react"
import { ReadingJourney, updateJourneyVisibility, updateJourneyName } from "@/app/actions/journeys"
import { format, formatDistanceToNow, differenceInDays } from "date-fns"
import {
    Globe,
    Users,
    Lock,
    Check,
    ChevronDown,
    Pencil,
    Share2,
    FileText,
    MoreHorizontal,
    BookOpen,
    PauseCircle,
    CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface JourneyHeaderProps {
    journey: ReadingJourney
    bookTitle: string
    onUpdate?: () => void
}

type VisibilityLevel = 'public' | 'connections' | 'private'

const visibilityOptions: { value: VisibilityLevel; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'public', label: 'Public', icon: <Globe className="h-4 w-4" />, description: 'Anyone can see' },
    { value: 'connections', label: 'Connections', icon: <Users className="h-4 w-4" />, description: 'Friends + Followers' },
    { value: 'private', label: 'Private', icon: <Lock className="h-4 w-4" />, description: 'Only you' },
]

export function JourneyHeader({ journey, bookTitle, onUpdate }: JourneyHeaderProps) {
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState(journey.session_name || '')
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setEditedName(journey.session_name || '')
    }, [journey.session_name])

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditingName])

    const handleNameSave = async () => {
        if (editedName.trim() === journey.session_name) {
            setIsEditingName(false)
            return
        }

        try {
            await updateJourneyName(journey.id, editedName.trim())
            toast.success("Journey renamed")
            setIsEditingName(false)
            onUpdate?.()
        } catch (error) {
            toast.error("Failed to rename journey")
        }
    }

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameSave()
        } else if (e.key === 'Escape') {
            setEditedName(journey.session_name || '')
            setIsEditingName(false)
        }
    }

    const handleVisibilityChange = async (visibility: VisibilityLevel) => {
        setIsUpdatingVisibility(true)
        try {
            await updateJourneyVisibility(journey.id, visibility)
            toast.success(`Changed to ${visibility}`)
            onUpdate?.()
        } catch (error) {
            toast.error("Failed to update visibility")
        } finally {
            setIsUpdatingVisibility(false)
        }
    }

    const currentVisibility = visibilityOptions.find(v => v.value === journey.visibility) || visibilityOptions[0]

    const getStatusBadge = () => {
        switch (journey.status) {
            case 'active':
                return (
                    <Badge variant="default" className="gap-1 bg-green-600">
                        <BookOpen className="h-3 w-3" />
                        Currently Reading
                    </Badge>
                )
            case 'completed':
                return (
                    <Badge variant="default" className="gap-1 bg-blue-600">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                    </Badge>
                )
            case 'abandoned':
                return (
                    <Badge variant="secondary" className="gap-1">
                        <PauseCircle className="h-3 w-3" />
                        Abandoned
                    </Badge>
                )
            default:
                return null
        }
    }

    const getDateInfo = () => {
        const startDate = new Date(journey.started_at)
        
        if (journey.status === 'active') {
            const daysReading = differenceInDays(new Date(), startDate)
            return (
                <span>
                    Started {format(startDate, "MMMM d, yyyy")} · Reading for {daysReading} {daysReading === 1 ? 'day' : 'days'}
                </span>
            )
        }
        
        if (journey.status === 'completed' && journey.finished_at) {
            const finishDate = new Date(journey.finished_at)
            const daysTaken = differenceInDays(finishDate, startDate)
            return (
                <span>
                    {format(startDate, "MMM d")} - {format(finishDate, "MMM d, yyyy")} · Finished in {daysTaken} {daysTaken === 1 ? 'day' : 'days'}
                </span>
            )
        }
        
        if (journey.status === 'abandoned') {
            return (
                <span>
                    Started {format(startDate, "MMMM d, yyyy")} · Stopped {formatDistanceToNow(startDate)} ago
                </span>
            )
        }
        
        return <span>Started {format(startDate, "MMMM d, yyyy")}</span>
    }

    return (
        <div className="space-y-3">
            {/* Breadcrumb */}
            <div className="text-sm text-muted-foreground">
                {bookTitle} <span className="mx-1">›</span> <span className="text-foreground">{journey.session_name || 'Reading Journey'}</span>
            </div>

            {/* Main Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Journey Title - Inline Editable */}
                    <div className="flex items-center gap-2 mb-2">
                        {isEditingName ? (
                            <Input
                                ref={inputRef}
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onBlur={handleNameSave}
                                onKeyDown={handleNameKeyDown}
                                className="text-2xl font-bold h-auto py-1 px-2 max-w-md"
                                placeholder="Journey name..."
                            />
                        ) : (
                            <h2 
                                className="text-2xl font-bold cursor-pointer hover:text-muted-foreground transition-colors flex items-center gap-2 group"
                                onClick={() => setIsEditingName(true)}
                            >
                                {journey.session_name || 'Reading Journey'}
                                <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </h2>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge()}
                        {journey.rating && (
                            <Badge variant="outline" className="gap-1">
                                {journey.rating}★
                            </Badge>
                        )}
                    </div>

                    {/* Date Info */}
                    <p className="text-sm text-muted-foreground">
                        {getDateInfo()}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Privacy Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                disabled={isUpdatingVisibility}
                            >
                                {currentVisibility.icon}
                                <span className="hidden sm:inline">{currentVisibility.label}</span>
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {visibilityOptions.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => handleVisibilityChange(option.value)}
                                    className="flex items-center justify-between cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        {option.icon}
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-xs text-muted-foreground">{option.description}</div>
                                        </div>
                                    </div>
                                    {journey.visibility === option.value && (
                                        <Check className="h-4 w-4" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Share Button */}
                    <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Share</span>
                    </Button>

                    {/* More Options */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => toast.info("Delete functionality coming soon")}
                            >
                                Delete Journey
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
