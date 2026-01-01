"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { followUser, unfollowUser } from "@/app/actions/connections"
import { toast } from "sonner"

interface FollowButtonProps {
    userId: string
    initialIsFollowing: boolean
    size?: "default" | "sm" | "lg" | "icon"
}

export function FollowButton({ userId, initialIsFollowing, size = "sm" }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [isPending, startTransition] = useTransition()

    const handleToggleFollow = () => {
        startTransition(async () => {
            try {
                if (isFollowing) {
                    await unfollowUser(userId)
                    setIsFollowing(false)
                    toast.success("Unfollowed")
                } else {
                    await followUser(userId)
                    setIsFollowing(true)
                    toast.success("Following!")
                }
            } catch (error) {
                toast.error("Failed to update follow status")
            }
        })
    }

    if (isPending) {
        return (
            <Button disabled variant="outline" size={size}>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        )
    }

    if (isFollowing) {
        return (
            <Button variant="outline" size={size} onClick={handleToggleFollow} className="gap-1.5">
                <UserMinus className="h-4 w-4" />
                Unfollow
            </Button>
        )
    }

    return (
        <Button variant="secondary" size={size} onClick={handleToggleFollow} className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Follow
        </Button>
    )
}
