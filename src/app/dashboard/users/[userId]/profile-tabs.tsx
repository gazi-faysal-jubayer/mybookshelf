"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserBooksTab } from "./tabs/user-books-tab"
import { UserActivityTab } from "./tabs/user-activity-tab"
import { UserReviewsTab } from "./tabs/user-reviews-tab"
import { UserConnectionsTab } from "./tabs/user-connections-tab"
import { BookOpen, Activity, Star, Users } from "lucide-react"

interface Profile {
    id: string
    username?: string
    full_name?: string
    show_collections?: boolean
    show_reading_activity?: boolean
    show_lending_history?: boolean
}

interface ProfileTabsProps {
    userId: string
    profile: Profile
    isOwnProfile: boolean
}

export function ProfileTabs({ userId, profile, isOwnProfile }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState("books")

    // Check privacy settings
    const showActivity = isOwnProfile || profile.show_reading_activity !== false
    const showBooks = isOwnProfile || profile.show_collections !== false

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
                {showBooks && (
                    <TabsTrigger value="books" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Books</span>
                    </TabsTrigger>
                )}
                {showActivity && (
                    <TabsTrigger value="activity" className="gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">Activity</span>
                    </TabsTrigger>
                )}
                <TabsTrigger value="reviews" className="gap-2">
                    <Star className="h-4 w-4" />
                    <span className="hidden sm:inline">Reviews</span>
                </TabsTrigger>
                <TabsTrigger value="connections" className="gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Connections</span>
                </TabsTrigger>
            </TabsList>

            {showBooks && (
                <TabsContent value="books" className="mt-6">
                    <UserBooksTab userId={userId} isOwnProfile={isOwnProfile} />
                </TabsContent>
            )}

            {showActivity && (
                <TabsContent value="activity" className="mt-6">
                    <UserActivityTab userId={userId} />
                </TabsContent>
            )}

            <TabsContent value="reviews" className="mt-6">
                <UserReviewsTab userId={userId} />
            </TabsContent>

            <TabsContent value="connections" className="mt-6">
                <UserConnectionsTab userId={userId} />
            </TabsContent>
        </Tabs>
    )
}
