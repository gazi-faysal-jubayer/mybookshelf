import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    email: string;
    username: string;
    password?: string;
    full_name?: string;
    profile_picture?: string;
    bio?: string;
    location?: string;
    favorite_genre?: string;
    preferences: {
        email_notifications: boolean;
        dark_mode: boolean;
        language: string;
        default_lending_period: number;
    };
    reading_goal: {
        yearly_goal: number;
        current_year_count: number;
    };
    email_verified: boolean;
    oauth_provider?: "google" | "github" | null;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password: {
            type: String,
            select: false // Do not return password by default
        },
        full_name: { type: String },
        profile_picture: { type: String },
        bio: { type: String },
        location: { type: String },
        favorite_genre: { type: String },
        preferences: {
            email_notifications: { type: Boolean, default: true },
            dark_mode: { type: Boolean, default: false },
            language: { type: String, default: "en" },
            default_lending_period: { type: Number, default: 14 },
        },
        reading_goal: {
            yearly_goal: { type: Number, default: 12 },
            current_year_count: { type: Number, default: 0 },
        },
        email_verified: { type: Boolean, default: false },
        oauth_provider: { type: String, enum: ["google", "github", null], default: null },
    },
    {
        timestamps: true, // handles createdAt and updatedAt
    }
);

// Prevent model overwrite upon initial compile
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
