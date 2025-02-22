export const publicRoutes = [
    "/" // Home page
];

export const authRoutes = [
    "/login",
    "/register",
    "/error"
];

export const protectedRoutes = [
    "/protected/events/create" // Only allow logged-in users to access this route
];

export const apiAuthPrefix = "/api";
export const DEFAULT_LOGIN_REDIRECT = "/"; // Redirect users after login
