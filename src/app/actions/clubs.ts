"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// =====================================================
// BOOK CLUBS
// =====================================================

export async function createBookClub(data: {
    name: string
    description?: string
    coverImage?: string
    isPublic?: boolean
    maxMembers?: number
    currentBookId?: string
}) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Create the club
    const { data: club, error } = await supabase
        .from('book_clubs')
        .insert({
            name: data.name,
            description: data.description,
            cover_image: data.coverImage,
            is_public: data.isPublic ?? true,
            max_members: data.maxMembers,
            current_book_id: data.currentBookId,
            owner_id: user.id
        })
        .select()
        .single()

    if (error) throw new Error("Failed to create book club")

    // Add creator as admin member
    await supabase.from('book_club_members').insert({
        club_id: club.id,
        user_id: user.id,
        role: 'admin'
    })

    revalidatePath('/dashboard/clubs')
    return { clubId: club.id }
}

export async function updateBookClub(clubId: string, data: {
    name?: string
    description?: string
    coverImage?: string
    isPublic?: boolean
    maxMembers?: number
    currentBookId?: string
}) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Verify user is admin
    const { data: membership } = await supabase
        .from('book_club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single()

    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
        throw new Error("Only admins can update the club")
    }

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.coverImage !== undefined) updateData.cover_image = data.coverImage
    if (data.isPublic !== undefined) updateData.is_public = data.isPublic
    if (data.maxMembers !== undefined) updateData.max_members = data.maxMembers
    if (data.currentBookId !== undefined) updateData.current_book_id = data.currentBookId

    const { error } = await supabase
        .from('book_clubs')
        .update(updateData)
        .eq('id', clubId)

    if (error) throw new Error("Failed to update club")

    revalidatePath(`/dashboard/clubs/${clubId}`)
    return { success: true }
}

export async function deleteBookClub(clubId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Verify user is owner
    const { data: club } = await supabase
        .from('book_clubs')
        .select('owner_id')
        .eq('id', clubId)
        .single()

    if (club?.owner_id !== user.id) {
        throw new Error("Only the owner can delete the club")
    }

    const { error } = await supabase
        .from('book_clubs')
        .delete()
        .eq('id', clubId)

    if (error) throw new Error("Failed to delete club")

    revalidatePath('/dashboard/clubs')
    return { success: true }
}

// =====================================================
// CLUB MEMBERSHIP
// =====================================================

export async function joinBookClub(clubId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Check if club exists and is public
    const { data: club } = await supabase
        .from('book_clubs')
        .select('is_public, max_members')
        .eq('id', clubId)
        .single()

    if (!club) throw new Error("Club not found")
    if (!club.is_public) throw new Error("This is a private club")

    // Check member limit
    if (club.max_members) {
        const { count } = await supabase
            .from('book_club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', clubId)

        if ((count || 0) >= club.max_members) {
            throw new Error("Club is full")
        }
    }

    // Join
    const { error } = await supabase
        .from('book_club_members')
        .insert({
            club_id: clubId,
            user_id: user.id,
            role: 'member'
        })

    if (error) {
        if (error.code === '23505') throw new Error("Already a member")
        throw new Error("Failed to join club")
    }

    revalidatePath(`/dashboard/clubs/${clubId}`)
    return { success: true }
}

