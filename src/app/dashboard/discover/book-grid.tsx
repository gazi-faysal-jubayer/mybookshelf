import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, BookOpen } from "lucide-react"

interface BookGridProps {
    books: any[]
}

export function BookGrid({ books }: BookGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.map((book) => (
                <DiscoverBookCard key={book.id} book={book} />
            ))}
        </div>
    )
}

function DiscoverBookCard({ book }: { book: any }) {
    const owner = book.owner
    
    return (
        <Card className="group overflow-hidden transition-all hover:shadow-lg">
            <Link href={`/dashboard/books/${book.id}`}>
                <div className="relative aspect-[2/3] bg-muted">
                    {book.cover_image ? (
                        <Image
                            src={book.cover_image}
                            alt={book.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                    )}
                    
                    {/* Availability Badge */}
                    {book.is_available_for_lending && book.lending_status === 'available' && (
                        <Badge 
                            className="absolute top-2 right-2 bg-green-500 hover:bg-green-600"
                        >
                            Available
                        </Badge>
                    )}

                    {/* Condition Badge */}
                    {book.lending_condition && (
                        <Badge 
                            variant="secondary"
                            className="absolute top-2 left-2 text-xs"
                        >
                            {book.lending_condition.replace('_', ' ')}
                        </Badge>
                    )}
                </div>

                <CardContent className="p-3 space-y-2">
                    {/* Title & Author */}
                    <div>
                        <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                            {book.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {book.author}
                        </p>
                    </div>

                    {/* Rating */}
                    {book.rating && (
                        <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{book.rating}/5</span>
                        </div>
                    )}

                    {/* Owner Info */}
                    {owner && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                            <div className="relative h-6 w-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                {owner.profile_picture ? (
                                    <Image
                                        src={owner.profile_picture}
                                        alt={owner.username || owner.full_name || 'Owner'}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                                        {(owner.username || owner.full_name || 'U')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">
                                    {owner.username || owner.full_name || 'Anonymous'}
                                </p>
                                {owner.city && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                                        <MapPin className="h-3 w-3" />
                                        {owner.city}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Distance */}
                    {book.distance !== undefined && book.distance !== null && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {book.distance} km away
                        </div>
                    )}
                </CardContent>
            </Link>
        </Card>
    )
}
