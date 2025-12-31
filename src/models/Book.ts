import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBook extends Document {
    user_id: mongoose.Types.ObjectId;
    title: string;
    author: string;
    isbn?: string;
    publisher?: string;
    publication_year?: number;
    pages?: number;
    language?: string;
    genre: string[];
    cover_image?: string;
    description?: string;
    format?: "hardcover" | "paperback" | "ebook" | "audiobook";
    condition?: string;
    purchase_info?: {
        date?: Date;
        price?: number;
        location?: string;
        currency?: string;
        link?: string;
    };
    borrowed_info?: {
        owner_name?: string;
        borrow_date?: Date;
        due_date?: Date;
        return_date?: Date;
    };
    ownership_status: "owned" | "borrowed_from_others" | "wishlist" | "sold" | "lost";
    reading_status: "to_read" | "currently_reading" | "completed" | "abandoned";
    lending_status: "available" | "lent_out" | "reserved";
    rating?: number;
    review?: string;
    tags: string[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const BookSchema: Schema<IBook> = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true, index: true },
        author: { type: String, required: true, index: true },
        isbn: { type: String },
        publisher: { type: String },
        publication_year: { type: Number },
        pages: { type: Number },
        language: { type: String },
        genre: [{ type: String }],
        cover_image: { type: String },
        description: { type: String },
        format: {
            type: String,
            enum: ["hardcover", "paperback", "ebook", "audiobook"],
            default: "paperback"
        },
        condition: { type: String },
        purchase_info: {
            date: { type: Date },
            price: { type: Number },
            location: { type: String },
            currency: { type: String, default: "USD" },
            link: { type: String },
        },
        borrowed_info: {
            owner_name: { type: String },
            borrow_date: { type: Date },
            due_date: { type: Date },
            return_date: { type: Date },
        },
        ownership_status: {
            type: String,
            enum: ["owned", "borrowed_from_others", "wishlist", "sold", "lost"],
            default: "owned"
        },
        reading_status: {
            type: String,
            enum: ["to_read", "currently_reading", "completed", "abandoned"],
            default: "to_read"
        },
        lending_status: {
            type: String,
            enum: ["available", "lent_out", "reserved"],
            default: "available"
        },
        rating: { type: Number, min: 0, max: 5 },
        review: { type: String },
        tags: [{ type: String }],
        notes: { type: String },
    },
    {
        timestamps: true,
    }
);

// Indexes for search performance
BookSchema.index({ title: "text", author: "text", description: "text" });
BookSchema.index({ user_id: 1, ownership_status: 1 });
BookSchema.index({ user_id: 1, reading_status: 1 });

const Book: Model<IBook> = mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

export default Book;
