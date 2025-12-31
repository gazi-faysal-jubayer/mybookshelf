import { formatDistanceToNow } from "date-fns"
import { Clock, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import connectDB from "@/lib/db"
import Lending from "@/models/Lending"
import { auth } from "@/auth"

export async function RecentActivity() {
    await connectDB()
    const session = await auth()

    if (!session?.user?.id) return null

    // Fetch recent lending activities
    const activities = await Lending.find({ user_id: session.user.id })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("book_id", "title")
        .lean()

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-8">
                        {activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent activity
                            </p>
                        ) : (
                            activities.map((activity: any) => (
                                <div key={activity._id.toString()} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {activity.status === "active" ? "Lent" : "Returned"}
                                            <span className="text-muted-foreground mx-1">
                                                "{activity.book_id?.title || "Unknown Book"}"
                                            </span>
                                            {activity.status === "active" ? `to ${activity.borrower_name}` : `from ${activity.borrower_name}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true })}
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
