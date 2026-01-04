import { formatDistanceToNow } from "date-fns"
import { Clock, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/server"

export async function RecentActivity() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch recent posts (activities)
    const { data: activities, error } = await supabase
        .from("posts")
        .select(`
            id,
            content,
            type,
            metadata,
            created_at,
            books (
                title,
                cover_image
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

    return (
        <Card className="col-span-1 md:col-span-1 lg:col-span-5">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-6">
                        {!activities || activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent activity
                            </p>
                        ) : (
                            activities.map((activity: any) => (
                                <div key={activity.id} className="flex gap-4">
                                    <div className="shrink-0 mt-1">
                                        {activity.type === "finished_book" && <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><BookOpen className="h-4 w-4" /></div>}
                                        {activity.type === "reading_session" && <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Clock className="h-4 w-4" /></div>}
                                        {activity.type === "review" && <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><ArrowRight className="h-4 w-4" /></div>}
                                        {activity.type === "text" && <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"><BookOpen className="h-4 w-4" /></div>}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <p className="text-sm font-medium leading-none">
                                            {activity.type === "finished_book" && "Finished a book"}
                                            {activity.type === "reading_session" && "Reading Updates"}
                                            {activity.type === "review" && "Wrote a review"}
                                            {!["finished_book", "reading_session", "review"].includes(activity.type) && "Posted"}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {activity.content}
                                        </p>
                                        <div className="flex items-center gap-2 pt-1">
                                            {activity.books?.title && (
                                                <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
                                                    {activity.books.title}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
