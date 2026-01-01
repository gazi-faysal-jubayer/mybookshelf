"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createPost(data: {
    content: string
    visibility: "public" | "connections" | "private"
    bookId?: string
}) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        if (!data.content.trim()) throw new Error("Content is required")
        if (data.content.length > 1000) throw new Error("Content too long")

        const supabase = await createClient()

        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                content: data.content.trim(),
                visibility: data.visibility,
                book_id: data.bookId || null,
            })
            .select('id')
            .single()

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to create post")
        }

        revalidatePath("/dashboard/feed")
        return { success: true, postId: post.id }
    } catch (error) {
        console.error("Failed to create post:", error)
        throw error
    }
}

export async function deletePost(postId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to delete post")
        }

        revalidatePath("/dashboard/feed")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete post:", error)
        throw error
    }
}

export async function likePost(postId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('post_likes')
            .insert({
                post_id: postId,
                user_id: user.id,
            })

        if (error) {
            if (error.code === '23505') {
                // Already liked
                return { success: true, alreadyLiked: true }
            }
            console.error("Supabase error:", error)
            throw new Error("Failed to like post")
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to like post:", error)
        throw error
    }
}

export async function unlikePost(postId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to unlike post")
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to unlike post:", error)
        throw error
    }
}

export async function addComment(postId: string, content: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        if (!content.trim()) throw new Error("Content is required")
        if (content.length > 500) throw new Error("Comment too long")

        const supabase = await createClient()

        const { data: comment, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                content: content.trim(),
            })
            .select('id')
            .single()

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to add comment")
        }

        return { success: true, commentId: comment.id }
    } catch (error) {
        console.error("Failed to add comment:", error)
        throw error
    }
}

export async function deleteComment(commentId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('post_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to delete comment")
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to delete comment:", error)
        throw error
    }
}

export async function getFeed(mode: 'global' | 'connections', cursor?: string, limit: number = 20) {
    try {
        const user = await getUser()
        if (!user) return { posts: [], nextCursor: undefined }

        const supabase = await createClient()

        let query = supabase
            .from('posts')
            .select(`
                id,
                content,
                visibility,
                created_at,
                updated_at,
                book_id,
                user:profiles!posts_user_id_fkey(
                    id,
                    full_name,
                    username,
                    profile_picture
                ),
                book:books!posts_book_id_fkey(
                    id,
                    title,
                    author,
                    cover_image
                ),
                likes:post_likes(count),
                comments:post_comments(count)
            `)
            .order('created_at', { ascending: false })
            .limit(limit + 1) // Fetch one extra to know if there's more

        if (cursor) {
            query = query.lt('created_at', cursor)
        }

        if (mode === 'connections') {
            // Get friend IDs
            const { data: friendships } = await supabase
                .from('friendships')
                .select('requester_id, addressee_id')
                .eq('status', 'accepted')
                .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

            const friendIds = new Set<string>()
            friendIds.add(user.id) // Include own posts
            friendships?.forEach((f: any) => {
                friendIds.add(f.requester_id)
                friendIds.add(f.addressee_id)
            })

            if (friendIds.size === 1) {
                // Only self, no friends - just show own posts
                query = query.eq('user_id', user.id)
            } else {
                query = query.in('user_id', Array.from(friendIds))
            }
        } else {
            // Global - show public posts
            query = query.eq('visibility', 'public')
        }

        const { data: posts, error } = await query

        if (error) {
            console.error("Supabase error:", error)
            return { posts: [], nextCursor: undefined }
        }

        // Check if there's more
        const hasMore = posts && posts.length > limit
        const resultPosts = hasMore ? posts.slice(0, limit) : (posts || [])
        const nextCursor = hasMore && resultPosts.length > 0
            ? resultPosts[resultPosts.length - 1].created_at
            : undefined

        // Check if user liked each post
        const postIds = resultPosts.map((p: any) => p.id)
        const { data: userLikes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds)

        const likedPostIds = new Set((userLikes || []).map((l: any) => l.post_id))

        // Transform posts
        const transformedPosts = resultPosts.map((post: any) => ({
            ...post,
            likeCount: post.likes?.[0]?.count || 0,
            commentCount: post.comments?.[0]?.count || 0,
            isLiked: likedPostIds.has(post.id),
        }))

        return { posts: transformedPosts, nextCursor }
    } catch (error) {
        console.error("Failed to get feed:", error)
        return { posts: [], nextCursor: undefined }
    }
}

export async function getPostComments(postId: string) {
    try {
        const user = await getUser()
        if (!user) return []

        const supabase = await createClient()

        const { data: comments, error } = await supabase
            .from('post_comments')
            .select(`
                id,
                content,
                created_at,
                user:profiles!post_comments_user_id_fkey(
                    id,
                    full_name,
                    username,
                    profile_picture
                )
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Transform to ensure user is a single object (not array)
        return (comments || []).map((item: any) => ({
            id: item.id,
            content: item.content,
            created_at: item.created_at,
            user: Array.isArray(item.user) ? item.user[0] : item.user,
        }))
    } catch (error) {
        console.error("Failed to get comments:", error)
        return []
    }
}
