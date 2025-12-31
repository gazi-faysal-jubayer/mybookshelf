"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// =====================================================
// CONVERSATIONS
// =====================================================

export async function getConversations() {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Get all conversations user is part of
    const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

    if (!participations || participations.length === 0) {
        return []
    }

    const conversationIds = participations.map(p => p.conversation_id)

    // Get conversation details with last message
    const { data: conversations } = await supabase
        .from('conversations')
        .select(`
            id,
            title,
            is_group,
            created_at,
            updated_at
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false })

    if (!conversations) return []

    // Get participants and last messages for each conversation
    const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
            // Get participants
            const { data: participants } = await supabase
                .from('conversation_participants')
                .select(`
                    user_id,
                    last_read_at,
                    user:user_id (id, username, full_name, profile_picture)
                `)
                .eq('conversation_id', conv.id)

            // Get last message
            const { data: lastMessages } = await supabase
                .from('messages')
                .select(`
                    id,
                    content,
                    message_type,
                    created_at,
                    sender:sender_id (id, username, full_name, profile_picture)
                `)
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)

            // Get unread count
            const myParticipation = participants?.find(p => p.user_id === user.id)
            let unreadCount = 0
            
            if (myParticipation?.last_read_at) {
                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .neq('sender_id', user.id)
                    .gt('created_at', myParticipation.last_read_at)
                
                unreadCount = count || 0
            }

            // For 1:1 conversations, get the other person
            const otherParticipants = participants?.filter(p => p.user_id !== user.id) || []

            return {
                ...conv,
                participants: participants?.map(p => p.user) || [],
                lastMessage: lastMessages?.[0] || null,
                unreadCount,
                otherUser: !conv.is_group && otherParticipants[0] ? otherParticipants[0].user : null
            }
        })
    )

    return enrichedConversations
}

export async function getOrCreateConversation(otherUserId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    if (user.id === otherUserId) throw new Error("Cannot message yourself")

    const supabase = await createClient()

    // Check if conversation already exists between these two users
    const { data: myConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

    if (myConversations && myConversations.length > 0) {
        const convIds = myConversations.map(c => c.conversation_id)
        
        // Check if other user is in any of these
        const { data: sharedConvs } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', otherUserId)
            .in('conversation_id', convIds)

        if (sharedConvs && sharedConvs.length > 0) {
            // Verify it's a 1:1 conversation (only 2 participants)
            for (const conv of sharedConvs) {
                const { count } = await supabase
                    .from('conversation_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.conversation_id)

                if (count === 2) {
                    return { conversationId: conv.conversation_id, isNew: false }
                }
            }
        }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
            is_group: false
        })
        .select()
        .single()

    if (convError) throw new Error("Failed to create conversation")

    // Add participants
    const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
            { conversation_id: newConv.id, user_id: user.id },
            { conversation_id: newConv.id, user_id: otherUserId }
        ])

    if (partError) throw new Error("Failed to add participants")

    return { conversationId: newConv.id, isNew: true }
}

export async function createGroupConversation(title: string, memberIds: string[]) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Create conversation
    const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
            title,
            is_group: true
        })
        .select()
        .single()

    if (convError) throw new Error("Failed to create group")

    // Add all participants including creator
    const allMembers = [...new Set([user.id, ...memberIds])]
    
    const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(
            allMembers.map(userId => ({
                conversation_id: newConv.id,
                user_id: userId
            }))
        )

    if (partError) throw new Error("Failed to add members")

    return { conversationId: newConv.id }
}

// =====================================================
// MESSAGES
// =====================================================

export async function getMessages(conversationId: string, page = 1) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()
    const limit = 50
    const offset = (page - 1) * limit

    // Verify user is participant
    const { data: participation } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single()

    if (!participation) throw new Error("Access denied")

    // Get messages
    const { data: messages, count } = await supabase
        .from('messages')
        .select(`
            id,
            content,
            message_type,
            attachment_url,
            book_id,
            borrow_request_id,
            created_at,
            is_edited,
            sender:sender_id (id, username, full_name, profile_picture)
        `, { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    // Mark as read
    await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

    return { 
        messages: (messages || []).reverse(), 
        total: count || 0,
        hasMore: (count || 0) > offset + limit
    }
}

export async function sendMessage(data: {
    conversationId: string
    content: string
    messageType?: 'text' | 'image' | 'book_share' | 'borrow_request'
    attachmentUrl?: string
    bookId?: string
    borrowRequestId?: string
}) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Verify user is participant
    const { data: participation } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', data.conversationId)
        .eq('user_id', user.id)
        .single()

    if (!participation) throw new Error("Access denied")

    // Create message
    const { data: message, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: data.conversationId,
            sender_id: user.id,
            content: data.content,
            message_type: data.messageType || 'text',
            attachment_url: data.attachmentUrl,
            book_id: data.bookId,
            borrow_request_id: data.borrowRequestId
        })
        .select(`
            id,
            content,
            message_type,
            created_at,
            sender:sender_id (id, username, full_name, profile_picture)
        `)
        .single()

    if (error) throw new Error("Failed to send message")

    // Update conversation timestamp
    await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.conversationId)

    // Create notification for other participants
    const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', data.conversationId)
        .neq('user_id', user.id)

    if (participants) {
        await supabase.from('notifications').insert(
            participants.map(p => ({
                user_id: p.user_id,
                type: 'message',
                title: 'New message',
                message: `${user.email} sent you a message`,
                action_url: `/dashboard/messages/${data.conversationId}`,
                metadata: { senderId: user.id, conversationId: data.conversationId }
            }))
        )
    }

    return message
}

export async function editMessage(messageId: string, newContent: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Verify user owns the message
    const { data: message } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

    if (message?.sender_id !== user.id) {
        throw new Error("Can only edit your own messages")
    }

    const { error } = await supabase
        .from('messages')
        .update({ 
            content: newContent, 
            is_edited: true 
        })
        .eq('id', messageId)

    if (error) throw new Error("Failed to edit message")

    return { success: true }
}

export async function deleteMessage(messageId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Verify user owns the message
    const { data: message } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

    if (message?.sender_id !== user.id) {
        throw new Error("Can only delete your own messages")
    }

    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

    if (error) throw new Error("Failed to delete message")

    return { success: true }
}

// =====================================================
// CONVERSATION MANAGEMENT
// =====================================================

export async function leaveConversation(conversationId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

    if (error) throw new Error("Failed to leave conversation")

    revalidatePath('/dashboard/messages')
    return { success: true }
}

export async function addParticipant(conversationId: string, userId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Verify current user is participant
    const { data: participation } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single()

    if (!participation) throw new Error("Access denied")

    // Verify it's a group conversation
    const { data: conv } = await supabase
        .from('conversations')
        .select('is_group')
        .eq('id', conversationId)
        .single()

    if (!conv?.is_group) throw new Error("Cannot add participants to direct messages")

    // Add new participant
    const { error } = await supabase
        .from('conversation_participants')
        .insert({
            conversation_id: conversationId,
            user_id: userId
        })

    if (error) throw new Error("Failed to add participant")

    revalidatePath(`/dashboard/messages/${conversationId}`)
    return { success: true }
}

// =====================================================
// TYPING INDICATORS & READ RECEIPTS
// =====================================================

export async function markConversationRead(conversationId: string) {
    const user = await getUser()
    if (!user) return

    const supabase = await createClient()

    await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
}

export async function getTotalUnreadCount() {
    const user = await getUser()
    if (!user) return 0

    const supabase = await createClient()

    // Get all user's conversations with their last read time
    const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)

    if (!participations || participations.length === 0) return 0

    let totalUnread = 0

    for (const p of participations) {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', p.conversation_id)
            .neq('sender_id', user.id)
            .gt('created_at', p.last_read_at || '1970-01-01')

        totalUnread += count || 0
    }

    return totalUnread
}
