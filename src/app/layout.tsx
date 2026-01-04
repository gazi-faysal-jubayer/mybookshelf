import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";

import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
    title: "My Bookshelf",
    description: "Personal Book Lending Management System",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn("min-h-screen bg-background font-sans antialiased")}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <NextTopLoader showSpinner={false} color="#EAB308" />
                    {children}
                    <Analytics />
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
