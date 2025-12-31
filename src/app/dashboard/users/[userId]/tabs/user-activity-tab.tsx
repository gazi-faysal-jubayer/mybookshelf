"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "@/lib/utils"
import { 
    BookOpen, 
    BookCheck, 
    Star, 
    Users, 
    Trophy,
    Library
} from "lucide-react"

interface UserActivityTabProps {
    userId: string
}

interface Activity {
    id: string
    activity_type: string
    created_at: string
    metadata?: any
    book?: {
        id: string
        title: string
        author: string
        cover_image?: string
    }
    related_user?: {
        id: string
        username?: string
        full_name?: string
        profile_picture?: string
    }
}

const ACTIVITY_ICONS: Record<string, typeof BookOpen> = {
    book_added: BookOpen,
    book_finished: BookCheck,
    book_started: BookOpen,
    review_written: Star,
    friend_added: Users,
    badge_earned: Trophy,
    collection_created: Library
}

const ACTIVITY_MESSAGES: Record<string, (activity: Activity) => string> = {
    book_added: (a) => `added "${a.book?.title}" to their library`,
    book_finished: (a) => `finished reading "${a.book?.title}"`,
    book_started: (a) => `started reading "${a.book?.title}"`,
    review_written: (a) => `wrote a review for "${a.book?.title}"`,
    friend_added: (a) => `became friends with ${a.related_user?.full_name || a.related_user?.username}`,
    badge_earned: (a) => `earned a new badge`,
    collection_created: () => `created a new collection`
}

export function UserActivityTab({ userId }: UserActivityTabProps) {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchActivities() {
            setLoading(true)
            const supabase = createClient()

            const { data } = await supabase
                .from('activities')
                .select(`
                    id,
                    activity_type,
                    created_at,
                    metadata,
                    book:book_id (id, title, author, cover_image),
                    related_user:related_user_id (id, username, full_name, profile_picture)
                `)
                .eq('user_id', userId)
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(20)

            setActivities((data as Activity[]) || [])
            setLoading(false)
        }

        fetchActivities()
    }, [userId])

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-full max-w-md" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No recent activity to show.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.activity_type] || BookOpen
                const getMessage = ACTIVITY_MESSAGES[activity.activity_type]
                const message = getMessage ? getMessage(activity) : activity.activity_type

                return (
                    <Card key={activity.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                        {message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(activity.created_at))}
                                    </p>
                                </div>

                                {/* Book Cover */}
                                {activity.book?.cover_image && (
                                    <Link 
                                        href={`/dashboard/books/${activity.book.id}`}
                                        className="flex-shrink-0"
                                    >
                                        <div className="relative h-16 w-12 rounded overflow-hidden bg-muted">
                                            <Image
                                                src={activity.book.cover_image}
                                                alt={activity.book.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
