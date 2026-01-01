"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Shield, BookOpen, Bell } from "lucide-react"

interface SettingsTabsProps {
    profileTab: React.ReactNode
    privacyTab: React.ReactNode
    preferencesTab: React.ReactNode
    notificationsTab: React.ReactNode
}

export function SettingsTabs({
    profileTab,
    privacyTab,
    preferencesTab,
    notificationsTab,
}: SettingsTabsProps) {
    return (
        <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="privacy" className="gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Privacy</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Preferences</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-6">
                {profileTab}
            </TabsContent>
            <TabsContent value="privacy" className="space-y-6">
                {privacyTab}
            </TabsContent>
            <TabsContent value="preferences" className="space-y-6">
                {preferencesTab}
            </TabsContent>
            <TabsContent value="notifications" className="space-y-6">
                {notificationsTab}
            </TabsContent>
        </Tabs>
    )
}
