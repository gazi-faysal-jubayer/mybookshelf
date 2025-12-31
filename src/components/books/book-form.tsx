"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ImageUpload } from "@/components/upload/image-upload"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
// import { toast } from "@/components/ui/use-toast"
import { toast } from "sonner"
import { addBook, updateBook } from "@/app/actions/book"
import { useRouter } from "next/navigation"

const bookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author is required"),
    isbn: z.string().optional(),
    publisher: z.string().optional(),
    publication_year: z.coerce.number().min(868, "Year seems too old").max(new Date().getFullYear() + 5, "Year cannot be in the future").optional(),
    cover_image: z.string().optional(),
    genre: z.string().optional(), // In a real app, this should be an array
    format: z.enum(["hardcover", "paperback", "ebook", "audiobook"]),
    ownership_status: z.enum(["owned", "borrowed_from_others", "wishlist", "sold", "lost"]),
    reading_status: z.enum(["to_read", "currently_reading", "completed", "abandoned"]),
    rating: z.coerce.number().min(0).max(5).optional(),
    review: z.string().optional(),
    borrowed_info: z.object({
        owner_name: z.string().optional(),
        borrow_date: z.date().optional(),
        due_date: z.date().optional(),
    }).optional(),
    purchase_info: z.object({
        date: z.date().optional(),
        price: z.coerce.number().optional(),
        location: z.string().optional(),
        currency: z.string().optional(),
        link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    }).optional(),
})

type BookFormValues = z.infer<typeof bookSchema>

const defaultValues: Partial<BookFormValues> = {
    format: "paperback",
    ownership_status: "owned",
    reading_status: "to_read",
}

interface BookFormProps {
    initialData?: any
    bookId?: string
}

export function BookForm({ initialData, bookId }: BookFormProps) {
    const router = useRouter()
    const form = useForm<BookFormValues>({
        resolver: zodResolver(bookSchema) as any,
        defaultValues: initialData || defaultValues,
    })

    async function onSubmit(data: BookFormValues) {
        try {
            if (initialData && bookId) {
                await updateBook(bookId, data)
                toast.success("Book updated successfully")
            } else {
                await addBook(data)
                toast.success("Book added successfully")
            }
            router.push("/dashboard")
            router.refresh()
        } catch (error) {
            toast.error("Failed to save book")
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="cover_image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cover Image</FormLabel>
                            <FormControl>
                                <div className="max-w-[200px]">
                                    <ImageUpload
                                        value={field.value}
                                        onChange={field.onChange}
                                        endpoint="imageUploader"
                                    />
                                </div>
                            </FormControl>
                            <FormDescription>
                                Upload a cover image.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="The Great Gatsby" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="author"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Author</FormLabel>
                                <FormControl>
                                    <Input placeholder="F. Scott Fitzgerald" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isbn"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ISBN</FormLabel>
                                <FormControl>
                                    <Input placeholder="978-3-16-148410-0" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="publisher"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Publisher</FormLabel>
                                <FormControl>
                                    <Input placeholder="Scribner" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="format"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Format</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a format" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="hardcover">Hardcover</SelectItem>
                                        <SelectItem value="paperback">Paperback</SelectItem>
                                        <SelectItem value="ebook">E-Book</SelectItem>
                                        <SelectItem value="audiobook">Audiobook</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ownership_status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="owned">Owned</SelectItem>
                                        <SelectItem value="wishlist">Wishlist</SelectItem>
                                        <SelectItem value="borrowed_from_others">Borrowed</SelectItem>
                                        <SelectItem value="sold">Sold</SelectItem>
                                        <SelectItem value="lost">Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="reading_status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reading Progress</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select progress" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="to_read">To Read</SelectItem>
                                        <SelectItem value="currently_reading">Currently Reading</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="abandoned">Abandoned</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {form.watch("ownership_status") === "borrowed_from_others" && (
                    <div className="grid gap-4 md:grid-cols-3 p-4 border rounded-md bg-muted/50 mb-4">
                        <FormField
                            control={form.control}
                            name="borrowed_info.owner_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Owner Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="borrowed_info.borrow_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Borrowed Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="borrowed_info.due_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Due Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}



                {form.watch("ownership_status") === "wishlist" && (
                    <div className="grid gap-4 md:grid-cols-1 p-4 border rounded-md bg-muted/50 mb-4">
                        <FormField
                            control={form.control}
                            name="purchase_info.link"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Purchase Link</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://amazon.com/..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="review"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Review / Notes</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us what you thought about the book..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">{initialData ? "Update Book" : "Add Book"}</Button>
            </form>
        </Form>
    )
}
