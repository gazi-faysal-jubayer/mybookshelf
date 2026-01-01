"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"

// =====================================================
// FRIEND SYSTEM
// =====================================================

export async function sendFriendRequest(addresseeId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Check if request already exists
    const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
        .single()

    if (existing) {
        if (existing.status === 'accepted') throw new Error("Already friends")
        if (existing.status === 'pending') throw new Error("Request already pending")
        if (existing.status === 'blocked') throw new Error("Cannot send request")
    }

    const { error } = await supabase
        .from('friendships')
        .insert({
            requester_id: user.id,
            addressee_id: addresseeId,
            status: 'pending'
        })

    if (error) throw new Error("Failed to send friend request")

    // Create notification for addressee
    // Create notification for addressee
    await createNotification(
        addresseeId,
        'info',
        'You have a new friend request!',
        '/dashboard/connections?tab=requests',
        {
            relatedUserId: user.id,
            relatedFriendshipId: undefined, // Friendship ID not returned by insert, but we can query it or just rely on user ID
            category: 'friend_request'
        }
    )

    revalidatePath('/dashboard/connections')
    return { success: true }
}

export async function respondToFriendRequest(requestId: string, accept: boolean) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { data: request } = await supabase
        .from('friendships')
        .select('*')
        .eq('id', requestId)
        .eq('addressee_id', user.id)
        .single()

    if (!request) throw new Error("Request not found")

    const { error } = await supabase
        .from('friendships')
        .update({
            status: accept ? 'accepted' : 'declined',
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (error) throw new Error("Failed to respond to request")

    if (accept) {
        // Notify requester
        await createNotification(
            request.requester_id,
            'success',
            'Your friend request was accepted!',
            `/dashboard/users/${user.id}`,
            {
                relatedUserId: user.id,
                relatedFriendshipId: requestId,
                category: 'friend_accepted'
            }
        )

        // Create activity
        await supabase.from('activities').insert({
            user_id: user.id,
            activity_type: 'friend_added',
            related_user_id: request.requester_id
        })
    }

    revalidatePath('/dashboard/connections')
    return { success: true }
}

export async function removeFriend(friendshipId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

    if (error) throw new Error("Failed to remove friend")

    revalidatePath('/dashboard/connections')
    return { success: true }
}

export async function getFriends(userId?: string) {
    const user = await getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) return { friends: [] }

    const supabase = await createClient()

    const { data: friendships } = await supabase
        .from('friendships')
        .select(`
            id,
            status,
            requester:requester_id (id, username, full_name, profile_picture, city, country),
            addressee:addressee_id (id, username, full_name, profile_picture, city, country)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)

    if (!friendships) return { friends: [] }

    // Map to get friend (the other person)
    const friends = friendships.map(f => {
        const friend = (f.requester as any).id === targetUserId ? f.addressee : f.requester
        return { ...friend, friendshipId: f.id }
    })

    return { friends }
}

export async function getPendingFriendRequests() {
    const user = await getUser()
    if (!user) return { incoming: [], outgoing: [] }

    const supabase = await createClient()

    const { data: incoming } = await supabase
        .from('friendships')
        .select(`
            id,
            created_at,
            requester:requester_id (id, username, full_name, profile_picture)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

    const { data: outgoing } = await supabase
        .from('friendships')
        .select(`
            id,
            created_at,
            addressee:addressee_id (id, username, full_name, profile_picture)
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending')

    return { incoming: incoming || [], outgoing: outgoing || [] }
}

// =====================================================
// FOLLOW SYSTEM
// =====================================================

export async function followUser(userId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('follows')
        .insert({
            follower_id: user.id,
            following_id: userId
        })

    if (error) {
        if (error.code === '23505') throw new Error("Already following")
        throw new Error("Failed to follow user")
    }

    // Notify user
    // Notify user
    await createNotification(
        userId,
        'info',
        'You have a new follower!',
        `/dashboard/users/${user.id}`,
        {
            relatedUserId: user.id,
            category: 'new_follower'
        }
    )

    revalidatePath('/dashboard/profile')
    return { success: true }
}

export async function unfollowUser(userId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId)

    if (error) throw new Error("Failed to unfollow user")

    revalidatePath('/dashboard/profile')
    return { success: true }
}

export async function getFollowers(userId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('follows')
        .select(`
            id,
            created_at,
            follower:follower_id (id, username, full_name, profile_picture)
        `)
        .eq('following_id', userId)

    const followers = data?.map(f => f.follower) || []
    return { followers }
}

export async function getFollowing(userId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('follows')
        .select(`
            id,
            created_at,
            following:following_id (id, username, full_name, profile_picture)
        `)
        .eq('follower_id', userId)

    const following = data?.map(f => f.following) || []
    return { following }
}

// =====================================================
// BLOCK SYSTEM
// =====================================================

export async function blockUser(userId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Remove any existing friendship
    await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)

    // Remove follows
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId)
    await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', user.id)

    // Add to blocked
    const { error } = await supabase
        .from('blocked_users')
        .insert({
            blocker_id: user.id,
            blocked_id: userId
        })

    if (error && error.code !== '23505') throw new Error("Failed to block user")

    revalidatePath('/dashboard')
    return { success: true }
}

export async function unblockUser(userId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)

    if (error) throw new Error("Failed to unblock user")

    revalidatePath('/dashboard')
    return { success: true }
}

// =====================================================
// USER DISCOVERY
// =====================================================

export async function searchUsers(query: string, filters?: {
    nearby?: boolean
    hasBook?: string
    maxDistance?: number
}) {
    const user = await getUser()
    const supabase = await createClient()

    let queryBuilder = supabase
        .from('profiles')
        .select('id, username, full_name, profile_picture, bio, city, country, latitude, longitude, reputation_score, total_books_lent, lending_reputation')
        .eq('profile_visibility', 'public')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20)

    if (user) {
        queryBuilder = queryBuilder.neq('id', user.id)
    }

    const { data: users, error } = await queryBuilder

    if (error) return []

    // If filters.hasBook is set, filter users who own that book
    if (filters?.hasBook && users) {
        const { data: bookOwners } = await supabase
            .from('books')
            .select('user_id')
            .or(`title.ilike.%${filters.hasBook}%,isbn.eq.${filters.hasBook}`)
            .eq('is_available_for_lending', true)

        const ownerIds = new Set(bookOwners?.map(b => b.user_id) || [])
        return users.filter(u => ownerIds.has(u.id))
    }

    return users || []
}

export async function getUserProfile(userId: string) {
    const currentUser = await getUser()
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (!profile) return null

    // Check if viewing own profile
    const isOwnProfile = currentUser?.id === userId

    // Check privacy
    if (!isOwnProfile && profile.profile_visibility === 'private') {
        return { id: profile.id, username: profile.username, profile_picture: profile.profile_picture, isPrivate: true }
    }

    // Check if friends (for friends-only profiles)
    let isFriend = false
    if (currentUser && !isOwnProfile) {
        const { data: friendship } = await supabase
            .from('friendships')
            .select('id')
            .eq('status', 'accepted')
            .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`)
            .single()
        isFriend = !!friendship
    }

    if (!isOwnProfile && profile.profile_visibility === 'friends' && !isFriend) {
        return { id: profile.id, username: profile.username, profile_picture: profile.profile_picture, isFriendsOnly: true }
    }

    // Get additional stats
    const [
        { count: followersCount },
        { count: followingCount },
        { data: badges },
        { data: recentBooks }
    ] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('user_badges').select('badge:badge_id(*)').eq('user_id', userId),
        supabase.from('books').select('id, title, author, cover_image, reading_status').eq('user_id', userId).order('updated_at', { ascending: false }).limit(6)
    ])

    // Check relationship with current user
    let isFollowing = false
    let friendshipStatus = null
    if (currentUser && !isOwnProfile) {
        const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .single()
        isFollowing = !!follow

        const { data: friendship } = await supabase
            .from('friendships')
            .select('id, status, requester_id')
            .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`)
            .single()
        if (friendship) {
            friendshipStatus = {
                id: friendship.id,
                status: friendship.status,
                isRequester: friendship.requester_id === currentUser.id
            }
        }
    }

    return {
        ...profile,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        badges: badges?.map(b => b.badge) || [],
        recentBooks: recentBooks || [],
        isOwnProfile,
        isFollowing,
        isFriend,
        friendshipStatus
    }
}

// =====================================================
// ACTIVITY FEED
// =====================================================

export async function getActivityFeed(type: 'personal' | 'friends' | 'community' = 'community', page = 1) {
    const user = await getUser()
    const supabase = await createClient()
    const limit = 20
    const offset = (page - 1) * limit

    let query = supabase
        .from('activities')
        .select(`
            id,
            activity_type,
            created_at,
            metadata,
            user:user_id (id, username, full_name, profile_picture),
            book:book_id (id, title, author, cover_image),
            collection:collection_id (id, name),
            badge:badge_id (id, name, icon),
            related_user:related_user_id (id, username, full_name, profile_picture),
            likes:activity_likes(count),
            comments:activity_comments(count)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (type === 'personal' && user) {
        query = query.eq('user_id', user.id)
    } else if (type === 'friends' && user) {
        // Get friend IDs
        const { friends } = await getFriends()
        const friendIds = friends.map((f: any) => f.id)
        if (friendIds.length === 0) return []
        query = query.in('user_id', friendIds).eq('is_public', true)
    } else {
        query = query.eq('is_public', true)
    }

    const { data } = await query
    return data || []
}

export async function likeActivity(activityId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('activity_likes')
        .insert({ activity_id: activityId, user_id: user.id })

    if (error && error.code !== '23505') throw new Error("Failed to like")
    return { success: true }
}

export async function unlikeActivity(activityId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    await supabase
        .from('activity_likes')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', user.id)

    return { success: true }
}

export async function commentOnActivity(activityId: string, content: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('activity_comments')
        .insert({
            activity_id: activityId,
            user_id: user.id,
            content
        })

    if (error) throw new Error("Failed to comment")

    revalidatePath('/dashboard')
    return { success: true }
}
