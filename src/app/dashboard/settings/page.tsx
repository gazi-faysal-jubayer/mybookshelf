import { auth } from "@/auth"
import connectDB from "@/lib/db"
import User from "@/models/User"
import { ProfileForm } from "@/components/settings/profile-form"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user?.id) return null

    await connectDB()

    const user = await User.findById(session.user.id).lean()

    if (!user) return <div>User not found</div>

    // Sanitize user object for client component
    const defaultValues = {
        full_name: user.full_name || "",
        profile_picture: user.profile_picture || "",
        bio: user.bio || "",
        location: user.location || "",
        favorite_genre: user.favorite_genre || "",
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
