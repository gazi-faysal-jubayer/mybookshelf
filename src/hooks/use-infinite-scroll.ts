"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseInfiniteScrollOptions<T> {
    fetchFn: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string }>
    initialData?: T[]
    initialCursor?: string
}

interface UseInfiniteScrollResult<T> {
    items: T[]
    isLoading: boolean
    isLoadingMore: boolean
    hasMore: boolean
    loadMore: () => Promise<void>
    refresh: () => Promise<void>
    setItems: React.Dispatch<React.SetStateAction<T[]>>
    sentinelRef: (node: HTMLElement | null) => void
}

export function useInfiniteScroll<T>({
    fetchFn,
    initialData = [],
    initialCursor,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
    const [items, setItems] = useState<T[]>(initialData)
    const [cursor, setCursor] = useState<string | undefined>(initialCursor)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(!!initialCursor)

    const observerRef = useRef<IntersectionObserver | null>(null)
    const sentinelRef = useRef<HTMLElement | null>(null)

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return

        setIsLoadingMore(true)
        try {
            const { data, nextCursor } = await fetchFn(cursor)
            setItems(prev => [...prev, ...data])
            setCursor(nextCursor)
            setHasMore(!!nextCursor)
        } catch (error) {
            console.error("Failed to load more:", error)
        } finally {
            setIsLoadingMore(false)
        }
    }, [cursor, fetchFn, hasMore, isLoadingMore])

    const refresh = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, nextCursor } = await fetchFn(undefined)
            setItems(data)
            setCursor(nextCursor)
            setHasMore(!!nextCursor)
        } catch (error) {
            console.error("Failed to refresh:", error)
        } finally {
            setIsLoading(false)
        }
    }, [fetchFn])

    // Intersection Observer callback
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
            loadMore()
        }
    }, [hasMore, isLoadingMore, loadMore])

    // Set up observer
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        observerRef.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '100px',
            threshold: 0,
        })

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [handleObserver])

    // Callback ref for the sentinel element
    const setSentinelRef = useCallback((node: HTMLElement | null) => {
        if (sentinelRef.current && observerRef.current) {
            observerRef.current.unobserve(sentinelRef.current)
        }

        sentinelRef.current = node

        if (node && observerRef.current) {
            observerRef.current.observe(node)
        }
    }, [])

    return {
        items,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
        refresh,
        setItems,
        sentinelRef: setSentinelRef,
    }
}
