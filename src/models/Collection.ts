import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICollection extends Document {
    user_id: mongoose.Types.ObjectId
    name: string
    description?: string
    books: mongoose.Types.ObjectId[]
    is_public: boolean
    createdAt: Date
    updatedAt: Date
}

const CollectionSchema: Schema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Collection name is required"],
            trim: true,
            maxlength: [50, "Name cannot be more than 50 characters"],
        },
        description: {
            type: String,
            maxlength: [500, "Description cannot be more than 500 characters"],
        },
        books: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Book",
            },
        ],
        is_public: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

// Prevent duplicate collection names for the same user
CollectionSchema.index({ user_id: 1, name: 1 }, { unique: true })

const Collection: Model<ICollection> =
    mongoose.models.Collection || mongoose.model<ICollection>("Collection", CollectionSchema)

export default Collection
