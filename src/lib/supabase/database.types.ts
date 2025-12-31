export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string | null
          profile_picture: string | null
          bio: string | null
          location: string | null
          favorite_genre: string | null
          email_notifications: boolean
          dark_mode: boolean
          language: string
          default_lending_period: number
          yearly_goal: number
          current_year_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          full_name?: string | null
          profile_picture?: string | null
          bio?: string | null
          location?: string | null
          favorite_genre?: string | null
          email_notifications?: boolean
          dark_mode?: boolean
          language?: string
          default_lending_period?: number
          yearly_goal?: number
          current_year_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string | null
          profile_picture?: string | null
          bio?: string | null
          location?: string | null
          favorite_genre?: string | null
          email_notifications?: boolean
          dark_mode?: boolean
          language?: string
          default_lending_period?: number
          yearly_goal?: number
          current_year_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string
          isbn: string | null
          publisher: string | null
          publication_year: number | null
          pages: number | null
          language: string | null
          genre: string[]
          cover_image: string | null
          description: string | null
          format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook'
          condition: string | null
          purchase_date: string | null
          purchase_price: number | null
          purchase_location: string | null
          purchase_currency: string
          purchase_link: string | null
          borrowed_owner_name: string | null
          borrowed_borrow_date: string | null
          borrowed_due_date: string | null
          borrowed_return_date: string | null
          ownership_status: 'owned' | 'borrowed_from_others' | 'wishlist' | 'sold' | 'lost'
          reading_status: 'to_read' | 'currently_reading' | 'completed' | 'abandoned'
          lending_status: 'available' | 'lent_out' | 'reserved'
          rating: number | null
          review: string | null
          tags: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          author: string
          isbn?: string | null
          publisher?: string | null
          publication_year?: number | null
          pages?: number | null
          language?: string | null
          genre?: string[]
          cover_image?: string | null
          description?: string | null
          format?: 'hardcover' | 'paperback' | 'ebook' | 'audiobook'
          condition?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_location?: string | null
          purchase_currency?: string
          purchase_link?: string | null
          borrowed_owner_name?: string | null
          borrowed_borrow_date?: string | null
          borrowed_due_date?: string | null
          borrowed_return_date?: string | null
          ownership_status?: 'owned' | 'borrowed_from_others' | 'wishlist' | 'sold' | 'lost'
          reading_status?: 'to_read' | 'currently_reading' | 'completed' | 'abandoned'
          lending_status?: 'available' | 'lent_out' | 'reserved'
          rating?: number | null
          review?: string | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          author?: string
          isbn?: string | null
          publisher?: string | null
          publication_year?: number | null
          pages?: number | null
          language?: string | null
          genre?: string[]
          cover_image?: string | null
          description?: string | null
          format?: 'hardcover' | 'paperback' | 'ebook' | 'audiobook'
          condition?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_location?: string | null
          purchase_currency?: string
          purchase_link?: string | null
          borrowed_owner_name?: string | null
          borrowed_borrow_date?: string | null
          borrowed_due_date?: string | null
          borrowed_return_date?: string | null
          ownership_status?: 'owned' | 'borrowed_from_others' | 'wishlist' | 'sold' | 'lost'
          reading_status?: 'to_read' | 'currently_reading' | 'completed' | 'abandoned'
          lending_status?: 'available' | 'lent_out' | 'reserved'
          rating?: number | null
          review?: string | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collection_books: {
        Row: {
          id: string
          collection_id: string
          book_id: string
          added_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          book_id: string
          added_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          book_id?: string
          added_at?: string
        }
      }
      lendings: {
        Row: {
          id: string
          book_id: string
          user_id: string
          borrower_name: string
          borrower_email: string | null
          borrow_date: string
          due_date: string | null
          return_date: string | null
          status: 'active' | 'returned'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          user_id: string
          borrower_name: string
          borrower_email?: string | null
          borrow_date?: string
          due_date?: string | null
          return_date?: string | null
          status?: 'active' | 'returned'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          user_id?: string
          borrower_name?: string
          borrower_email?: string | null
          borrow_date?: string
          due_date?: string | null
          return_date?: string | null
          status?: 'active' | 'returned'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'info' | 'success' | 'warning' | 'error'
          message: string
          is_read: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: 'info' | 'success' | 'warning' | 'error'
          message: string
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          message?: string
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      book_format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook'
      ownership_status: 'owned' | 'borrowed_from_others' | 'wishlist' | 'sold' | 'lost'
      reading_status: 'to_read' | 'currently_reading' | 'completed' | 'abandoned'
      lending_status: 'available' | 'lent_out' | 'reserved'
      lending_record_status: 'active' | 'returned'
      notification_type: 'info' | 'success' | 'warning' | 'error'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenience types
export type Profile = Tables<'profiles'>
export type Book = Tables<'books'>
export type Collection = Tables<'collections'>
export type CollectionBook = Tables<'collection_books'>
export type Lending = Tables<'lendings'>
export type Notification = Tables<'notifications'>
