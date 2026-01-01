import { createClient, getUser } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/settings/profile-form"
import { PrivacySettings } from "@/components/settings/privacy-settings"
import { ReadingPreferences } from "@/components/settings/reading-preferences"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
    const user = await getUser()
    if (!user) return null

    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return <div>User not found</div>

    // Profile form values
    const profileDefaults = {
        full_name: profile.full_name || "",
        profile_picture: profile.profile_picture || "",
        bio: profile.bio || "",
        location: profile.location || "",
        favorite_genre: profile.favorite_genre || "",
    }

    // Privacy settings values
    const privacyDefaults = {
        profile_visibility: profile.profile_visibility || "public",
        show_reading_activity: profile.show_reading_activity ?? true,
        show_lending_history: profile.show_lending_history ?? true,
        show_collections: profile.show_collections ?? true,
        allow_messages_from: profile.allow_messages_from || "everyone",
    }

    // Reading preferences values
    const preferencesDefaults = {
        yearly_goal: profile.yearly_goal || 12,
        favorite_authors: profile.favorite_authors || [],
        reading_interests: profile.reading_interests || [],
    }

    // Notification settings values
    const notificationDefaults = {
        email_notifications: profile.email_notifications ?? true,
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <Separator />
            <SettingsTabs
                profileTab={
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Profile</h3>
                            <p className="text-sm text-muted-foreground">
                                This is how others will see you on the site.
                            </p>
                        </div>
                        <ProfileForm defaultValues={profileDefaults} />
                    </div>
                }
                privacyTab={<PrivacySettings defaultValues={privacyDefaults} />}
                preferencesTab={<ReadingPreferences defaultValues={preferencesDefaults} />}
                notificationsTab={<NotificationSettings defaultValues={notificationDefaults} />}
            />
        </div>
    )
}
