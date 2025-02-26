export const publicRoutes = [
    "/" // Home page
];

export const authRoutes = [
    "/login",
    "/register",
    "/error"
];

export const protectedRoutes = [
    "/protected/events/create",
];

// Routes accessible only by Admin users
// export const adminRoutes = [
//     "/protected/events/create",
//     "/protected/profile",
// ];

export const apiAuthPrefix = "/api";
export const DEFAULT_LOGIN_REDIRECT = "/"; // Redirect users after login
