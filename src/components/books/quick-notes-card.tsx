"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InlineEdit } from "@/components/ui/inline-edit"
import { updateBook } from "@/app/actions/book"
import { useRouter } from "next/navigation"
import { PenLine } from "lucide-react"

interface QuickNotesCardProps {
    bookId: string
    notes: string | null | undefined
}

export function QuickNotesCard({ bookId, notes }: QuickNotesCardProps) {
    const router = useRouter()

    const handleSave = async (value: string) => {
        await updateBook(bookId, { notes: value })
        router.refresh()
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Quick Notes
                    <PenLine className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground min-h-[60px]">
                    <InlineEdit
                        value={notes}
                        onSave={handleSave}
                        type="textarea"
                        label="notes"
                        className="items-start"
                        inputClassName="min-h-[80px] w-full text-sm"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
