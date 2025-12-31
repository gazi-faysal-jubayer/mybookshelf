import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import User from "@/models/User"
import connectDB from "@/lib/db"
import { createNotification } from "@/app/actions/notifications"

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            )
        }

        await connectDB()

        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const username = email.split("@")[0] + Math.floor(Math.random() * 1000)

        await User.create({
            full_name: name,
            username,
            email,
            password: hashedPassword,
        })

        // Create welcome notification
        // We need the user _id, but User.create returns the document if awaited?
        // Actually User.create returns the document(s).
        const newUser = await User.findOne({ email })
        if (newUser) {
            await createNotification(
                newUser._id.toString(),
                "info",
                "Welcome to My Bookshelf! Start tracking your reading journey."
            )
        }

        return NextResponse.json(
            { message: "User created successfully" },
            { status: 201 }
        )
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
