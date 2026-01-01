"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Clock, UserX, Loader2 } from "lucide-react"
import { sendFriendRequest, removeFriend, acceptFriendRequest } from "@/app/actions/connections"
import { toast } from "sonner"

interface FriendRequestButtonProps {
    userId: string
    initialStatus: {
        isFriend: boolean
        isPending: boolean
        isRequested: boolean
    }
}

export function FriendRequestButton({ userId, initialStatus }: FriendRequestButtonProps) {
    const [status, setStatus] = useState(initialStatus)
    const [isPending, startTransition] = useTransition()

    const handleSendRequest = () => {
        startTransition(async () => {
            try {
                await sendFriendRequest(userId)
                setStatus({ ...status, isPending: true })
                toast.success("Friend request sent!")
            } catch (error: any) {
                toast.error(error.message || "Failed to send request")
            }
        })
    }

    const handleAcceptRequest = () => {
        startTransition(async () => {
            try {
                // Note: This requires the friendshipId, not userId
                // This button is typically used on profile pages where we might not have it
                toast.info("Please accept from your Connections page")
            } catch (error) {
                toast.error("Failed to accept request")
            }
        })
    }

    const handleRemoveFriend = () => {
        startTransition(async () => {
            try {
                await removeFriend(userId)
                setStatus({ isFriend: false, isPending: false, isRequested: false })
                toast.success("Friend removed")
            } catch (error) {
                toast.error("Failed to remove friend")
            }
        })
    }

    if (isPending) {
        return (
            <Button disabled variant="outline" size="sm">
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        )
    }

    if (status.isFriend) {
        return (
            <Button variant="outline" size="sm" onClick={handleRemoveFriend} className="gap-1.5">
                <UserCheck className="h-4 w-4" />
                Friends
            </Button>
        )
    }

    if (status.isPending) {
        return (
            <Button variant="outline" size="sm" disabled className="gap-1.5">
                <Clock className="h-4 w-4" />
                Pending
            </Button>
        )
    }

    if (status.isRequested) {
        return (
            <Button variant="default" size="sm" onClick={handleAcceptRequest} className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                Accept Request
            </Button>
        )
    }

    return (
        <Button variant="default" size="sm" onClick={handleSendRequest} className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Add Friend
        </Button>
    )
}
