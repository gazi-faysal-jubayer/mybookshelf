"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"
import { processMentions } from "./social"

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

        // Process mentions
        await processMentions(data.content, post.id, 'post', user.id)

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

        // Get the post to find the author
        const { data: post } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single()

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

        // Notify post author (but not if they liked their own post)
        if (post && post.user_id !== user.id) {
            const { data: likerProfile } = await supabase
                .from('profiles')
                .select('full_name, username')
                .eq('id', user.id)
                .single()

            const likerName = likerProfile?.full_name || likerProfile?.username || 'Someone'

            await createNotification(
                post.user_id,
                'info',
                `${likerName} liked your post`,
                `/dashboard/feed`,
                {
                    relatedUserId: user.id,
                    relatedPostId: postId,
                    category: 'post_like'
                }
            )
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

export async function addComment(postId: string, content: string, parentId?: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        if (!content.trim()) throw new Error("Content is required")
        if (content.length > 500) throw new Error("Comment too long")

        const supabase = await createClient()

        // Get the post to find the author
        const { data: post } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single()

        const { data: comment, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                content: content.trim(),
                parent_id: parentId || null
            })
            .select('id')
            .single()

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to add comment")
        }

        // Process mentions in comment
        await processMentions(content, comment.id, 'comment', user.id)

        const { data: commenterProfile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', user.id)
            .single()

        const commenterName = commenterProfile?.full_name || commenterProfile?.username || 'Someone'

        // 1. Notify parent comment author if this is a reply
        if (parentId) {
            const { data: parentComment } = await supabase
                .from('post_comments')
                .select('user_id')
                .eq('id', parentId)
                .single()

            if (parentComment && parentComment.user_id !== user.id) {
                await createNotification(
                    parentComment.user_id,
                    'info',
                    `${commenterName} replied to your comment`,
                    `/dashboard/feed?id=${postId}`, // Link to post for now, deeper linking later
                    {
                        relatedUserId: user.id,
                        relatedPostId: postId,
                        relatedCommentId: comment.id,
                        category: 'comment_reply'
                    }
                )
            }
        }

        // 2. Notify post author (but not if they commented on their own post, AND check if we already notified them via reply)
        // If the post author is also the parent comment author, they already got a 'reply' notification, so maybe skip 'comment' notification?
        // Or just send both safely. Simplicity: send both if conditions user_id != post.user_id met.
        // Actually, if I reply to my own comment on someone else's post, post author should get notified. 
        // If I reply to post author's comment on their post, they get reply notification. Post comment notification might be redundant but separate categories.
        // Let's keep it simple: Notify post author if user != post_owner.
        if (post && post.user_id !== user.id) {
            // Check if we already notified this user as a parent comment author
            const parentCommentAuthorId = parentId ? (await supabase.from('post_comments').select('user_id').eq('id', parentId).single()).data?.user_id : null

            // Only send post_comment notification if we didn't just send them a reply notification
            if (parentCommentAuthorId !== post.user_id) {
                await createNotification(
                    post.user_id,
                    'info',
                    `${commenterName} commented on your post`,
                    `/dashboard/feed?id=${postId}`,
                    {
                        relatedUserId: user.id,
                        relatedPostId: postId,
                        relatedCommentId: comment.id,
                        category: 'post_comment'
                    }
                )
            }
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

export async function toggleCommentLike(commentId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Check if already liked
        const { data: existing } = await supabase
            .from('post_comment_likes')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', user.id)
            .single()

        if (existing) {
            // Unlike
            await supabase
                .from('post_comment_likes')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', user.id)
            return { success: true, liked: false }
        } else {
            // Like
            await supabase
                .from('post_comment_likes')
                .insert({
                    comment_id: commentId,
                    user_id: user.id
                })

            // Notify comment author (if not self)
            const { data: comment } = await supabase
                .from('post_comments')
                .select('user_id, post_id')
                .eq('id', commentId)
                .single()

            if (comment && comment.user_id !== user.id) {
                const { data: likerProfile } = await supabase
                    .from('profiles')
                    .select('full_name, username')
                    .eq('id', user.id)
                    .single()

                const likerName = likerProfile?.full_name || likerProfile?.username || 'Someone'

                await createNotification(
                    comment.user_id,
                    'info',
                    `${likerName} liked your comment`,
                    `/dashboard/feed?id=${comment.post_id}`,
                    {
                        relatedUserId: user.id,
                        relatedCommentId: commentId,
                        relatedPostId: comment.post_id,
                        category: 'comment_like'
                    }
                )
            }
            return { success: true, liked: true }
        }
    } catch (error) {
        console.error("Failed to toggle comment like:", error)
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
                user_id,
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

        // Get user IDs from posts and fetch profiles separately
        const userIds = [...new Set(resultPosts.map((p: any) => p.user_id))]
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, username, profile_picture')
            .in('id', userIds)

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

        // Check if user liked each post
        const postIds = resultPosts.map((p: any) => p.id)
        const [likesResult, bookmarksResult, repostsResult] = await Promise.all([
            postIds.length > 0 ? supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', user.id)
                .in('post_id', postIds) : { data: [] },
            postIds.length > 0 ? supabase
                .from('post_bookmarks')
                .select('post_id')
                .eq('user_id', user.id)
                .in('post_id', postIds) : { data: [] },
            postIds.length > 0 ? supabase
                .from('post_reposts')
                .select('original_post_id')
                .eq('user_id', user.id)
                .in('original_post_id', postIds) : { data: [] },
        ])

        const likedPostIds = new Set((likesResult.data || []).map((l: any) => l.post_id))
        const bookmarkedPostIds = new Set((bookmarksResult.data || []).map((b: any) => b.post_id))
        const repostedPostIds = new Set((repostsResult.data || []).map((r: any) => r.original_post_id))

        // Transform posts with profile data
        const transformedPosts = resultPosts
            .map((post: any) => {
                const profile = profileMap.get(post.user_id)
                // Skip posts from users without profiles
                if (!profile) return null
                return {
                    ...post,
                    user: profile,
                    likeCount: post.likes?.[0]?.count || 0,
                    commentCount: post.comments?.[0]?.count || 0,
                    isLiked: likedPostIds.has(post.id),
                    isBookmarked: bookmarkedPostIds.has(post.id),
                    isReposted: repostedPostIds.has(post.id),
                }
            })
            .filter(Boolean)

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
                user_id,
                parent_id,
                likes:post_comment_likes(count)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error("Supabase error:", error)
            return []
        }

        // Fetch profiles separately
        const userIds = [...new Set((comments || []).map((c: any) => c.user_id))]
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, username, profile_picture')
            .in('id', userIds)

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

        // Check user likes
        const commentIds = (comments || []).map((c: any) => c.id)
        const { data: userLikes } = await supabase
            .from('post_comment_likes')
            .select('comment_id')
            .eq('user_id', user.id)
            .in('comment_id', commentIds)

        const likedCommentIds = new Set((userLikes || []).map((l: any) => l.comment_id))

        // Transform to include user data and current user info
        const transformed = (comments || []).map((item: any) => {
            const profile = profileMap.get(item.user_id)
            if (!profile) return null
            return {
                id: item.id,
                content: item.content,
                created_at: item.created_at,
                user: profile,
                isOwn: item.user_id === user.id,
                parentId: item.parent_id,
                likesCount: item.likes?.[0]?.count || 0,
                isLiked: likedCommentIds.has(item.id)
            }
        })

        // Filter out nulls with a type guard so TS knows the array contains only Comment objects
        return transformed.filter((c): c is {
            id: string;
            content: string;
            created_at: string;
            user: any;
            isOwn: boolean;
            parentId: string | null;
            likesCount: number;
            isLiked: boolean;
        } => Boolean(c))
    } catch (error) {
        console.error("Failed to get comments:", error)
        return []
    }
}

