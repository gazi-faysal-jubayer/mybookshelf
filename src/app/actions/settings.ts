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
