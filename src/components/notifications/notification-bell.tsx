"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Bell,
    Heart,
    MessageCircle,
    Share2,
    UserPlus,
    UserCheck,
    Users,
    Check,
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications"
import { acceptFriendRequest, declineFriendRequest } from "@/app/actions/connections"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatDistanceToNow } from "@/lib/utils"
import { toast } from "sonner"

interface Notification {
    _id: string
    id: string
    message: string
    is_read: boolean
    link?: string
    created_at: string
    createdAt?: string
    notification_category?: string
    related_user_id?: string
    related_post_id?: string
    related_friendship_id?: string
    related_user?: {
        id: string
        username: string
        full_name: string | null
        profile_picture: string | null
    }
}

function getNotificationIcon(category?: string) {
    switch (category) {
        case 'friend_request':
            return <UserPlus className="h-4 w-4 text-blue-500" />
        case 'friend_accepted':
            return <UserCheck className="h-4 w-4 text-green-500" />
        case 'new_follower':
            return <Users className="h-4 w-4 text-purple-500" />
        case 'post_like':
            return <Heart className="h-4 w-4 text-red-500" />
        case 'post_comment':
            return <MessageCircle className="h-4 w-4 text-orange-500" />
        case 'post_share':
            return <Share2 className="h-4 w-4 text-teal-500" />
        default:
            return <Bell className="h-4 w-4 text-muted-foreground" />
    }
}

export function NotificationBell() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const fetchNotifications = async () => {
        const data = await getNotifications()
        setNotifications(data)
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const unreadCount = notifications.filter(n => !n.is_read).length

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        await markAsRead(id)
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n))
    }

    const handleMarkAllRead = async () => {
        await markAllAsRead()
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }

    const handleAcceptFriendRequest = async (friendshipId: string, notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        startTransition(async () => {
            try {
                await acceptFriendRequest(friendshipId)
                await markAsRead(notificationId)
                setNotifications(prev => prev.filter(n => n._id !== notificationId))
                toast.success("Friend request accepted!")
                router.refresh()
            } catch (error: any) {
                toast.error(error.message || "Failed to accept request")
            }
        })
    }

    const handleDeclineFriendRequest = async (friendshipId: string, notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        startTransition(async () => {
            try {
                await declineFriendRequest(friendshipId)
                await markAsRead(notificationId)
                setNotifications(prev => prev.filter(n => n._id !== notificationId))
                toast.success("Friend request declined")
                router.refresh()
            } catch (error: any) {
                toast.error(error.message || "Failed to decline request")
            }
        })
    }

    const handleNotificationClick = (notification: Notification) => {
        if (notification.link) {
            router.push(notification.link)
            setIsOpen(false)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (open) fetchNotifications()
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-w-80">
                <div className="flex items-center justify-between p-2">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto text-xs px-2 py-1">
                            Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 p-1">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={cn(
                                        "flex flex-col gap-2 p-3 rounded-md cursor-pointer hover:bg-accent transition-colors",
                                        !notification.is_read && "bg-muted/50"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                            {getNotificationIcon(notification.notification_category)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={cn(
                                                "text-sm leading-snug",
                                                !notification.is_read && "font-medium"
                                            )}>
                                                {notification.related_user ? (
                                                    <span>
                                                        <Link
                                                            href={`/dashboard/users/${notification.related_user.id}`}
                                                            className="font-bold hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {notification.related_user.full_name || notification.related_user.username}
                                                        </Link>
                                                        {notification.notification_category === 'post_like' && " liked your post"}
                                                        {notification.notification_category === 'post_comment' && " commented on your post"}
                                                        {notification.notification_category === 'post_share' && " shared your post"}
                                                        {notification.notification_category === 'friend_request' && " sent you a friend request"}
                                                        {notification.notification_category === 'friend_accepted' && " accepted your friend request"}
                                                        {notification.notification_category === 'new_follower' && " started following you"}
                                                        {!['post_like', 'post_comment', 'post_share', 'friend_request', 'friend_accepted', 'new_follower'].includes(notification.notification_category || '') && ` ${notification.message.replace(/^.*? /, '')}`}
                                                    </span>
                                                ) : (
                                                    notification.message
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(notification.created_at || notification.createdAt || new Date()))}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div
                                                role="button"
                                                onClick={(e) => handleMarkAsRead(notification._id, e)}
                                                className="shrink-0 text-muted-foreground hover:text-primary p-1"
                                                title="Mark as read"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Friend request action buttons */}
                                    {notification.notification_category === 'friend_request' &&
                                        notification.related_friendship_id &&
                                        !notification.is_read && (
                                            <div className="flex gap-2 ml-7">
                                                <Button
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={(e) => handleAcceptFriendRequest(
                                                        notification.related_friendship_id!,
                                                        notification._id,
                                                        e
                                                    )}
                                                    disabled={isPending}
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs"
                                                    onClick={(e) => handleDeclineFriendRequest(
                                                        notification.related_friendship_id!,
                                                        notification._id,
                                                        e
                                                    )}
                                                    disabled={isPending}
                                                >
                                                    <X className="h-3 w-3 mr-1" />
                                                    Decline
                                                </Button>
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <div className="p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        asChild
                    >
                        <Link href="/dashboard/connections">
                            View all connections
                        </Link>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
