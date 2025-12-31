"use server"

import { auth } from "@/auth"
import connectDB from "@/lib/db"
import User from "@/models/User"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: any) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            throw new Error("Unauthorized")
        }

        await connectDB()

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            {
                full_name: data.full_name,
                profile_picture: data.profile_picture,
                bio: data.bio,
                location: data.location,
                favorite_genre: data.favorite_genre,
            },
            { new: true }
        )

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to update profile:", error)
        throw new Error("Failed to update profile")
    }
}
