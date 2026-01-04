import { NextRequest, NextResponse } from "next/server"

interface BookData {
    title?: string
    subtitle?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    pageCount?: number
    categories?: string[]
    coverImage?: string
    isbn10?: string
    isbn13?: string
    language?: string
}

// Fetch from Open Library API (free, no API key needed)
async function fetchFromOpenLibrary(isbn: string): Promise<BookData | null> {
    try {
        const response = await fetch(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
            { next: { revalidate: 86400 } } // Cache for 24 hours
        )

        if (!response.ok) return null

        const data = await response.json()
        const bookData = data[`ISBN:${isbn}`]

        if (!bookData) return null

        return {
            title: bookData.title,
            subtitle: bookData.subtitle,
            authors: bookData.authors?.map((a: { name: string }) => a.name),
            publisher: bookData.publishers?.[0]?.name,
            publishedDate: bookData.publish_date,
            description: bookData.notes || bookData.excerpts?.[0]?.text,
            pageCount: bookData.number_of_pages,
            categories: bookData.subjects?.map((s: { name: string }) => s.name).slice(0, 5),
            coverImage: bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small,
            language: bookData.languages?.[0]?.name,
        }
    } catch (error) {
        console.error("Open Library API error:", error)
        return null
    }
}

// Fetch from Google Books API (fallback)
async function fetchFromGoogleBooks(isbn: string): Promise<BookData | null> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
            { next: { revalidate: 86400 } }
        )

        if (!response.ok) return null

        const data = await response.json()

        if (!data.items || data.items.length === 0) return null

        const volumeInfo = data.items[0].volumeInfo

        // Get industry identifiers
        const identifiers = volumeInfo.industryIdentifiers || []
        const isbn10 = identifiers.find((id: any) => id.type === "ISBN_10")?.identifier
        const isbn13 = identifiers.find((id: any) => id.type === "ISBN_13")?.identifier

        return {
            title: volumeInfo.title,
            subtitle: volumeInfo.subtitle,
            authors: volumeInfo.authors,
            publisher: volumeInfo.publisher,
            publishedDate: volumeInfo.publishedDate,
            description: volumeInfo.description,
            pageCount: volumeInfo.pageCount,
            categories: volumeInfo.categories,
            coverImage: volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
            isbn10,
            isbn13,
            language: volumeInfo.language,
        }
    } catch (error) {
        console.error("Google Books API error:", error)
        return null
    }
}

// Validate ISBN format
function isValidISBN(isbn: string): boolean {
    // Remove hyphens and spaces
    const cleanISBN = isbn.replace(/[-\s]/g, "")

    // Check if it's ISBN-10 or ISBN-13
    if (cleanISBN.length === 10) {
        // ISBN-10 validation
        let sum = 0
        for (let i = 0; i < 9; i++) {
            const digit = parseInt(cleanISBN[i], 10)
            if (isNaN(digit)) return false
            sum += digit * (10 - i)
        }
        const lastChar = cleanISBN[9].toUpperCase()
        const lastDigit = lastChar === "X" ? 10 : parseInt(lastChar, 10)
        if (isNaN(lastDigit) && lastChar !== "X") return false
        sum += lastDigit
        return sum % 11 === 0
    } else if (cleanISBN.length === 13) {
        // ISBN-13 validation
        let sum = 0
        for (let i = 0; i < 13; i++) {
            const digit = parseInt(cleanISBN[i], 10)
            if (isNaN(digit)) return false
            sum += digit * (i % 2 === 0 ? 1 : 3)
        }
        return sum % 10 === 0
    }

    return false
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const isbn = searchParams.get("isbn")

    if (!isbn) {
        return NextResponse.json(
            { error: "ISBN parameter is required" },
            { status: 400 }
        )
    }

    // Clean ISBN
    const cleanISBN = isbn.replace(/[-\s]/g, "")

    // Validate ISBN
    if (!isValidISBN(cleanISBN)) {
        return NextResponse.json(
            { error: "Invalid ISBN format" },
            { status: 400 }
        )
    }

    // Try Open Library first
    let bookData = await fetchFromOpenLibrary(cleanISBN)

    // If not found, try Google Books
    if (!bookData) {
        bookData = await fetchFromGoogleBooks(cleanISBN)
    }

    if (!bookData) {
        return NextResponse.json(
            { error: "Book not found with this ISBN" },
            { status: 404 }
        )
    }

    // Extract year from published date
    let publicationYear: number | undefined
    if (bookData.publishedDate) {
        const yearMatch = bookData.publishedDate.match(/\d{4}/)
        if (yearMatch) {
            publicationYear = parseInt(yearMatch[0], 10)
        }
    }

    // Return normalized data
    return NextResponse.json({
        success: true,
        data: {
            title: bookData.title || "",
            author: bookData.authors?.join(", ") || "",
            isbn: cleanISBN,
            publisher: bookData.publisher || "",
            publication_year: publicationYear,
            total_pages: bookData.pageCount,
            description: bookData.description || "",
            genre: bookData.categories?.[0] || "",
            cover_image: bookData.coverImage || "",
            language: bookData.language || "",
        },
    })
}
