import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    studentId?: string;
    mentorId?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: Record<string, any>) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = api.getToken();
            if (token) {
                const verifiedUser = await api.verifySession();
                if (verifiedUser) {
                    setUser(verifiedUser);
                    localStorage.setItem("stufolio_user", JSON.stringify(verifiedUser));
                } else {
                    // verifySession handles logout/cleanup
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const data = await api.login(email, password);
        setUser(data.user);
        localStorage.setItem("stufolio_user", JSON.stringify(data.user));
    };

    const register = async (userData: Record<string, any>) => {
        const data = await api.register(userData);
        setUser(data.user);
        localStorage.setItem("stufolio_user", JSON.stringify(data.user));
    };

    const logout = () => {
        api.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthContext;
