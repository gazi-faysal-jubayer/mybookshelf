import Link from "next/link"
import { Book as BookIcon, MoreHorizontal, Folder } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import connectDB from "@/lib/db"
import Collection from "@/models/Collection"
import { auth } from "@/auth"
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog"
import { DeleteCollectionAction } from "@/components/collections/delete-collection-action"

export default async function CollectionsPage() {
    await connectDB()
    const session = await auth()

    // Fetch collections for the current user
    const collections = await Collection.find({ user_id: session?.user?.id })
        .sort({ name: 1 })
        .populate("books", "_id") // Just to get count
        .lean()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
                    <p className="text-muted-foreground">
                        Organize your books into custom lists and shelves.
                    </p>
                </div>
                <CreateCollectionDialog />
            </div>
            <Separator />

            {collections.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <Folder className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold">No collections yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Create your first collection to start organizing your library.
                    </p>
                    <CreateCollectionDialog />
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {collections.map((collection: any) => (
                        <Card key={collection._id.toString()} className="flex flex-col h-full hover:bg-muted/5 transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="grid gap-1">
                                        <CardTitle className="line-clamp-1">
                                            <Link href={`/dashboard/collections/${collection._id}`} className="hover:underline">
                                                {collection.name}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 min-h-[2.5em]">
                                            {collection.description || "No description"}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/collections/${collection._id}`}>View Collection</Link>
                                            </DropdownMenuItem>
                                            <DeleteCollectionAction collectionId={collection._id.toString()} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <div className="flex space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <BookIcon className="mr-1 h-3 w-3" />
                                        {collection.books?.length || 0} books
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
