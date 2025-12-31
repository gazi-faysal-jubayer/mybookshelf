import mongoose, { Schema, Document, Model } from "mongoose"

export interface ILending extends Document {
    book_id: mongoose.Types.ObjectId
    user_id: mongoose.Types.ObjectId
    borrower_name: string
    borrower_email?: string
    borrow_date: Date
    due_date?: Date
    return_date?: Date
    status: "active" | "returned"
    notes?: string
    createdAt: Date
    updatedAt: Date
}

const LendingSchema: Schema<ILending> = new Schema(
    {
        book_id: { type: Schema.Types.ObjectId, ref: "Book", required: true },
        user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        borrower_name: { type: String, required: true },
        borrower_email: { type: String },
        borrow_date: { type: Date, default: Date.now },
        due_date: { type: Date },
        return_date: { type: Date },
        status: { type: String, enum: ["active", "returned"], default: "active" },
        notes: { type: String },
    },
    {
        timestamps: true,
    }
)

const Lending: Model<ILending> = mongoose.models.Lending || mongoose.model<ILending>("Lending", LendingSchema)

export default Lending
