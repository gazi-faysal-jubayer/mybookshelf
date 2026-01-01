import { getUser } from "@/lib/supabase/server"
import { getBookmarkedPosts } from "@/app/actions/posts"
import { BookmarksClient } from "./bookmarks-client"
import { redirect } from "next/navigation"
import { Bookmark } from "lucide-react"

export default async function BookmarksPage() {
    const user = await getUser()
    if (!user) redirect("/login")

    const { posts, nextCursor } = await getBookmarkedPosts()

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <Bookmark className="h-6 w-6" />
                    <h2 className="text-2xl font-bold tracking-tight">Bookmarks</h2>
                </div>
                <p className="text-muted-foreground">
                    Posts you've saved for later.
                </p>
            </div>
            <BookmarksClient
                initialPosts={posts}
                initialCursor={nextCursor}
                currentUserId={user.id}
            />
        </div>
    )
}