export async function leaveBookClub(clubId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Check if user is owner
    const { data: club } = await supabase
        .from('book_clubs')
        .select('owner_id')
        .eq('id', clubId)
        .single()

    if (club?.owner_id === user.id) {
        throw new Error("Owner cannot leave. Transfer ownership or delete the club.")
    }

    const { error } = await supabase
        .from('book_club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id)

    if (error) throw new Error("Failed to leave club")

    revalidatePath(`/dashboard/clubs/${clubId}`)
    return { success: true }
}

export async function updateMemberRole(clubId: string, userId: string, role: 'admin' | 'moderator' | 'member') {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Verify current user is admin
    const { data: membership } = await supabase
        .from('book_club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single()

    if (membership?.role !== 'admin') {
        throw new Error("Only admins can change roles")
    }

    const { error } = await supabase
        .from('book_club_members')
        .update({ role })
        .eq('club_id', clubId)
        .eq('user_id', userId)

    if (error) throw new Error("Failed to update role")

    revalidatePath(`/dashboard/clubs/${clubId}`)
    return { success: true }
}

export async function removeMember(clubId: string, userId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Verify current user is admin or moderator
    const { data: membership } = await supabase
        .from('book_club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single()

    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
        throw new Error("Not authorized to remove members")
    }

    // Can't remove owner
    const { data: club } = await supabase
        .from('book_clubs')
        .select('owner_id')
        .eq('id', clubId)
        .single()

    if (club?.owner_id === userId) {
        throw new Error("Cannot remove the owner")
    }

    const { error } = await supabase
        .from('book_club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId)

    if (error) throw new Error("Failed to remove member")

    revalidatePath(`/dashboard/clubs/${clubId}`)
    return { success: true }
}

// =====================================================
// CLUB QUERIES
// =====================================================

export async function getBookClubs(filters?: {
    query?: string
    myClubs?: boolean
    page?: number
}) {
    const user = await getUser()
    const supabase = await createClient()

    const limit = 20
    const page = filters?.page || 1
    const offset = (page - 1) * limit

    if (filters?.myClubs && user) {
        // Get clubs user is a member of
        const { data: memberships } = await supabase
            .from('book_club_members')
            .select('club_id')
            .eq('user_id', user.id)

        if (!memberships || memberships.length === 0) return { clubs: [], total: 0 }

        const clubIds = memberships.map(m => m.club_id)

        const { data: clubs, count } = await supabase
            .from('book_clubs')
            .select(`
                *,
                owner:owner_id (id, username, full_name, profile_picture),
                current_book:current_book_id (id, title, author, cover_image)
            `, { count: 'exact' })
            .in('id', clubIds)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1)

        return { clubs: clubs || [], total: count || 0 }
    }

    // Public clubs discovery
    let query = supabase
        .from('book_clubs')
        .select(`
            *,
            owner:owner_id (id, username, full_name, profile_picture),
            current_book:current_book_id (id, title, author, cover_image)
        `, { count: 'exact' })
        .eq('is_public', true)

    if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
    }

    const { data: clubs, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    // Add member count to each club
    const enrichedClubs = await Promise.all(
        (clubs || []).map(async (club) => {
            const { count } = await supabase
                .from('book_club_members')
                .select('*', { count: 'exact', head: true })
                .eq('club_id', club.id)

            return { ...club, memberCount: count || 0 }
        })
    )

    return { clubs: enrichedClubs, total: count || 0 }
}

export async function getBookClubDetails(clubId: string) {
    const user = await getUser()
    const supabase = await createClient()

    const { data: club } = await supabase
        .from('book_clubs')
        .select(`
            *,
            owner:owner_id (id, username, full_name, profile_picture),
            current_book:current_book_id (id, title, author, cover_image, description)
        `)
        .eq('id', clubId)
        .single()

    if (!club) return null

    // Get members
    const { data: members } = await supabase
        .from('book_club_members')
        .select(`
            role,
            joined_at,
            user:user_id (id, username, full_name, profile_picture)
        `)
        .eq('club_id', clubId)
        .order('joined_at', { ascending: true })

    // Check if current user is a member
    let userMembership = null
    if (user) {
        const member = members?.find(m => (m.user as any)?.id === user.id)
        userMembership = member ? { role: member.role } : null
    }

    return {
        ...club,
        members: members || [],
        memberCount: members?.length || 0,
        userMembership
    }
}

// =====================================================
// READING CHALLENGES
// =====================================================

export async function createReadingChallenge(data: {
    title: string
    description?: string
    challengeType: 'books_count' | 'pages_count' | 'genre_specific' | 'author_diversity'
    targetValue: number
    startDate: string
    endDate: string
    targetGenres?: string[]
    isPublic?: boolean
}) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { data: challenge, error } = await supabase
        .from('reading_challenges')
        .insert({
            title: data.title,
            description: data.description,
            challenge_type: data.challengeType,
            target_value: data.targetValue,
            start_date: data.startDate,
            end_date: data.endDate,
            target_genres: data.targetGenres,
            is_public: data.isPublic ?? true,
            created_by: user.id
        })
        .select()
        .single()

    if (error) throw new Error("Failed to create challenge")

    // Auto-join creator
    await supabase.from('user_challenges').insert({
        user_id: user.id,
        challenge_id: challenge.id,
        current_progress: 0
    })

    revalidatePath('/dashboard/challenges')
    return { challengeId: challenge.id }
}

export async function joinChallenge(challengeId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    const { error } = await supabase
        .from('user_challenges')
        .insert({
            user_id: user.id,
            challenge_id: challengeId,
            current_progress: 0
        })

    if (error) {
        if (error.code === '23505') throw new Error("Already joined")
        throw new Error("Failed to join challenge")
    }

    revalidatePath(`/dashboard/challenges/${challengeId}`)
    return { success: true }
}

export async function updateChallengeProgress(challengeId: string, progress: number) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    const supabase = await createClient()

    // Get challenge target
    const { data: challenge } = await supabase
        .from('reading_challenges')
        .select('target_value')
        .eq('id', challengeId)
        .single()

    const isCompleted = progress >= (challenge?.target_value || 0)

    const { error } = await supabase
        .from('user_challenges')
        .update({
            current_progress: progress,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)

    if (error) throw new Error("Failed to update progress")

    revalidatePath(`/dashboard/challenges/${challengeId}`)
    return { success: true, isCompleted }
}

export async function getChallenges(filters?: {
    active?: boolean
    joined?: boolean
    page?: number
}) {
    const user = await getUser()
    const supabase = await createClient()

    const limit = 20
    const page = filters?.page || 1
    const offset = (page - 1) * limit
    const now = new Date().toISOString()

    if (filters?.joined && user) {
        const { data: userChallenges } = await supabase
            .from('user_challenges')
            .select(`
                *,
                challenge:challenge_id (*)
            `)
            .eq('user_id', user.id)
            .order('joined_at', { ascending: false })
            .range(offset, offset + limit - 1)

        return { challenges: userChallenges || [], total: userChallenges?.length || 0 }
    }

    let query = supabase
        .from('reading_challenges')
        .select('*', { count: 'exact' })
        .eq('is_public', true)

    if (filters?.active) {
        query = query.lte('start_date', now).gte('end_date', now)
    }

    const { data: challenges, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    // Add participant count
    const enrichedChallenges = await Promise.all(
        (challenges || []).map(async (challenge) => {
            const { count } = await supabase
                .from('user_challenges')
                .select('*', { count: 'exact', head: true })
                .eq('challenge_id', challenge.id)

            let userProgress = null
            if (user) {
                const { data: progress } = await supabase
                    .from('user_challenges')
                    .select('*')
                    .eq('challenge_id', challenge.id)
                    .eq('user_id', user.id)
                    .single()
                userProgress = progress
            }

            return { ...challenge, participantCount: count || 0, userProgress }
        })
    )

    return { challenges: enrichedChallenges, total: count || 0 }
}

export async function getChallengeLeaderboard(challengeId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('user_challenges')
        .select(`
            current_progress,
            is_completed,
            completed_at,
            user:user_id (id, username, full_name, profile_picture)
        `)
        .eq('challenge_id', challengeId)
        .order('current_progress', { ascending: false })
        .order('completed_at', { ascending: true })
        .limit(50)

    return data || []
}
