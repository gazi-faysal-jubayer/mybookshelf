"use client"

import { useState, useRef, useEffect } from "react"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface InlineEditProps {
    value: string | number | null | undefined
    onSave: (value: any) => Promise<any>
    label?: string
    type?: "text" | "number" | "textarea" | "date"
    className?: string
    inputClassName?: string
}

export function InlineEdit({
    value: initialValue,
    onSave,
    label,
    type = "text",
    className,
    inputClassName,
}: InlineEditProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [value, setValue] = useState(initialValue || "")
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
        setValue(initialValue || "")
    }, [initialValue])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    const handleSave = async () => {
        if (value === initialValue) {
            setIsEditing(false)
            return
        }

        setIsLoading(true)
        try {
            await onSave(value)
            setIsEditing(false)
            toast.success("Updated successfully")
        } catch (error) {
            toast.error("Failed to update")
            setValue(initialValue || "")
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && type !== "textarea" && !e.shiftKey) {
            handleSave()
        } else if (e.key === "Escape") {
            setIsEditing(false)
            setValue(initialValue || "")
        }
    }

    if (isEditing) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                {type === "textarea" ? (
                    <Textarea
                        ref={inputRef as any}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={cn("min-h-[80px]", inputClassName)}
                    />
                ) : (
                    <Input
                        ref={inputRef as any}
                        type={type}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={inputClassName}
                    />
                )}
                <div className="flex flex-col gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                        onClick={() => {
                            setIsEditing(false)
                            setValue(initialValue || "")
                        }}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "group relative flex items-center gap-2 rounded-md border border-transparent px-2 py-1 -ml-2 hover:border-border hover:bg-muted/50 cursor-text transition-colors",
                className
            )}
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
        >
            <span className={cn("flex-1", !value && "text-muted-foreground italic")}>
                {value || `Click to add ${label || "value"}`}
            </span>
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </div>
    )
}
