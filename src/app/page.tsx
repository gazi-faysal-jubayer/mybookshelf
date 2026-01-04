import Link from "next/link";
import NextImage from "next/image";
import { BookOpen, Library, Users, Heart, ArrowRight, Star, BookMarked, Sparkles, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <BookOpen className="h-8 w-8 text-primary" />
                            <span className="text-xl font-semibold">MyBookshelf</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="#features" className="text-muted-foreground hover:text-foreground link-underline transition-colors">
                                Features
                            </Link>
                            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground link-underline transition-colors">
                                How it Works
                            </Link>
                            <Link href="#testimonials" className="text-muted-foreground hover:text-foreground link-underline transition-colors">
                                Testimonials
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            {/* Desktop Auth Buttons */}
                            <Link
                                href="/login"
                                className="hidden sm:block text-foreground hover:text-primary transition-colors font-medium"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="hidden sm:block btn-warm text-sm"
                            >
                                Get Started
                            </Link>

                            {/* Mobile Menu */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden">
                                        <Menu className="h-6 w-6" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                                    <nav className="flex flex-col gap-4 mt-8">
                                        <SheetClose asChild>
                                            <Link href="#features" className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-muted transition-colors">
                                                Features
                                            </Link>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Link href="#how-it-works" className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-muted transition-colors">
                                                How it Works
                                            </Link>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Link href="#testimonials" className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-muted transition-colors">
                                                Testimonials
                                            </Link>
                                        </SheetClose>
                                        <div className="border-t border-border my-4" />
                                        <SheetClose asChild>
                                            <Link href="/login" className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-muted transition-colors">
                                                Sign In
                                            </Link>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Link href="/register" className="btn-warm text-center">
                                                Get Started
                                            </Link>
                                        </SheetClose>
                                        <div className="border-t border-border my-4" />
                                        <div className="flex items-center justify-between px-4">
                                            <span className="text-sm text-muted-foreground">Theme</span>
                                            <ThemeToggle />
                                        </div>
                                    </nav>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-pattern pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Decorative elements - Background */}
                <div className="absolute top-20 left-10 opacity-60 animate-pulse-slow">
                    <NextImage src="/assets/decorations/decoration_squiggle.png" alt="" width={100} height={100} className="w-24 h-auto text-primary/20" />
                </div>
                <div className="absolute top-40 right-20 opacity-40">
                    <NextImage src="/assets/decorations/decoration_dots_cluster.png" alt="" width={60} height={60} className="w-16 h-auto" />
                </div>
                <div className="absolute bottom-10 left-1/4 opacity-30">
                    <NextImage src="/assets/decorations/decoration_curl.png" alt="" width={120} height={40} className="w-32 h-auto" />
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl -z-10" />


                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 animate-fade-in relative">
                            {/* Tiny sparkle near text */}
                            <div className="absolute -top-6 -left-6 opacity-50 hidden sm:block">
                                <NextImage src="/assets/decorations/decoration_sparkle.png" alt="" width={40} height={40} />
                            </div>

                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                                <Sparkles className="h-4 w-4" />
                                Your Personal Library, Reimagined
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                                Organize Your <span className="text-primary relative inline-block">
                                    Books
                                    <span className="absolute -bottom-2 left-0 w-full h-3 bg-primary/20 -rotate-1 rounded-full"></span>
                                </span> with Warmth & Care
                            </h1>

                            <p className="text-lg text-muted-foreground max-w-lg relative">
                                Create your cozy digital library, track your reading journey,
                                lend books to friends, and discover your next favorite read.
                                All in one beautiful place.
                                <span className="absolute -right-8 top-0 opacity-40 hidden sm:block">
                                    <NextImage src="/assets/decorations/decoration_leaf.png" alt="" width={30} height={30} />
                                </span>
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Link href="/register" className="btn-warm inline-flex items-center gap-2">
                                    Start Your Library
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/login" className="btn-warm-outline inline-flex items-center gap-2">
                                    Sign In
                                </Link>
                            </div>

                            {/* Social proof */}
                            <div className="flex items-center gap-4 pt-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background flex items-center justify-center text-white text-xs font-medium"
                                        >
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-foreground">2,000+</span> book lovers already joined
                                </div>
                            </div>
                        </div>

                        {/* Hero illustration - Composition */}
                        <div className="relative h-[400px] lg:h-[500px] hidden lg:block">
                            {/* Central Illustration Composition */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float w-full max-w-md">
                                <div className="relative z-10">
                                    <NextImage
                                        src="/assets/illustrations/illustration_stack_of_books.png"
                                        alt="Stack of books"
                                        width={400}
                                        height={400}
                                        className="w-full h-auto drop-shadow-xl"
                                        priority
                                    />
                                </div>
                            </div>

                            {/* Floating decorative elements around the central image */}
                            <div className="absolute top-20 right-10 animate-float stagger-1 opacity-90">
                                <NextImage src="/assets/illustrations/illustration_coffee_cup.png" alt="Coffee" width={100} height={100} className="w-24 h-auto drop-shadow-md" />
                            </div>

                            <div className="absolute bottom-20 left-0 animate-float stagger-2 opacity-90">
                                <NextImage src="/assets/illustrations/illustration_reading_glasses.png" alt="Glasses" width={120} height={60} className="w-32 h-auto drop-shadow-md -rotate-12" />
                            </div>

                            <div className="absolute top-10 left-10 animate-pulse-slow opacity-60">
                                <NextImage src="/assets/decorations/decoration_heart_doodle.png" alt="Heart" width={50} height={50} />
                            </div>
                            <div className="absolute bottom-40 right-0 animate-pulse-slow opacity-60">
                                <NextImage src="/assets/decorations/decoration_star_doodle.png" alt="Star" width={60} height={60} />
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            Everything You Need for Your Library
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Simple, beautiful tools to manage your book collection and share your love of reading
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Library,
                                title: "Organize Your Collection",
                                description: "Catalog all your books with beautiful covers, custom collections, and smart categories. Your library, perfectly organized."
                            },
                            {
                                icon: Users,
                                title: "Lend to Friends",
                                description: "Keep track of who borrowed your books and when. Never lose a book again with our lending tracker."
                            },
                            {
                                icon: BookMarked,
                                title: "Track Your Reading",
                                description: "Mark books as reading, completed, or on your wishlist. See your reading progress at a glance."
                            },
                            {
                                icon: Heart,
                                title: "Create Wishlists",
                                description: "Keep a curated list of books you want to read. Get recommendations based on your tastes."
                            },
                            {
                                icon: Star,
                                title: "Rate & Review",
                                description: "Add your personal ratings and reviews. Remember what you loved about each book."
                            },
                            {
                                icon: Sparkles,
                                title: "Beautiful Design",
                                description: "A cozy, warm interface that makes managing your library a pleasure, not a chore."
                            }
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="cozy-card p-6 book-card-hover"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            Get Started in Minutes
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Three simple steps to your perfect digital library
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Create Your Account",
                                description: "Sign up for free and set up your personal bookshelf in seconds."
                            },
                            {
                                step: "02",
                                title: "Add Your Books",
                                description: "Search by title or ISBN, or manually add books with custom covers."
                            },
                            {
                                step: "03",
                                title: "Organize & Share",
                                description: "Create collections, track lending, and enjoy your beautifully organized library."
                            }
                        ].map((item, index) => (
                            <div key={index} className="relative text-center">
                                <div className="text-6xl font-bold text-primary/20 mb-4">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {item.description}
                                </p>
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                                        <ArrowRight className="h-6 w-6 text-primary/30" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            Loved by Book Enthusiasts
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "Finally, an app that feels as cozy as curling up with a good book. Love the warm design!",
                                author: "Sarah M.",
                                role: "Avid Reader"
                            },
                            {
                                quote: "I've tried many book apps, but this one actually makes organizing my library enjoyable.",
                                author: "James K.",
                                role: "Book Collector"
                            },
                            {
                                quote: "The lending tracker saved my friendships! No more awkward 'do you still have my book?' conversations.",
                                author: "Emily R.",
                                role: "Book Club Host"
                            }
                        ].map((testimonial, index) => (
                            <div key={index} className="cozy-card p-6">
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className="h-5 w-5 fill-primary text-primary" />
                                    ))}
                                </div>
                                <p className="text-foreground mb-4 italic">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>
                                <div>
                                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="cozy-card p-12 terracotta-gradient text-white">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Ready to Build Your Library?
                        </h2>
                        <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                            Join thousands of book lovers who have found their perfect way to organize,
                            track, and share their reading journey.
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-white/90 transition-colors"
                        >
                            Create Your Free Account
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-secondary/20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
                        {/* Logo & Description */}
                        <div className="text-center md:text-left">
                            <Link href="/" className="flex items-center gap-2 justify-center md:justify-start">
                                <BookOpen className="h-6 w-6 text-primary" />
                                <span className="font-semibold text-lg">MyBookshelf</span>
                            </Link>
                            <p className="text-sm text-muted-foreground mt-2">
                                Your cozy digital library companion.
                            </p>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                                Privacy
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                                Terms
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                                Contact
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                                About
                            </Link>
                        </div>

                        {/* Copyright */}
                        <div className="text-center md:text-right text-sm text-muted-foreground">
                            <p>© {new Date().getFullYear()} MyBookshelf.</p>
                            <p className="mt-1">Made with ❤️ for book lovers.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
