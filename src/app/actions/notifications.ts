"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Transform to match old format with _id
        return notifications.map(n => ({
            ...n,
            _id: n.id
        }))
    } catch (error) {
        console.error("Failed to fetch notifications:", error)
        return []
    }
}

export async function markAsRead(id: string) {
    try {
        const user = await getUser()
        if (!user) return

        const supabase = await createClient()

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
        }

        revalidatePath("/dashboard")
    } catch (error) {
        console.error("Failed to mark notification as read:", error)
    }
}

export async function markAllAsRead() {
    try {
        const user = await getUser()
        if (!user) return

        const supabase = await createClient()

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        if (error) {
            console.error("Supabase error:", error)
        }

        revalidatePath("/dashboard")
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error)
    }
}

// Internal helper to create notification from other server actions
export async function createNotification(
    userId: string,
    type: string,
    message: string,
    link?: string,
    options?: {
        relatedUserId?: string
        relatedPostId?: string
        relatedFriendshipId?: string
        category?: string
    }
) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type: type as any,
                message,
                link,
                related_user_id: options?.relatedUserId,
                related_post_id: options?.relatedPostId,
                related_friendship_id: options?.relatedFriendshipId,
                notification_category: options?.category || 'general'
            })

        if (error) {
            console.error("Supabase error:", error)
        }
    } catch (error) {
        console.error("Failed to create notification:", error)
    }
}
