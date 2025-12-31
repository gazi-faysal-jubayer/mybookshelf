"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createBorrowRequest } from "@/app/actions/borrow"
import { getOrCreateConversation } from "@/app/actions/messaging"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { HandshakeIcon, Loader2, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface BorrowBookButtonProps {
    bookId: string
    ownerId: string
    isAvailable: boolean
    depositRequired?: boolean
    depositAmount?: number
}

export function BorrowBookButton({
    bookId,
    ownerId,
    isAvailable,
    depositRequired = false,
    depositAmount = 0
}: BorrowBookButtonProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)
    
    const [duration, setDuration] = useState("14")
    const [exchangeMethod, setExchangeMethod] = useState<"meetup" | "mail">("meetup")
    const [message, setMessage] = useState("")
    const [urgency, setUrgency] = useState<"casual" | "soon" | "urgent">("casual")

    const handleSubmit = () => {
        startTransition(async () => {
            try {
                const { requestId } = await createBorrowRequest({
                    bookId,
                    ownerId,
                    proposedDuration: parseInt(duration),
                    exchangeMethod,
                    message: message || undefined,
                    urgency
                })

                toast.success("Borrow request sent!", {
                    description: "The owner will be notified and can respond to your request."
                })
                setOpen(false)
                router.refresh()
            } catch (error: any) {
                toast.error(error.message)
            }
        })
    }

    const handleMessageOwner = () => {
        startTransition(async () => {
            try {
                const { conversationId } = await getOrCreateConversation(ownerId)
                router.push(`/dashboard/messages/${conversationId}`)
            } catch (error: any) {
                toast.error(error.message)
            }
        })
    }

    if (!isAvailable) {
        return (
            <Button variant="outline" disabled>
                Not Available
            </Button>
        )
    }

    return (
        <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="flex-1">
                        <HandshakeIcon className="h-4 w-4 mr-2" />
                        Request to Borrow
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Request to Borrow</DialogTitle>
                        <DialogDescription>
                            Fill in the details for your borrow request. The owner will review and respond.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Duration */}
                        <div className="space-y-2">
                            <Label>How long do you need it?</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">1 week</SelectItem>
                                    <SelectItem value="14">2 weeks</SelectItem>
                                    <SelectItem value="21">3 weeks</SelectItem>
                                    <SelectItem value="30">1 month</SelectItem>
                                    <SelectItem value="60">2 months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Exchange Method */}
                        <div className="space-y-2">
                            <Label>Exchange method</Label>
                            <RadioGroup 
                                value={exchangeMethod} 
                                onValueChange={(v) => setExchangeMethod(v as any)}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="meetup" id="meetup" />
                                    <Label htmlFor="meetup" className="font-normal cursor-pointer">
                                        In-person meetup
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="mail" id="mail" />
                                    <Label htmlFor="mail" className="font-normal cursor-pointer">
                                        Mail/Delivery
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Urgency */}
                        <div className="space-y-2">
                            <Label>How soon do you need it?</Label>
                            <RadioGroup 
                                value={urgency} 
                                onValueChange={(v) => setUrgency(v as any)}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="casual" id="casual" />
                                    <Label htmlFor="casual" className="font-normal cursor-pointer">
                                        No rush
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="soon" id="soon" />
                                    <Label htmlFor="soon" className="font-normal cursor-pointer">
                                        Within a week
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="urgent" id="urgent" />
                                    <Label htmlFor="urgent" className="font-normal cursor-pointer">
                                        ASAP
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <Label>Message to owner (optional)</Label>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Introduce yourself, explain why you want to borrow this book..."
                                rows={3}
                            />
                        </div>

                        {/* Deposit Notice */}
                        {depositRequired && depositAmount > 0 && (
                            <div className="bg-muted p-3 rounded-lg text-sm">
                                <p className="font-medium">Deposit Required</p>
                                <p className="text-muted-foreground">
                                    The owner requires a ${depositAmount.toFixed(2)} deposit, 
                                    refundable upon return.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Request"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button 
                variant="outline" 
                size="icon"
                onClick={handleMessageOwner}
                disabled={isPending}
                title="Message Owner"
            >
                <MessageSquare className="h-4 w-4" />
            </Button>
        </div>
    )
}
