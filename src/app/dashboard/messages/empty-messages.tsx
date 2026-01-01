import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function EmptyMessages() {
    return (
        <div className="border rounded-lg h-full flex items-center justify-center bg-muted/10 p-6">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex justify-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-xl">Your inbox is empty</h3>
                    <p className="text-muted-foreground">
                        Connect with other book lovers! Ask about a book, share your thoughts, or request to borrow a title.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <Button asChild variant="default" className="w-full">
                        <Link href="/dashboard/discover">
                            Find Books
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/connections">
                            Find Friends
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
