"use client"

import { useState, useEffect } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { X, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploadProps {
    value?: string;
    onChange: (url?: string) => void;
    endpoint: "imageUploader";
}

export function ImageUpload({ value, onChange, endpoint }: ImageUploadProps) {
    // Prevent hydration mismatch by only rendering UploadButton on client
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (value) {
        return (
            <div className="relative flex items-center justify-center w-full h-48 border rounded-md overflow-hidden bg-muted/30">
                <Image
                    src={value}
                    alt="Uploaded image"
                    fill
                    className="object-contain"
                />
                <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    onClick={() => onChange("")}
                    type="button"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    // Show loading state until client mounts
    if (!isMounted) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md bg-muted/10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Loading uploader...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md bg-muted/10 hover:bg-muted/20 transition-colors">
            <UploadButton
                endpoint={endpoint}
                onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                        onChange(res[0].url);
                        toast.success("Image uploaded");
                    }
                }}
                onUploadError={(error: Error) => {
                    toast.error(`Upload failed: ${error.message}`);
                    console.error("Upload error:", error);
                }}
                appearance={{
                    button: "bg-primary text-primary-foreground hover:bg-primary/90 ut-uploading:cursor-not-allowed",
                    allowedContent: "text-muted-foreground"
                }}
            />
        </div>
    )
}
