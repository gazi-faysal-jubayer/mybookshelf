import { getUser } from "@/lib/supabase/server"
import { getFeed } from "@/app/actions/posts"
import { FeedClient } from "@/components/feed/feed-client"
import { redirect } from "next/navigation"

export default async function FeedPage() {
    const user = await getUser()
    if (!user) redirect("/login")

    // Initial load with global feed
    const { posts, nextCursor } = await getFeed('global')

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Feed</h2>
                <p className="text-muted-foreground">
                    See what others are reading and share your thoughts.
                </p>
            </div>
            <FeedClient
                initialPosts={posts}
                initialCursor={nextCursor}
                currentUserId={user.id}
                initialMode="global"
            />
        </div>
    )
}
