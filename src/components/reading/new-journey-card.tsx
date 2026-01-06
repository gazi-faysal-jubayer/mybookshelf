"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"

interface NewJourneyCardProps {
    onClick: () => void
}

export function NewJourneyCard({ onClick }: NewJourneyCardProps) {
    return (
        <Card
            onClick={onClick}
            className="flex-shrink-0 w-[280px] md:w-[240px] lg:w-[260px] h-[200px] cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/50 transition-all group"
        >
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <div className="rounded-full bg-primary/10 p-4 mb-3 group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-center">New Journey</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                    Start a fresh reading
                </p>
            </CardContent>
        </Card>
    )
}
