"use server"

import { auth } from "@/auth"
import connectDB from "@/lib/db"
import Notification from "@/models/Notification"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
    try {
        const session = await auth()
        if (!session?.user?.id) return []

        await connectDB()

        const notifications = await Notification.find({ user_id: session.user.id })
            .sort({ createdAt: -1 })
            .limit(20)
        // .lean() // Returns plain Objects, but we need to serialize properly for client

        // Serialize ObjectIds and Dates
        return JSON.parse(JSON.stringify(notifications))
    } catch (error) {
        console.error("Failed to fetch notifications:", error)
        return []
    }
}

export async function markAsRead(id: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return

        await connectDB()

        await Notification.findOneAndUpdate(
            { _id: id, user_id: session.user.id },
            { is_read: true }
        )

        revalidatePath("/dashboard")
    } catch (error) {
        console.error("Failed to mark notification as read:", error)
    }
}

export async function markAllAsRead() {
    try {
        const session = await auth()
        if (!session?.user?.id) return

        await connectDB()

        await Notification.updateMany(
            { user_id: session.user.id, is_read: false },
            { is_read: true }
        )

        revalidatePath("/dashboard")
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error)
    }
}

// Internal helper to create notification from other server actions
export async function createNotification(userId: string, type: string, message: string, link?: string) {
    try {
        await connectDB()
        await Notification.create({
            user_id: userId,
            type,
            message,
            link
        })
    } catch (error) {
        console.error("Failed to create notification:", error)
    }
}
