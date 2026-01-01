"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTransition } from "react"
import { toast } from "sonner"
import { updateReadingPreferences } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useState } from "react"

const preferencesSchema = z.object({
    yearly_goal: z.number().min(1).max(365),
    favorite_authors: z.array(z.string()),
    reading_interests: z.array(z.string()),
})

interface ReadingPreferencesProps {
    defaultValues: {
        yearly_goal?: number
        favorite_authors?: string[]
        reading_interests?: string[]
    }
}

export function ReadingPreferences({ defaultValues }: ReadingPreferencesProps) {
    const [isPending, startTransition] = useTransition()
    const [authorInput, setAuthorInput] = useState("")
    const [interestInput, setInterestInput] = useState("")

    const form = useForm<z.infer<typeof preferencesSchema>>({
        resolver: zodResolver(preferencesSchema),
        defaultValues: {
            yearly_goal: defaultValues.yearly_goal || 12,
            favorite_authors: defaultValues.favorite_authors || [],
            reading_interests: defaultValues.reading_interests || [],
        },
    })

    const authors = form.watch("favorite_authors")
    const interests = form.watch("reading_interests")

    function addAuthor() {
        const trimmed = authorInput.trim()
        if (trimmed && !authors.includes(trimmed)) {
            form.setValue("favorite_authors", [...authors, trimmed])
            setAuthorInput("")
        }
    }

    function removeAuthor(author: string) {
        form.setValue("favorite_authors", authors.filter(a => a !== author))
    }

    function addInterest() {
        const trimmed = interestInput.trim()
        if (trimmed && !interests.includes(trimmed)) {
            form.setValue("reading_interests", [...interests, trimmed])
            setInterestInput("")
        }
    }

    function removeInterest(interest: string) {
        form.setValue("reading_interests", interests.filter(i => i !== interest))
    }

    function onSubmit(data: z.infer<typeof preferencesSchema>) {
        startTransition(async () => {
            try {
                await updateReadingPreferences(data)
                toast.success("Reading preferences updated")
            } catch (error) {
                toast.error("Failed to update preferences")
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Reading Goal</CardTitle>
                        <CardDescription>
                            Set your yearly reading target.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="yearly_goal"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Books per Year</FormLabel>
                                        <span className="text-2xl font-bold">{field.value}</span>
                                    </div>
                                    <FormControl>
                                        <Slider
                                            value={[field.value]}
                                            min={1}
                                            max={100}
                                            step={1}
                                            onValueChange={(vals) => field.onChange(vals[0])}
                                            className="mt-4"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Challenge yourself to read {field.value} books this year.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Favorite Authors</CardTitle>
                        <CardDescription>
                            Authors whose work you enjoy. This helps with recommendations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add an author..."
                                value={authorInput}
                                onChange={(e) => setAuthorInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        addAuthor()
                                    }
                                }}
                            />
                            <Button type="button" variant="secondary" onClick={addAuthor}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {authors.map((author) => (
                                <Badge key={author} variant="secondary" className="gap-1 pr-1">
                                    {author}
                                    <button
                                        type="button"
                                        onClick={() => removeAuthor(author)}
                                        className="ml-1 rounded-full hover:bg-muted-foreground/20"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            {authors.length === 0 && (
                                <span className="text-sm text-muted-foreground">
                                    No favorite authors added yet
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Reading Interests</CardTitle>
                        <CardDescription>
                            Topics and genres you're interested in.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add an interest..."
                                value={interestInput}
                                onChange={(e) => setInterestInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        addInterest()
                                    }
                                }}
                            />
                            <Button type="button" variant="secondary" onClick={addInterest}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {interests.map((interest) => (
                                <Badge key={interest} variant="secondary" className="gap-1 pr-1">
                                    {interest}
                                    <button
                                        type="button"
                                        onClick={() => removeInterest(interest)}
                                        className="ml-1 rounded-full hover:bg-muted-foreground/20"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            {interests.length === 0 && (
                                <span className="text-sm text-muted-foreground">
                                    No interests added yet
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Save Preferences"}
                </Button>
            </form>
        </Form>
    )
}
