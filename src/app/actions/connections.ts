"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"

export async function sendFriendRequest(userId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")
        if (user.id === userId) throw new Error("Cannot send friend request to yourself")

        const supabase = await createClient()

        // Get current user's profile for notification message
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', user.id)
            .single()

        const senderName = currentProfile?.full_name || currentProfile?.username || 'Someone'

        // Check if a friendship already exists
        const { data: existing } = await supabase
            .from('friendships')
            .select('id, status')
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
            .single()

        if (existing) {
            if (existing.status === 'accepted') throw new Error("Already friends")
            if (existing.status === 'pending') throw new Error("Friend request already pending")
            if (existing.status === 'blocked') throw new Error("Cannot send request")
        }

        const { data: friendship, error } = await supabase
            .from('friendships')
            .insert({
                requester_id: user.id,
                addressee_id: userId,
                status: 'pending',
            })
            .select('id')
            .single()

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to send friend request")
        }

        // Create notification for the recipient
        await createNotification(
            userId,
            'info',
            `${senderName} sent you a friend request`,
            `/dashboard/connections`,
            {
                relatedUserId: user.id,
                relatedFriendshipId: friendship?.id,
                category: 'friend_request'
            }
        )

        revalidatePath("/dashboard/connections")
        revalidatePath(`/dashboard/users/${userId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to send friend request:", error)
        throw error
    }
}

export async function acceptFriendRequest(friendshipId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Get current user's profile for notification message
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', user.id)
            .single()

        const accepterName = currentProfile?.full_name || currentProfile?.username || 'Someone'

        // Verify this request is addressed to the current user
        const { data: friendship } = await supabase
            .from('friendships')
            .select('*')
            .eq('id', friendshipId)
            .eq('addressee_id', user.id)
            .eq('status', 'pending')
            .single()

        if (!friendship) throw new Error("Friend request not found")

        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', friendshipId)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to accept friend request")
        }

        // Add mutual follows when becoming friends
        await Promise.all([
            supabase.from('follows').upsert({
                follower_id: user.id,
                following_id: friendship.requester_id
            }, { onConflict: 'follower_id,following_id' }),
            supabase.from('follows').upsert({
                follower_id: friendship.requester_id,
                following_id: user.id
            }, { onConflict: 'follower_id,following_id' })
        ])

        // Notify the requester that their request was accepted
        await createNotification(
            friendship.requester_id,
            'success',
            `${accepterName} accepted your friend request!`,
            `/dashboard/users/${user.id}`,
            {
                relatedUserId: user.id,
                relatedFriendshipId: friendshipId,
                category: 'friend_accepted'
            }
        )

        revalidatePath("/dashboard/connections")
        return { success: true }
    } catch (error) {
        console.error("Failed to accept friend request:", error)
        throw error
    }
}

export async function declineFriendRequest(friendshipId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('friendships')
            .update({ status: 'declined', updated_at: new Date().toISOString() })
            .eq('id', friendshipId)
            .eq('addressee_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to decline friend request")
        }

        revalidatePath("/dashboard/connections")
        return { success: true }
    } catch (error) {
        console.error("Failed to decline friend request:", error)
        throw error
    }
}

export async function removeFriend(userId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Delete the friendship record
        const { error } = await supabase
            .from('friendships')
            .delete()
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to remove friend")
        }

        revalidatePath("/dashboard/connections")
        revalidatePath(`/dashboard/users/${userId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to remove friend:", error)
        throw error
    }
}

