"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2, Search, Camera, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface ISBNScannerProps {
    onBookDataFetched: (data: any) => void
}

export function ISBNScanner({ onBookDataFetched }: ISBNScannerProps) {
    const [isbn, setIsbn] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const [fetchedData, setFetchedData] = useState<any>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // Format ISBN as user types (add hyphens)
    const formatISBN = (value: string) => {
        // Remove non-digits except X at the end
        const cleaned = value.replace(/[^\dXx]/g, "").toUpperCase()
        return cleaned.slice(0, 13) // Max 13 chars for ISBN-13
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatISBN(e.target.value)
        setIsbn(formatted)
    }

    const fetchBookData = async () => {
        if (!isbn || isbn.length < 10) {
            toast.error("Please enter a valid ISBN (10 or 13 digits)")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`/api/isbn?isbn=${encodeURIComponent(isbn)}`)
            const result = await response.json()

            if (!response.ok) {
                toast.error(result.error || "Failed to fetch book data")
                return
            }

            setFetchedData(result.data)
            toast.success("Book information found!")
        } catch (error) {
            toast.error("Failed to fetch book data")
        } finally {
            setIsLoading(false)
        }
    }

    const applyFetchedData = () => {
        if (fetchedData) {
            onBookDataFetched(fetchedData)
            setFetchedData(null)
            setIsbn("")
            toast.success("Book details applied!")
        }
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            streamRef.current = stream
            setIsCameraOpen(true)

            // In a real implementation, we'd use a barcode scanning library
            toast.info("Barcode scanning requires additional setup. Please enter ISBN manually.")
        } catch (err) {
            toast.error("Could not access camera")
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        setIsCameraOpen(false)
    }

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
            }
        }
    }, [])

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
                <h3 className="font-medium">Quick Fill by ISBN</h3>
                <span className="text-xs text-muted-foreground">(Optional)</span>
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        type="text"
                        placeholder="Enter ISBN (e.g., 9780141439518)"
                        value={isbn}
                        onChange={handleInputChange}
                        className="pr-10"
                    />
                    {isbn && (
                        <button
                            type="button"
                            onClick={() => setIsbn("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={fetchBookData}
                    disabled={isLoading || isbn.length < 10}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Fetch</span>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={startCamera}
                    title="Scan barcode"
                >
                    <Camera className="h-4 w-4" />
                </Button>
            </div>

            {/* Fetched Data Preview */}
            {fetchedData && (
                <div className="p-4 border rounded-lg bg-background space-y-3">
                    <div className="flex items-start gap-3">
                        {fetchedData.cover_image && (
                            <img
                                src={fetchedData.cover_image}
                                alt="Book cover"
                                className="w-16 h-24 object-cover rounded"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-2">{fetchedData.title}</h4>
                            <p className="text-sm text-muted-foreground">{fetchedData.author}</p>
                            {fetchedData.publisher && (
                                <p className="text-xs text-muted-foreground">
                                    {fetchedData.publisher}
                                    {fetchedData.publication_year && ` (${fetchedData.publication_year})`}
                                </p>
                            )}
                            {fetchedData.total_pages && (
                                <p className="text-xs text-muted-foreground">
                                    {fetchedData.total_pages} pages
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={applyFetchedData}
                            className="flex-1"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Use This Data
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setFetchedData(null)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Camera Dialog */}
            <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Scan ISBN Barcode</DialogTitle>
                    </DialogHeader>
                    <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3/4 h-16 border-2 border-primary border-dashed rounded-lg" />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                        Position the barcode within the frame
                    </p>
                    <Button onClick={stopCamera} variant="outline">
                        Cancel
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}
