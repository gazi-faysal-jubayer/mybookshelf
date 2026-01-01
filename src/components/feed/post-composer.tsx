"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { MentionTextarea } from "@/components/ui/mention-textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { createPost } from "@/app/actions/posts"
import { toast } from "sonner"
import { Send, Globe, Users, Lock, Loader2 } from "lucide-react"

interface PostComposerProps {
    onPostCreated?: () => void
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
    const [content, setContent] = useState("")
    const [visibility, setVisibility] = useState<"public" | "connections" | "private">("public")
    const [isPending, startTransition] = useTransition()

    const handleSubmit = () => {
        if (!content.trim()) return

        startTransition(async () => {
            try {
                await createPost({ content, visibility })
                setContent("")
                toast.success("Post created!")
                onPostCreated?.()
            } catch (error: any) {
                toast.error(error.message || "Failed to create post")
            }
        })
    }

    const visibilityIcon = {
        public: <Globe className="h-4 w-4" />,
        connections: <Users className="h-4 w-4" />,
        private: <Lock className="h-4 w-4" />,
    }

    return (
        <Card>
            <CardContent className="p-4">
                <MentionTextarea
                    placeholder="What's on your mind? Share your reading journey..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 shadow-none focus:ring-0"
                    maxLength={1000}
                />
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <Select
                            value={visibility}
                            onValueChange={(v) => setVisibility(v as typeof visibility)}
                        >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                {visibilityIcon[visibility]}
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">
                                    <span className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        Public
                                    </span>
                                </SelectItem>
                                <SelectItem value="connections">
                                    <span className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Connections
                                    </span>
                                </SelectItem>
                                <SelectItem value="private">
                                    <span className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Private
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">
                            {content.length}/1000
                        </span>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!content.trim() || isPending}
                        className="gap-1.5"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Post
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