export async function getUserPosts(userId: string, cursor?: string, limit: number = 20) {
    try {
        const currentUser = await getUser()
        if (!currentUser) return { posts: [], nextCursor: undefined }

        const supabase = await createClient()

        // Get the user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, username, profile_picture')
            .eq('id', userId)
            .single()

        if (!profile) {
            return { posts: [], nextCursor: undefined }
        }

        // Determine visibility filter based on relationship
        const isOwnProfile = currentUser.id === userId

        let visibilityFilter = ['public'] // Default to public only

        if (isOwnProfile) {
            // User can see all their own posts
            visibilityFilter = ['public', 'connections', 'private']
        } else {
            // Check if they're friends
            const { data: friendship } = await supabase
                .from('friendships')
                .select('id')
                .eq('status', 'accepted')
                .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`)
                .single()

            if (friendship) {
                visibilityFilter = ['public', 'connections']
            }
        }

        let query = supabase
            .from('posts')
            .select(`
                id,
                content,
                visibility,
                created_at,
                updated_at,
                book_id,
                user_id,
                book:books!posts_book_id_fkey(
                    id,
                    title,
                    author,
                    cover_image
                ),
                likes:post_likes(count),
                comments:post_comments(count)
            `)
            .eq('user_id', userId)
            .in('visibility', visibilityFilter)
            .order('created_at', { ascending: false })
            .limit(limit + 1)

        if (cursor) {
            query = query.lt('created_at', cursor)
        }

        const { data: posts, error } = await query

        if (error) {
            console.error("Supabase error:", error)
            return { posts: [], nextCursor: undefined }
        }

        const hasMore = posts && posts.length > limit
        const resultPosts = hasMore ? posts.slice(0, limit) : (posts || [])
        const nextCursor = hasMore && resultPosts.length > 0
            ? resultPosts[resultPosts.length - 1].created_at
            : undefined

        // Check if current user liked/bookmarked/reposted each post
        const postIds = resultPosts.map((p: any) => p.id)
        const [likesResult, bookmarksResult, repostsResult] = await Promise.all([
            postIds.length > 0 ? supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', currentUser.id)
                .in('post_id', postIds) : { data: [] },
            postIds.length > 0 ? supabase
                .from('post_bookmarks')
                .select('post_id')
                .eq('user_id', currentUser.id)
                .in('post_id', postIds) : { data: [] },
            postIds.length > 0 ? supabase
                .from('post_reposts')
                .select('original_post_id')
                .eq('user_id', currentUser.id)
                .in('original_post_id', postIds) : { data: [] },
        ])

        const likedPostIds = new Set((likesResult.data || []).map((l: any) => l.post_id))
        const bookmarkedPostIds = new Set((bookmarksResult.data || []).map((b: any) => b.post_id))
        const repostedPostIds = new Set((repostsResult.data || []).map((r: any) => r.original_post_id))

        // Transform posts
        const transformedPosts = resultPosts.map((post: any) => ({
            ...post,
            user: profile,
            likeCount: post.likes?.[0]?.count || 0,
            commentCount: post.comments?.[0]?.count || 0,
            isLiked: likedPostIds.has(post.id),
            isBookmarked: bookmarkedPostIds.has(post.id),
            isReposted: repostedPostIds.has(post.id),
        }))

        return { posts: transformedPosts, nextCursor }
    } catch (error) {
        console.error("Failed to get user posts:", error)
        return { posts: [], nextCursor: undefined }
    }
}

export async function bookmarkPost(postId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('post_bookmarks')
            .insert({
                post_id: postId,
                user_id: user.id,
            })

        if (error) {
            if (error.code === '23505') {
                return { success: true, alreadyBookmarked: true }
            }
            console.error("Supabase error:", error)
            throw new Error("Failed to bookmark post")
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to bookmark post:", error)
        throw error
    }
}

export async function unbookmarkPost(postId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('post_bookmarks')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to remove bookmark")
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to remove bookmark:", error)
        throw error
    }
}

export async function repostPost(postId: string, quote?: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        // Get the original post to find the author
        const { data: post } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single()

        const { error } = await supabase
            .from('post_reposts')
            .insert({
                original_post_id: postId,
                user_id: user.id,
                quote: quote?.trim() || null,
            })

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: "You've already reposted this" }
            }
            console.error("Supabase error:", error)
            throw new Error("Failed to repost")
        }

        // Notify post author (but not if they shared their own post)
        if (post && post.user_id !== user.id) {
            const { data: sharerProfile } = await supabase
                .from('profiles')
                .select('full_name, username')
                .eq('id', user.id)
                .single()

            const sharerName = sharerProfile?.full_name || sharerProfile?.username || 'Someone'

            await createNotification(
                post.user_id,
                'info',
                `${sharerName} shared your post`,
                `/dashboard/feed`,
                {
                    relatedUserId: user.id,
                    relatedPostId: postId,
                    category: 'post_share'
                }
            )
        }

        revalidatePath("/dashboard/feed")
        return { success: true }
    } catch (error) {
        console.error("Failed to repost:", error)
        throw error
    }
}

export async function unrepost(postId: string) {
    try {
        const user = await getUser()
        if (!user) throw new Error("Unauthorized")

        const supabase = await createClient()

        const { error } = await supabase
            .from('post_reposts')
            .delete()
            .eq('original_post_id', postId)
            .eq('user_id', user.id)

        if (error) {
            console.error("Supabase error:", error)
            throw new Error("Failed to remove repost")
        }

        revalidatePath("/dashboard/feed")
        return { success: true }
    } catch (error) {
        console.error("Failed to remove repost:", error)
        throw error
    }
}

export async function getBookmarkedPosts(cursor?: string, limit: number = 20) {
    try {
        const user = await getUser()
        if (!user) return { posts: [], nextCursor: undefined }

        const supabase = await createClient()

        let query = supabase
            .from('post_bookmarks')
            .select(`
                id,
                created_at,
                post:posts!post_bookmarks_post_id_fkey(
                    id,
                    content,
                    visibility,
                    created_at,
                    updated_at,
                    book_id,
                    user_id,
                    book:books!posts_book_id_fkey(
                        id,
                        title,
                        author,
                        cover_image
                    ),
                    likes:post_likes(count),
                    comments:post_comments(count)
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit + 1)

        if (cursor) {
            query = query.lt('created_at', cursor)
        }

        const { data: bookmarks, error } = await query

        if (error) {
            console.error("Supabase error:", error)
            return { posts: [], nextCursor: undefined }
        }

        const hasMore = bookmarks && bookmarks.length > limit
        const resultBookmarks = hasMore ? bookmarks.slice(0, limit) : (bookmarks || [])
        const nextCursor = hasMore && resultBookmarks.length > 0
            ? resultBookmarks[resultBookmarks.length - 1].created_at
            : undefined

        // Get all user IDs and fetch profiles
        const userIds = [...new Set(resultBookmarks.map((b: any) => b.post?.user_id).filter(Boolean))]
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, username, profile_picture')
            .in('id', userIds)

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

        // Get liked posts
        const postIds = resultBookmarks.map((b: any) => b.post?.id).filter(Boolean)
        const { data: userLikes } = postIds.length > 0 ? await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds) : { data: [] }

        const likedPostIds = new Set((userLikes || []).map((l: any) => l.post_id))

        // Transform posts
        const transformedPosts = resultBookmarks
            .map((bookmark: any) => {
                const post = bookmark.post
                if (!post) return null
                const profile = profileMap.get(post.user_id)
                if (!profile) return null
                return {
                    ...post,
                    user: profile,
                    likeCount: post.likes?.[0]?.count || 0,
                    commentCount: post.comments?.[0]?.count || 0,
                    isLiked: likedPostIds.has(post.id),
                    isBookmarked: true,
                }
            })
            .filter(Boolean)

        return { posts: transformedPosts, nextCursor }
    } catch (error) {
        console.error("Failed to get bookmarked posts:", error)
        return { posts: [], nextCursor: undefined }
    }
}
