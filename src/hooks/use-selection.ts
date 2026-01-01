"use client"

import { useState, useCallback } from "react"

export function useSelection<T extends string>(items: { id: T }[]) {
    const [selected, setSelected] = useState<Set<T>>(new Set())

    const toggleItem = useCallback((id: T) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])

    const toggleAll = useCallback(() => {
        setSelected((prev) => {
            if (prev.size === items.length) {
                return new Set()
            }
            return new Set(items.map((item) => item.id))
        })
    }, [items])

    const clear = useCallback(() => {
        setSelected(new Set())
    }, [])

    const isSelected = useCallback((id: T) => {
        return selected.has(id)
    }, [selected])

    const isAllSelected = items.length > 0 && selected.size === items.length
    const isSomeSelected = selected.size > 0 && selected.size < items.length

    return {
        selected,
        selectedArray: Array.from(selected),
        selectedCount: selected.size,
        toggleItem,
        toggleAll,
        clear,
        isSelected,
        isAllSelected,
        isSomeSelected,
    }
}
