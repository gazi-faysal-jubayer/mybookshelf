"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Globe, Users } from "lucide-react"

interface FeedToggleProps {
    value: 'global' | 'connections'
    onChange: (value: 'global' | 'connections') => void
}

export function FeedToggle({ value, onChange }: FeedToggleProps) {
    return (
        <ToggleGroup
            type="single"
            value={value}
            onValueChange={(v) => v && onChange(v as 'global' | 'connections')}
            className="justify-start"
        >
            <ToggleGroupItem value="global" className="gap-1.5">
                <Globe className="h-4 w-4" />
                Global
            </ToggleGroupItem>
            <ToggleGroupItem value="connections" className="gap-1.5">
                <Users className="h-4 w-4" />
                Connections
            </ToggleGroupItem>
        </ToggleGroup>
    )
}
