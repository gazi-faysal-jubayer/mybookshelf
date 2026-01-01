"use client"

import { useState, useEffect } from "react"
import { Bell, Check } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
// import { formatDistanceToNow } from "date-fns" // Optional: for relative time

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const fetchNotifications = async () => {
        const data = await getNotifications()
        setNotifications(data)
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every minute (optional, or use sockets/polling)
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
                            {unreadCount}
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
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 p-1">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification._id}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                        !notification.is_read && "bg-muted/50 font-medium"
                                    )}
                                // onClick={() => window.location.href = notification.link || "#"} // Simple navigation, better to use Link if possible but Dropdownitem handles clicks differently
                                >
                                    <div className="flex w-full justify-between gap-2">
                                        <span className="text-sm leading-none">{notification.message}</span>
                                        {!notification.is_read && (
                                            <div
                                                role="button"
                                                onClick={(e) => handleMarkAsRead(notification._id, e)}
                                                className="shrink-0 text-muted-foreground hover:text-primary"
                                                title="Mark as read"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {/* {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })} */}
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
