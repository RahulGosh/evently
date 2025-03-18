export const publicRoutes = [
    "/",
    "/events/", // Base route
    "/events/:id", // Dynamic route
    "/protected/employer/events",
    "/protected/employer/events:id"
];

export const authRoutes= [
    "/login",
    "/register",
    "/error"
]

export const apiAuthPrefix = "/api/auth"

export const DEFAULT_LOGIN_REDIRECT = "/"