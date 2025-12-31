"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTransition } from "react"
import { toast } from "sonner"
import { updateProfile } from "@/app/actions/settings"
import { ImageUpload } from "@/components/upload/image-upload"
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
import { Textarea } from "@/components/ui/textarea"

const profileSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    profile_picture: z.string().optional(),
    bio: z.string().max(300, "Bio must be less than 300 characters").optional(),
    location: z.string().max(100).optional(),
    favorite_genre: z.string().max(50).optional(),
})

interface ProfileFormProps {
    defaultValues: {
        full_name?: string
        profile_picture?: string
        bio?: string
        location?: string
        favorite_genre?: string
    }
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition()
    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: defaultValues.full_name || "",
            profile_picture: defaultValues.profile_picture || "",
            bio: defaultValues.bio || "",
            location: defaultValues.location || "",
            favorite_genre: defaultValues.favorite_genre || "",
        },
    })

    function onSubmit(data: z.infer<typeof profileSchema>) {
        startTransition(async () => {
            try {
                await updateProfile(data)
                toast.success("Profile updated")
            } catch (error) {
                toast.error("Failed to update profile")
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="profile_picture"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Profile Picture</FormLabel>
                            <FormControl>
                                <div className="max-w-[200px]">
                                    <ImageUpload
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormDescription>
                                This is your public display name.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us a little bit about yourself"
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                You can include your reading interests here.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="City, Country" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="favorite_genre"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Favorite Genre</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Science Fiction" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Update Profile"}
                </Button>
            </form>
        </Form>
    )
}
