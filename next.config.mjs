/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["mongoose", "bcryptjs"],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: 'covers.openlibrary.org',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
};

export default nextConfig;
