import mongoose, { Schema, Document, Model } from "mongoose"

export interface INotification extends Document {
    user_id: mongoose.Types.ObjectId
    type: "info" | "success" | "warning" | "error"
    message: string
    is_read: boolean
    link?: string
    createdAt: Date
}

const NotificationSchema: Schema<INotification> = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
        message: { type: String, required: true },
        is_read: { type: Boolean, default: false },
        link: { type: String },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
)

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)

export default Notification
