import { NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedRoutes = ["/system"];
const authPageRoutes = ["/login"];
const apiAuthPrefix = "/api/auth";

export default auth((req) => {
    const {nextUrl} = req;
    const isLoggedIn = !!req.auth;

    const path = nextUrl.pathname;
    const isApiAuthRoute = path.startsWith(apiAuthPrefix);
    const isProtectedRoute = protectedRoutes.some((route) =>
        path.startsWith(route)
    );    
    const isAuthPageRoute = authPageRoutes.includes(path);

    if (isApiAuthRoute) {
        return NextResponse.next();
    }

    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};