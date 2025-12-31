"use client"

import Image from "next/image"
import Link from "next/link"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { sendFriendRequest, followUser, unfollowUser } from "@/app/actions/social"
import { getOrCreateConversation } from "@/app/actions/messaging"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { 
    MapPin, 
    Calendar, 
    Star, 
    BookOpen, 
    Users, 
    MessageSquare,
    UserPlus,
    UserCheck,
    MoreHorizontal,
    Settings,
    Share2,
    CheckCircle
} from "lucide-react"
import { toast } from "sonner"

interface Profile {
    id: string
    username?: string
    full_name?: string
    bio?: string
    profile_picture?: string
    cover_photo?: string
    city?: string
    country?: string
    lending_reputation?: number
    borrowing_reputation?: number
    total_books_read?: number
    total_books_lent?: number
    total_books_borrowed?: number
    is_verified?: boolean
    created_at: string
    // Relations
    isFollowing?: boolean
    isFriend?: boolean
    friendshipStatus?: string
}

interface ProfileHeaderProps {
    profile: Profile
    isOwnProfile: boolean
    currentUserId: string
    friendsCount: number
    followersCount: number
    followingCount: number
}

export function ProfileHeader({
    profile,
    isOwnProfile,
    currentUserId,
    friendsCount,
    followersCount,
    followingCount
}: ProfileHeaderProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const displayName = profile.full_name || profile.username || "Anonymous"
    const location = [profile.city, profile.country].filter(Boolean).join(", ")
    const memberSince = new Date(profile.created_at).getFullYear()

    const handleFollow = () => {
        startTransition(async () => {
            try {
                if (profile.isFollowing) {
                    await unfollowUser(profile.id)
                    toast.success("Unfollowed user")
                } else {
                    await followUser(profile.id)
                    toast.success("Now following!")
                }
                router.refresh()
            } catch (error: any) {
                toast.error(error.message)
            }
        })
    }

    const handleAddFriend = () => {
        startTransition(async () => {
            try {
                await sendFriendRequest(profile.id)
                toast.success("Friend request sent!")
                router.refresh()
            } catch (error: any) {
                toast.error(error.message)
            }
        })
    }

    const handleMessage = () => {
        startTransition(async () => {
            try {
                const { conversationId } = await getOrCreateConversation(profile.id)
                router.push(`/dashboard/messages/${conversationId}`)
            } catch (error: any) {
                toast.error(error.message)
            }
        })
    }

    return (
        <div className="space-y-4">
            {/* Cover Photo */}
            <div className="relative h-32 md:h-48 bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg overflow-hidden">
                {profile.cover_photo && (
                    <Image
                        src={profile.cover_photo}
                        alt="Cover"
                        fill
                        className="object-cover"
                    />
                )}
            </div>

            {/* Profile Info */}
            <div className="px-4">
                <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-12">
                    {/* Avatar */}
                    <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background overflow-hidden bg-muted flex-shrink-0">
                        {profile.profile_picture ? (
                            <Image
                                src={profile.profile_picture}
                                alt={displayName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                                {displayName[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Name & Actions */}
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{displayName}</h1>
                                {profile.is_verified && (
                                    <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-500" />
                                )}
                            </div>
                            {profile.username && profile.full_name && (
                                <p className="text-muted-foreground">@{profile.username}</p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {isOwnProfile ? (
                                <Button variant="outline" asChild>
                                    <Link href="/dashboard/settings">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        variant={profile.isFollowing ? "secondary" : "default"}
                                        onClick={handleFollow}
                                        disabled={isPending}
                                    >
                                        {profile.isFollowing ? (
                                            <>
                                                <UserCheck className="h-4 w-4 mr-2" />
                                                Following
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Follow
                                            </>
                                        )}
                                    </Button>

                                    <Button 
                                        variant="outline"
                                        onClick={handleMessage}
                                        disabled={isPending}
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Message
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {!profile.isFriend && profile.friendshipStatus !== 'pending' && (
                                                <DropdownMenuItem onClick={handleAddFriend}>
                                                    <Users className="h-4 w-4 mr-2" />
                                                    Add Friend
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem>
                                                <Share2 className="h-4 w-4 mr-2" />
                                                Share Profile
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-muted-foreground mt-4 max-w-2xl">
                        {profile.bio}
                    </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                    {location && (
                        <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {location}
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Member since {memberSince}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mt-6">
                    <StatItem 
                        icon={<BookOpen className="h-4 w-4" />}
                        value={profile.total_books_read || 0}
                        label="Books Read"
                    />
                    <StatItem 
                        icon={<Star className="h-4 w-4" />}
                        value={profile.lending_reputation?.toFixed(1) || "5.0"}
                        label="Lender Rating"
                    />
                    <StatItem 
                        value={profile.total_books_lent || 0}
                        label="Books Lent"
                    />
                    <StatItem 
                        value={friendsCount}
                        label="Friends"
                    />
                    <StatItem 
                        value={followersCount}
                        label="Followers"
                    />
                    <StatItem 
                        value={followingCount}
                        label="Following"
                    />
                </div>

                {/* Badges */}
                {profile.is_verified && (
                    <div className="flex items-center gap-2 mt-4">
                        <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatItem({ 
    icon, 
    value, 
    label 
}: { 
    icon?: React.ReactNode
    value: number | string
    label: string 
}) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold">{value}</span>
            <span className="text-muted-foreground">{label}</span>
        </div>
    )
}
