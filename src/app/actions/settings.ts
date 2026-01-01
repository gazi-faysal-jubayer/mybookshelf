"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: any) {
    try {
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: data.full_name,
                profile_picture: data.profile_picture,
                bio: data.bio,
                location: data.location,
                favorite_genre: data.favorite_genre,
            })
            .eq('id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to update profile")
        }

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to update profile:", error)
        throw new Error("Failed to update profile")
    }
}

export async function updatePrivacySettings(data: {
    profile_visibility: string
    show_reading_activity: boolean
    show_lending_history: boolean
    show_collections: boolean
    allow_messages_from: string
}) {
    try {
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('profiles')
            .update({
                profile_visibility: data.profile_visibility,
                show_reading_activity: data.show_reading_activity,
                show_lending_history: data.show_lending_history,
                show_collections: data.show_collections,
                allow_messages_from: data.allow_messages_from,
            })
            .eq('id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to update privacy settings")
        }

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to update privacy settings:", error)
        throw new Error("Failed to update privacy settings")
    }
}

export async function updateReadingPreferences(data: {
    yearly_goal: number
    favorite_authors: string[]
    reading_interests: string[]
}) {
    try {
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('profiles')
            .update({
                yearly_goal: data.yearly_goal,
                favorite_authors: data.favorite_authors,
                reading_interests: data.reading_interests,
            })
            .eq('id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to update reading preferences")
        }

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to update reading preferences:", error)
        throw new Error("Failed to update reading preferences")
    }
}

export async function updateNotificationSettings(data: {
    email_notifications: boolean
}) {
    try {
        const user = await getUser()
        if (!user) {
            throw new Error("Unauthorized")
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('profiles')
            .update({
                email_notifications: data.email_notifications,
            })
            .eq('id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to update notification settings")
        }

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to update notification settings:", error)
        throw new Error("Failed to update notification settings")
    }
}

export async function getProfile() {
    try {
        const user = await getUser()
        if (!user) {
            return null
        }

        const supabase = await createClient()

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error("Supabase error:", error)
            return null
        }

        return profile
    } catch (error) {
        console.error("Failed to get profile:", error)
        return null
    }
}
