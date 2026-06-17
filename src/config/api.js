export const API_BASE_URL = "/api";

export const getImageUrl = (path) => {
    if (!path) return "";

    let cleanPath = path;

    if (path.startsWith("http")) {
        if (path.includes("127.0.0.1") || path.includes("localhost")) {
            // Local URL cleanup
            const parts = path.split("public/");
            cleanPath = parts.length > 1 ? parts[1] : path.split("/").pop();
        } else {
            return path;
        }
    }

    // Normalize path
    cleanPath = cleanPath.replace(/^\/+/, "");
    if (cleanPath.startsWith("public/")) {
        cleanPath = cleanPath.replace("public/", "storage/");
    } else if (!cleanPath.startsWith("storage/") && !cleanPath.includes("/")) {
        // If it's just a filename, assume it's in storage
        cleanPath = `storage/${cleanPath}`;
    }

    // We'll use /api as prefix for images too, so they go through Vercel rewrite
    // If the backend has images at /storage, the rewrite in vercel.json will handle it
    // if we add a rewrite for /api/storage/ or just /storage/
    return `/api/${cleanPath}`;
};
