import { Suspense } from "react"
import { getUser } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getUserProfile, getFriends, getFollowers, getFollowing } from "@/app/actions/social"
import { ProfileHeader } from "./profile-header"
import { ProfileTabs } from "./profile-tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface UserProfilePageProps {
    params: Promise<{ userId: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
    const user = await getUser()
    if (!user) redirect("/login")

    const { userId } = await params

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Suspense fallback={<ProfileSkeleton />}>
                <ProfileContainer userId={userId} currentUserId={user.id} />
            </Suspense>
        </div>
    )
}

async function ProfileContainer({ 
    userId, 
    currentUserId 
}: { 
    userId: string
    currentUserId: string 
}) {
    const profile = await getUserProfile(userId)
    
    if (!profile) {
        notFound()
    }

    const isOwnProfile = userId === currentUserId
    
    // Get social stats
    const [friendsData, followersData, followingData] = await Promise.all([
        getFriends(userId),
        getFollowers(userId),
        getFollowing(userId)
    ])

    return (
        <>
            <ProfileHeader 
                profile={profile}
                isOwnProfile={isOwnProfile}
                currentUserId={currentUserId}
                friendsCount={friendsData.friends.length}
                followersCount={followersData.followers.length}
                followingCount={followingData.following.length}
            />
            <ProfileTabs 
                userId={userId}
                profile={profile}
                isOwnProfile={isOwnProfile}
                currentUserId={currentUserId}
            />
        </>
    )
}

function ProfileSkeleton() {
    return (
        <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-lg" />
                <div className="flex items-end gap-4 -mt-16 px-4">
                    <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
                    <div className="flex-1 space-y-2 pb-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="px-4 space-y-2">
                    <Skeleton className="h-4 w-full max-w-md" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    )
}
