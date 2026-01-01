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
import { createClient, getUser } from "@/lib/supabase/server"
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog"
import { DeleteCollectionAction } from "@/components/collections/delete-collection-action"

export default async function CollectionsPage() {
    const user = await getUser()
    if (!user) return null

    const supabase = await createClient()

    // Fetch collections for the current user with book counts
    const { data: collections } = await supabase
        .from('collections')
        .select(`
            *,
            collection_books (
                id
            )
        `)
        .eq('user_id', user.id)
        .order('name', { ascending: true })

    const collectionsList = collections || []

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

            {collectionsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50 bg-muted/10">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <Folder className="h-10 w-10 text-primary" />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h3 className="text-xl font-bold">Organize your library</h3>
                        <p className="text-muted-foreground">
                            Collections help you group books together. Create lists like "Summer Reads", "Sci-Fi Favorites", or "To Buy".
                        </p>
                    </div>
                    <CreateCollectionDialog />
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {collectionsList.map((collection: any) => (
                        <Card key={collection.id} className="flex flex-col h-full hover:bg-muted/5 transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="grid gap-1">
                                        <CardTitle className="line-clamp-1">
                                            <Link href={`/dashboard/collections/${collection.id}`} className="hover:underline">
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
                                                <Link href={`/dashboard/collections/${collection.id}`}>View Collection</Link>
                                            </DropdownMenuItem>
                                            <DeleteCollectionAction collectionId={collection.id} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <div className="flex space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <BookIcon className="mr-1 h-3 w-3" />
                                        {collection.collection_books?.length || 0} books
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