export async function followUser(userId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")
        if (user.id === userId) throw new Error("Cannot follow yourself")

        const supabase = await createClient()

        // Get current user's profile for notification message
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', user.id)
            .single()

        const followerName = currentProfile?.full_name || currentProfile?.username || 'Someone'

        const { error } = await supabase
            .from('follows')
            .insert({
                follower_id: user.id,
                following_id: userId,
            })

        if (error) {
            if (error.code === '23505') {
                // Already following (unique constraint)
                return { success: true, alreadyFollowing: true }
            }
            console.error("Supabase error:", error)
            throw new Error("Failed to follow user")
        }

        // Notify the user they have a new follower
        await createNotification(
            userId,
            'info',
            `${followerName} started following you`,
            `/dashboard/users/${user.id}`,
            {
                relatedUserId: user.id,
                category: 'new_follower'
            }
        )

        revalidatePath("/dashboard/connections")
        revalidatePath(`/dashboard/users/${userId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to follow user:", error)
        throw error
    }
}

export async function unfollowUser(userId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', userId)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to unfollow user")
        }

        revalidatePath("/dashboard/connections")
        revalidatePath(`/dashboard/users/${userId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to unfollow user:", error)
        throw error
    }
}

export async function getPendingRequests() {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('friendships')
            .select(`
                id,
                created_at,
                requester:profiles!friendships_requester_id_fkey(
                    id,
                    full_name,
                    username,
                    profile_picture
                )
            `)
            .eq('addressee_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Transform to ensure requester is a single object (not array)
        return (data || []).map((item: any) => ({
            id: item.id,
            created_at: item.created_at,
            requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
        }))
    } catch (error) {
        console.error("Failed to get pending requests:", error)
        return []
    }
}

export async function getFriends() {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        // Get friendships where user is either requester or addressee and status is accepted
        const { data, error } = await supabase
            .from('friendships')
            .select(`
                id,
                requester_id,
                addressee_id,
                created_at,
                requester:profiles!friendships_requester_id_fkey(
                    id,
                    full_name,
                    username,
                    profile_picture,
                    bio
                ),
                addressee:profiles!friendships_addressee_id_fkey(
                    id,
                    full_name,
                    username,
                    profile_picture,
                    bio
                )
            `)
            .eq('status', 'accepted')
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Fetch all current user's relationship IDs to optimize
        const [
            { data: myFollows },
            { data: myFriendships }
        ] = await Promise.all([
            supabase.from('follows').select('following_id').eq('follower_id', user.id),
            supabase.from('friendships').select('requester_id, addressee_id, status').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        ])

        const followingIds = new Set(myFollows?.map(f => f.following_id) || [])
        const friendIds = new Set(myFriendships?.filter(f => f.status === 'accepted').map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id) || [])
        const pendingSentIds = new Set(myFriendships?.filter(f => f.status === 'pending' && f.requester_id === user.id).map(f => f.addressee_id) || [])
        const pendingReceivedIds = new Set(myFriendships?.filter(f => f.status === 'pending' && f.addressee_id === user.id).map(f => f.requester_id) || [])

        // Transform results
        return (data || []).map((friendship: any) => {
            const friend = friendship.requester_id === user.id
                ? friendship.addressee
                : friendship.requester

            return {
                friendshipId: friendship.id,
                ...friend,
                connectionStatus: {
                    isFriend: true,
                    isFollowing: true, // Friends are followers by default
                    isPending: false, // Friendship is accepted
                    isRequested: false, // Friendship is accepted
                }
            }
        })
    } catch (error) {
        console.error("Failed to get friends:", error)
        return []
    }
}

export async function getFollowing() {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('follows')
            .select(`
                id,
                created_at,
                following:profiles!follows_following_id_fkey(
                    id,
                    full_name,
                    username,
                    profile_picture,
                    bio
                )
            `)
            .eq('follower_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Fetch relationship IDs for status determination
        const [
            { data: myFollows },
            { data: myFriendships }
        ] = await Promise.all([
            supabase.from('follows').select('following_id').eq('follower_id', user.id),
            supabase.from('friendships').select('requester_id, addressee_id, status').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        ])

        const followingIds = new Set(myFollows?.map(f => f.following_id) || [])
        const friendIds = new Set(myFriendships?.filter(f => f.status === 'accepted').map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id) || [])
        const pendingSentIds = new Set(myFriendships?.filter(f => f.status === 'pending' && f.requester_id === user.id).map(f => f.addressee_id) || [])
        const pendingReceivedIds = new Set(myFriendships?.filter(f => f.status === 'pending' && f.addressee_id === user.id).map(f => f.requester_id) || [])

        return (data || []).map((follow: any) => ({
            followId: follow.id,
            ...follow.following,
            connectionStatus: {
                isFriend: friendIds.has(follow.following.id),
                isFollowing: true, // They are in the following list
                isPending: pendingSentIds.has(follow.following.id),
                isRequested: pendingReceivedIds.has(follow.following.id),
            }
        }))
    } catch (error) {
        console.error("Failed to get following:", error)
        return []
    }
}

export async function getFollowers() {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('follows')
            .select(`
                id,
                created_at,
                follower:profiles!follows_follower_id_fkey(
                    id,
                    full_name,
                    username,
                    profile_picture,
                    bio
                )
            `)
            .eq('following_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Fetch relationship IDs for status determination
        const [
            { data: myFollows },
            { data: myFriendships }
        ] = await Promise.all([
            supabase.from('follows').select('following_id').eq('follower_id', user.id),
            supabase.from('friendships').select('requester_id, addressee_id, status').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        ])

        const followingIds = new Set(myFollows?.map(f => f.following_id) || [])
        const friendIds = new Set(myFriendships?.filter(f => f.status === 'accepted').map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id) || [])
        const pendingSentIds = new Set(myFriendships?.filter(f => f.status === 'pending' && f.requester_id === user.id).map(f => f.addressee_id) || [])
        const pendingReceivedIds = new Set(myFriendships?.filter(f => f.status === 'pending' && f.addressee_id === user.id).map(f => f.requester_id) || [])

        return (data || []).map((follow: any) => ({
            followId: follow.id,
            ...follow.follower,
            connectionStatus: {
                isFriend: friendIds.has(follow.follower.id),
                isFollowing: true, // Implied following for friends? Or just check followingIds
                isPending: pendingSentIds.has(follow.follower.id),
                isRequested: pendingReceivedIds.has(follow.follower.id),
            }
        }))
    } catch (error) {
        console.error("Failed to get followers:", error)
        return []
    }
}

