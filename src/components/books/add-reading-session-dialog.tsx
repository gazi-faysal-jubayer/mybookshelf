"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { addReadingSession } from "@/app/actions/reading-sessions"
import { toast } from "sonner"

const formSchema = z.object({
    session_date: z.date(),
    pages_read: z.string().min(1, "Required"),
    time_spent_minutes: z.string().optional(),
    notes: z.string().optional(),
    mood: z.string().optional(),
})

interface AddReadingSessionDialogProps {
    bookId: string
    currentPagesRead?: number
    maxPages?: number
}

export function AddReadingSessionDialog({ bookId, currentPagesRead = 0, maxPages }: AddReadingSessionDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            session_date: new Date(),
            pages_read: "",
            time_spent_minutes: "",
            notes: "",
            mood: "relaxed",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await addReadingSession(bookId, {
                ...values,
                pages_read: parseInt(values.pages_read) || 0,
                time_spent_minutes: values.time_spent_minutes ? parseInt(values.time_spent_minutes) : 0,
            })
            toast.success("Reading session added!")
            setOpen(false)
            form.reset()
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to add reading session")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Session
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log Reading Session</DialogTitle>
                    <DialogDescription>
                        Track your progress and thoughts for this session.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="session_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="pages_read"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pages Read</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="time_spent_minutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minutes</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="mood"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mood</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a mood" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="relaxed">😌 Relaxed</SelectItem>
                                            <SelectItem value="focused">🎯 Focused</SelectItem>
                                            <SelectItem value="rushed">⚡ Rushed</SelectItem>
                                            <SelectItem value="tired">😴 Tired</SelectItem>
                                            <SelectItem value="excited">🤩 Excited</SelectItem>
                                            <SelectItem value="emotional">🥺 Emotional</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any thoughts or memorable quotes?"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Save Session</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
