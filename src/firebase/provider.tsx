"use client";

import React, {
    createContext,
    useContext,
    type ReactNode,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { FirebaseApp } from "firebase/app";
import {
    type Auth,
    type User,
    onAuthStateChanged,
} from "firebase/auth";
import {
    type Firestore,
    doc,
    getDoc,
    setDoc,
} from "firebase/firestore";
import {
    usePathname,
    useRouter,
} from "next/navigation";

import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

interface FirebaseProviderProps {
    children: ReactNode;
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
}

interface UserAuthState {
    user: User | null;
    isUserLoading: boolean;
    userError: Error | null;
}

export interface FirebaseContextState
    extends UserAuthState {
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
}

export interface UserHookResult
    extends UserAuthState {}

export const FirebaseContext =
    createContext<FirebaseContextState | undefined>(
        undefined
    );

const PUBLIC_ROUTES = new Set([
    "/",
    "/login",
    "/signup",
    "/about",
    "/contact",
    "/onboarding-preview",
]);

function normalizePathname(pathname: string) {
    if (pathname === "/") {
        return "/";
    }

    return pathname.replace(/\/+$/, "");
}

async function createUserDocument(
    firestore: Firestore,
    user: User
) {
    const userDocRef = doc(
        firestore,
        "users",
        user.uid
    );

    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            displayName:
                user.displayName ||
                user.email?.split("@")[0],
            photoURL: user.photoURL,
            groupId: null,
            isAdmin: false,
        });
    }
}

export const FirebaseProvider: React.FC<
    FirebaseProviderProps
> = ({
    children,
    firebaseApp,
    firestore,
    auth,
}) => {
    const router = useRouter();
    const pathname = usePathname();

    const [userAuthState, setUserAuthState] =
        useState<UserAuthState>({
            user: null,
            isUserLoading: true,
            userError: null,
        });

    const normalizedPathname = useMemo(
        () => normalizePathname(pathname),
        [pathname]
    );

    const isPublicRoute =
        PUBLIC_ROUTES.has(normalizedPathname);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                if (user) {
                    void createUserDocument(
                        firestore,
                        user
                    ).catch((error) => {
                        console.error(
                            "Failed to create user document:",
                            error
                        );
                    });
                }

                setUserAuthState({
                    user,
                    isUserLoading: false,
                    userError: null,
                });
            },
            (error) => {
                console.error(
                    "FirebaseProvider: onAuthStateChanged error:",
                    error
                );

                setUserAuthState({
                    user: null,
                    isUserLoading: false,
                    userError: error,
                });
            }
        );

        return unsubscribe;
    }, [auth, firestore]);

    useEffect(() => {
        if (userAuthState.isUserLoading) {
            return;
        }

        /*
         * Login and signup are intentionally allowed even when
         * another Firebase account is still signed in. This lets
         * the user switch account or create a new account instead
         * of being forced back to /dashboard.
         */
        if (
            !userAuthState.user &&
            !isPublicRoute
        ) {
            router.replace("/login");
        }
    }, [
        userAuthState.user,
        userAuthState.isUserLoading,
        isPublicRoute,
        router,
    ]);

    const contextValue =
        useMemo<FirebaseContextState>(
            () => ({
                firebaseApp,
                firestore,
                auth,
                ...userAuthState,
            }),
            [
                firebaseApp,
                firestore,
                auth,
                userAuthState,
            ]
        );

    return (
        <FirebaseContext.Provider
            value={contextValue}
        >
            <FirebaseErrorListener />
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebase =
    (): FirebaseContextState => {
        const context = useContext(FirebaseContext);

        if (context === undefined) {
            throw new Error(
                "useFirebase must be used within a FirebaseProvider."
            );
        }

        return context;
    };

export const useUser =
    (): UserHookResult => {
        const context = useContext(FirebaseContext);

        if (context === undefined) {
            throw new Error(
                "useUser must be used within a FirebaseProvider."
            );
        }

        return {
            user: context.user,
            isUserLoading:
                context.isUserLoading,
            userError: context.userError,
        };
    };
