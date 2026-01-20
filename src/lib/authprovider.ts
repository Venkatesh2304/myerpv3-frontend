import { AuthProvider } from "@refinedev/core";
import { dataProvider } from "./dataprovider.ts";

export const authProvider: AuthProvider = {
    login: async ({ username, password }) => {
        return dataProvider.custom({
            url: "/login",
            method: "post",
            payload: { username, password },
            meta: {
                withCredentials: true
            }
        }).then((res) => {
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("accessToken", res.data?.access);
            return {
                success: true,
                redirectTo: "/billing"
            }
        }).catch((err) => {
            return {
                success: false,
                error: {
                    message: "Login Error",
                    name: "Invalid email or password",
                },
            };
        });
    },
    check: async () => {
        if (sessionStorage.getItem("username")) {
            return {
                authenticated: true,
            }
        } else {
            return {
                authenticated: false,
                error: {
                    message: "Session Expired",
                },
            };
        }
    },
    getIdentity: async () => {
        return {
            id: sessionStorage.getItem("username"),
            fullName: sessionStorage.getItem("username"),
            avatar: "",
        };
    },
    logout: async () => {
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("selectedCompanyId");
        return {
            success: true,
            redirectTo: "/login",
        };
    },
    onError: async (error) => {
        if (error.response.status === 401 || error.response.status === 403) {
            return {
                logout: true,
                redirectTo: "/login",
                error: new Error("Session expired. Please login again."),
            };
        }
        return { logout: false };
    },
};