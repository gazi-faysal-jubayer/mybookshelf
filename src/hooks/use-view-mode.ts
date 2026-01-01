"use client"

import { useLocalStorage } from "./use-local-storage"

export type ViewMode = "grid" | "list"

export function useViewMode() {
    return useLocalStorage<ViewMode>("bookshelf-view-mode", "grid")
}