export async function getConnectionStatus(userId: string) {
    try {
        const user = await getUser()
        if (!user) return { isFriend: false, isFollowing: false, isPending: false, isRequested: false }

        const supabase = await createClient()

        // Check friendship status
        const { data: friendship } = await supabase
            .from('friendships')
            .select('status, requester_id, addressee_id')
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
            .single()

        // Check follow status
        const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .single()

        const isFriend = friendship?.status === 'accepted'
        const isPending = friendship?.status === 'pending' && friendship?.requester_id === user.id
        const isRequested = friendship?.status === 'pending' && friendship?.addressee_id === user.id
        const isFollowing = isFriend || !!follow

        return { isFriend, isFollowing, isPending, isRequested }
    } catch (error) {
        console.error("Failed to get connection status:", error)
        return { isFriend: false, isFollowing: false, isPending: false, isRequested: false }
    }
}

export async function getConnectionSuggestions() {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        // Get users who are not already friends or have pending requests
        // This is a simplified version - you might want more complex logic
        const { data: existingConnections } = await supabase
            .from('friendships')
            .select('requester_id, addressee_id')
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

        const connectedIds = new Set<string>()
        connectedIds.add(user.id) // Exclude self
        existingConnections?.forEach((conn: any) => {
            connectedIds.add(conn.requester_id)
            connectedIds.add(conn.addressee_id)
        })

        // Get random users not connected
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, profile_picture, bio')
            .not('id', 'in', `(${Array.from(connectedIds).join(',')})`)
            .limit(10)

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Fetch relationship IDs for status determination
        const [
            { data: myFollows },
            { data: myFriendships }
        ] = await Promise.all([
            supabase.from('follows').select('following_id').eq('follower_id', user.id),
            supabase.from('friendships').select('requester_id, addressee_id, status').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        ])

        const followingIds = new Set(myFollows?.map(f => f.following_id) || [])
        const friendIds = new Set(myFriendships?.filter(f => f.status === 'accepted').map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id) || [])
        const pendingSentIds = new Set(myFriendships?.filter(f => f.status === 'pending' && f.requester_id === user.id).map(f => f.addressee_id) || [])
        const pendingReceivedIds = new Set(myFriendships?.filter(f => f.status === 'pending' && f.addressee_id === user.id).map(f => f.requester_id) || [])

        return (data || []).map((item: any) => ({
            ...item,
            connectionStatus: (() => {
                const isFriend = friendIds.has(item.id);
                return {
                    isFriend,
                    isFollowing: isFriend || followingIds.has(item.id),
                    isPending: pendingSentIds.has(item.id),
                    isRequested: pendingReceivedIds.has(item.id),
                };
            })()
        }))
    } catch (error) {
        console.error("Failed to get suggestions:", error)
        return []
    }
}

export async function getMutualFriends(targetUserId: string) {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        // Get my friends
        const { data: myFriendships } = await supabase
            .from('friendships')
            .select('requester_id, addressee_id')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

        if (!myFriendships) return []

        const myFriendIds = new Set(
            myFriendships.map((f: any) =>
                f.requester_id === user.id ? f.addressee_id : f.requester_id
            )
        )

        // Get target user's friends
        const { data: targetFriendships } = await supabase
            .from('friendships')
            .select('requester_id, addressee_id')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)

        if (!targetFriendships) return []

        const targetFriendIds = new Set(
            targetFriendships.map((f: any) =>
                f.requester_id === targetUserId ? f.addressee_id : f.requester_id
            )
        )

        // Find mutuals
        const mutualIds = [...myFriendIds].filter(id => targetFriendIds.has(id))

        if (mutualIds.length === 0) return []

        // Fetch profiles for mutual friends
        const { data: mutuals, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, profile_picture')
            .in('id', mutualIds)
            .limit(10)

        if (error) {
            console.error("Supabase error fetching mutuals:", error)
            return []
        }

        return mutuals || []
    } catch (error) {
        console.error("Failed to get mutual friends:", error)
        return []
    }
}
