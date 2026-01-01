"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTransition } from "react"
import { toast } from "sonner"
import { updatePrivacySettings } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const privacySchema = z.object({
    profile_visibility: z.enum(["public", "friends", "private"]),
    show_reading_activity: z.boolean(),
    show_lending_history: z.boolean(),
    show_collections: z.boolean(),
    allow_messages_from: z.enum(["everyone", "friends", "nobody"]),
})

interface PrivacySettingsProps {
    defaultValues: {
        profile_visibility?: string
        show_reading_activity?: boolean
        show_lending_history?: boolean
        show_collections?: boolean
        allow_messages_from?: string
    }
}

export function PrivacySettings({ defaultValues }: PrivacySettingsProps) {
    const [isPending, startTransition] = useTransition()
    const form = useForm<z.infer<typeof privacySchema>>({
        resolver: zodResolver(privacySchema),
        defaultValues: {
            profile_visibility: (defaultValues.profile_visibility as "public" | "friends" | "private") || "public",
            show_reading_activity: defaultValues.show_reading_activity ?? true,
            show_lending_history: defaultValues.show_lending_history ?? true,
            show_collections: defaultValues.show_collections ?? true,
            allow_messages_from: (defaultValues.allow_messages_from as "everyone" | "friends" | "nobody") || "everyone",
        },
    })

    function onSubmit(data: z.infer<typeof privacySchema>) {
        startTransition(async () => {
            try {
                await updatePrivacySettings(data)
                toast.success("Privacy settings updated")
            } catch (error) {
                toast.error("Failed to update privacy settings")
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Visibility</CardTitle>
                        <CardDescription>
                            Control who can see your profile and activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="profile_visibility"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Who can see your profile?</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="public">Everyone</SelectItem>
                                            <SelectItem value="friends">Friends Only</SelectItem>
                                            <SelectItem value="private">Private</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        This controls who can view your profile page.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="allow_messages_from"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Who can message you?</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select who can message" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="everyone">Everyone</SelectItem>
                                            <SelectItem value="friends">Friends Only</SelectItem>
                                            <SelectItem value="nobody">Nobody</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Activity Sharing</CardTitle>
                        <CardDescription>
                            Choose what activity is visible to others.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="show_reading_activity"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Reading Activity</FormLabel>
                                        <FormDescription>
                                            Show when you start or finish books.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="show_lending_history"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Lending History</FormLabel>
                                        <FormDescription>
                                            Show your book lending activity.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="show_collections"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Collections</FormLabel>
                                        <FormDescription>
                                            Make your book collections visible to others.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Save Privacy Settings"}
                </Button>
            </form>
        </Form>
    )
}
