import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/auth`,
});

export const { useSession, signUp, signIn, signOut } = authClient; 
export type AuthClient = typeof authClient;