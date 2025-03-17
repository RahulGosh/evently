export const publicRoutes = [
    "/",
    "/events/", // Base route
    "/events/:id", // Dynamic route
];

export const authRoutes= [
    "/login",
    "/register",
    "/error"
]

export const apiAuthPrefix = "/api/auth"

export const DEFAULT_LOGIN_REDIRECT = "/"