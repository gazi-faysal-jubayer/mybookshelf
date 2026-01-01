"use client"

import { useState, useEffect, useRef } from "react";
import { X, ImageIcon, Loader2, Upload, Camera } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
    value?: string;
    onChange: (url?: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
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

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("Could not access camera");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const context = canvasRef.current.getContext('2d');
        if (!context) return;

        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        // Draw video frame to canvas
        context.drawImage(videoRef.current, 0, 0);

        // Convert to blob/file
        canvasRef.current.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

            // Re-use existing upload logic
            // Create a fake event object to reuse handleFileSelect or just extract the logic
            // For simplicity, let's extract the core logic or just mock the event
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            // Create a synthetic event
            const event = {
                target: {
                    files: dataTransfer.files
                }
            } as unknown as React.ChangeEvent<HTMLInputElement>;

            handleFileSelect(event);
            stopCamera();
        }, 'image/jpeg');
    };

    // Clean up stream on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

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
        <div className="flex gap-4 items-start">
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

            <Dialog open={isCameraOpen} onOpenChange={(open) => {
                setIsCameraOpen(open);
                if (open) startCamera();
                else stopCamera();
            }}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-48 flex flex-col gap-2 px-8" type="button">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        Capture
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Take Photo</DialogTitle>
                    </DialogHeader>
                    <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCameraOpen(false)}>Cancel</Button>
                        <Button onClick={captureImage}>Capture & Upload</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
