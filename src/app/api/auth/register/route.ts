import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    username: email.split("@")[0] + Math.floor(Math.random() * 1000),
                }
            }
        })

        if (error) {
            if (error.message.includes("already registered")) {
                return NextResponse.json(
                    { message: "User already exists" },
                    { status: 409 }
                )
            }
            return NextResponse.json(
                { message: error.message },
                { status: 400 }
            )
        }

        // Create welcome notification if user was created
        if (data.user) {
            await supabase.from('notifications').insert({
                user_id: data.user.id,
                type: 'info',
                message: 'Welcome to My Bookshelf! Start tracking your reading journey.'
            })
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
