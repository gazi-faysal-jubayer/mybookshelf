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

    // Fetch recent lending activities with book details
    const { data: activities, error } = await supabase
        .from("lendings")
        .select(`
            id,
            status,
            borrower_name,
            updated_at,
            books (
                title
            )
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5)

    return (
        <Card className="col-span-1 md:col-span-1 lg:col-span-5">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-8">
                        {!activities || activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent activity
                            </p>
                        ) : (
                            activities.map((activity: any) => (
                                <div key={activity.id} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {activity.status === "active" ? "Lent" : "Returned"}
                                            <span className="text-muted-foreground mx-1">
                                                "{activity.books?.title || "Unknown Book"}"
                                            </span>
                                            {activity.status === "active" ? `to ${activity.borrower_name}` : `from ${activity.borrower_name}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.updated_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        {activity.status === "active" ? (
                                            <ArrowRight className="ml-auto h-4 w-4 text-amber-500" />
                                        ) : (
                                            <Clock className="ml-auto h-4 w-4 text-green-500" />
                                        )}
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
