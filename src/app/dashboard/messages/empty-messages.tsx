import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function EmptyMessages() {
    return (
        <div className="border rounded-lg h-full flex items-center justify-center bg-muted/30">
            <div className="text-center space-y-4 max-w-sm">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-lg">No messages yet</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                        Start a conversation by browsing books and messaging their owners, 
                        or wait for borrowers to contact you about your books.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/discover">
                        Discover Books
                    </Link>
                </Button>
            </div>
        </div>
    )
}
