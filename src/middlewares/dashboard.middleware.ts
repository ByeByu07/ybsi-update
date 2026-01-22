import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth"
import { redirect } from "@tanstack/react-router";

export const privateDashboardMiddleware = createMiddleware().server(async ({ next, request }) => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({headers});
    

    if (!session) {
        throw redirect({ to: "/auth/signin"});
    }

    return next();
})