"use client"

import { useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, Loader2 } from "lucide-react"
import { acceptFriendRequest, declineFriendRequest } from "@/app/actions/connections"
import { toast } from "sonner"
import Link from "next/link"

interface PendingRequest {
    id: string
    created_at: string
    requester: {
        id: string
        full_name?: string
        username: string
        profile_picture?: string
    }
}

interface PendingRequestsProps {
    requests: PendingRequest[]
}

export function PendingRequests({ requests }: PendingRequestsProps) {
    if (requests.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No pending friend requests
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
                <PendingRequestCard key={request.id} request={request} />
            ))}
        </div>
    )
}

function PendingRequestCard({ request }: { request: PendingRequest }) {
    const [isPending, startTransition] = useTransition()

    const handleAccept = () => {
        startTransition(async () => {
            try {
                await acceptFriendRequest(request.id)
                toast.success("Friend request accepted!")
            } catch (error) {
                toast.error("Failed to accept request")
            }
        })
    }

    const handleDecline = () => {
        startTransition(async () => {
            try {
                await declineFriendRequest(request.id)
                toast.success("Friend request declined")
            } catch (error) {
                toast.error("Failed to decline request")
            }
        })
    }

    const user = request.requester
    const initials = user.full_name
        ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
        : user.username.slice(0, 2).toUpperCase()

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <Link href={`/dashboard/users/${user.id}`}>
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profile_picture} alt={user.full_name || user.username} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link href={`/dashboard/users/${user.id}`} className="hover:underline">
                            <h4 className="font-medium truncate text-sm">
                                {user.full_name || user.username}
                            </h4>
                        </Link>
                        <p className="text-xs text-muted-foreground">
                            Wants to be your friend
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={handleAccept}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Accept
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={handleDecline}
                        disabled={isPending}
                    >
                        <X className="h-4 w-4" />
                        Decline
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
