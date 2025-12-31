"use client"

import { useState, useEffect, useRef } from "react";
import { X, ImageIcon, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
    value?: string;
    onChange: (url?: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Clear preview when value changes externally
    useEffect(() => {
        if (!value) {
            setPreview(null);
        }
    }, [value]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        // Validate file size (4MB max)
        if (file.size > 4 * 1024 * 1024) {
            toast.error("Image must be less than 4MB");
            return;
        }

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Upload to Supabase Storage
        setIsUploading(true);
        try {
            const supabase = createClient();
            
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to upload");
                setPreview(null);
                return;
            }

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            // Upload file
            const { data, error } = await supabase.storage
                .from('book-covers')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('book-covers')
                .getPublicUrl(data.path);

            onChange(urlData.publicUrl);
            toast.success("Image uploaded successfully");
        } catch (error: unknown) {
            console.error("Upload error:", error);
            const errorMessage = error instanceof Error ? error.message : "Upload failed";
            toast.error(errorMessage);
            setPreview(null);
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        onChange("");
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const displayImage = value || preview;

    if (displayImage) {
        return (
            <div className="relative flex items-center justify-center w-full h-48 border rounded-md overflow-hidden bg-muted/30">
                <Image
                    src={displayImage}
                    alt="Uploaded image"
                    fill
                    className="object-contain"
                />
                {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
                <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    onClick={handleRemove}
                    type="button"
                    disabled={isUploading}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div 
            className="flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
            {isUploading ? (
                <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                </>
            ) : (
                <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium mt-2">Choose File</p>
                    <p className="text-xs text-muted-foreground mt-1">Image (4MB)</p>
                </>
            )}
        </div>
    )
}
