"use client"

import { useState } from "react"
import { createNewJourney } from "@/app/actions/journeys"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { BookOpen, Globe, Lock, Users } from "lucide-react"

interface NewSessionDialogProps {
    bookId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function NewSessionDialog({
    bookId,
    open,
    onOpenChange,
    onSuccess
}: NewSessionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")
    const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>('public')
    const [initialThoughts, setInitialThoughts] = useState("")

    async function handleCreate() {
        if (!bookId) return

        setLoading(true)
        try {
            // We pass custom name if provided
            const result = await createNewJourney(bookId, visibility, name || undefined)

            if (result.success) {
                toast.success("New reading session started!")
                onSuccess()
                onOpenChange(false)

                // Reset form
                setName("")
                setVisibility('public')
                setInitialThoughts("")
            } else {
                toast.error(result.error || "Failed to start session")
            }
        } catch (error) {
            console.error("Error creating session:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-gray-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <BookOpen className="w-5 h-5 text-amber-500" />
                        Start New Reading Session
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Begin a fresh reading journey. Your previous session will be archived.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-200">Session Name (Optional)</Label>
                        <Input
                            id="name"
                            placeholder="e.g. First Read, Re-read 2024..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500/20"
                        />
                        <p className="text-xs text-gray-500">
                            We'll auto-generate a name if you leave this empty.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-gray-200">Privacy Setting</Label>
                        <RadioGroup
                            value={visibility}
                            onValueChange={(v: any) => setVisibility(v)}
                            className="grid gap-3"
                        >
                            <div className={`
                                flex items-center space-x-3 space-y-0 rounded-lg border p-3 cursor-pointer transition-all
                                ${visibility === 'public'
                                    ? 'bg-amber-500/10 border-amber-500/50'
                                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'}
                            `}>
                                <RadioGroupItem value="public" id="public" className="text-amber-500 border-gray-500" />
                                <Label htmlFor="public" className="flex-1 cursor-pointer font-normal">
                                    <div className="flex items-center gap-2 font-medium text-gray-200">
                                        <Globe className="w-4 h-4 text-emerald-400" />
                                        Public
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        Visible to everyone on the platform
                                    </div>
                                </Label>
                            </div>

                            <div className={`
                                flex items-center space-x-3 space-y-0 rounded-lg border p-3 cursor-pointer transition-all
                                ${visibility === 'connections'
                                    ? 'bg-amber-500/10 border-amber-500/50'
                                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'}
                            `}>
                                <RadioGroupItem value="connections" id="connections" className="text-amber-500 border-gray-500" />
                                <Label htmlFor="connections" className="flex-1 cursor-pointer font-normal">
                                    <div className="flex items-center gap-2 font-medium text-gray-200">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        Connections
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        Visible to friends and followers only
                                    </div>
                                </Label>
                            </div>

                            <div className={`
                                flex items-center space-x-3 space-y-0 rounded-lg border p-3 cursor-pointer transition-all
                                ${visibility === 'private'
                                    ? 'bg-amber-500/10 border-amber-500/50'
                                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'}
                            `}>
                                <RadioGroupItem value="private" id="private" className="text-amber-500 border-gray-500" />
                                <Label htmlFor="private" className="flex-1 cursor-pointer font-normal">
                                    <div className="flex items-center gap-2 font-medium text-gray-200">
                                        <Lock className="w-4 h-4 text-gray-400" />
                                        Private
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        Only you can see this session
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-gray-800 text-gray-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {loading ? "Creating..." : "Start Reading"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
