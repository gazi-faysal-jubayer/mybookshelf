import { createClient, getUser } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/settings/profile-form"
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

    // Sanitize user object for client component
    const defaultValues = {
        full_name: profile.full_name || "",
        profile_picture: profile.profile_picture || "",
        bio: profile.bio || "",
        location: profile.location || "",
        favorite_genre: profile.favorite_genre || "",
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    This is how others will see you on the site.
                </p>
            </div>
            <Separator />
            <ProfileForm defaultValues={defaultValues} />
        </div>
    )
}
