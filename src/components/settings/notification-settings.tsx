"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTransition } from "react"
import { toast } from "sonner"
import { updateNotificationSettings } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const notificationSchema = z.object({
    email_notifications: z.boolean(),
})

interface NotificationSettingsProps {
    defaultValues: {
        email_notifications?: boolean
    }
}

export function NotificationSettings({ defaultValues }: NotificationSettingsProps) {
    const [isPending, startTransition] = useTransition()
    const form = useForm<z.infer<typeof notificationSchema>>({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            email_notifications: defaultValues.email_notifications ?? true,
        },
    })

    function onSubmit(data: z.infer<typeof notificationSchema>) {
        startTransition(async () => {
            try {
                await updateNotificationSettings(data)
                toast.success("Notification settings updated")
            } catch (error) {
                toast.error("Failed to update notification settings")
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Email Notifications</CardTitle>
                        <CardDescription>
                            Manage how you receive notifications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email_notifications"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Email Notifications</FormLabel>
                                        <FormDescription>
                                            Receive email updates about activity on your account.
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
                    {isPending ? "Saving..." : "Save Notification Settings"}
                </Button>
            </form>
        </Form>
    )
}
