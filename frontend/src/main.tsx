import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import App from "./App.tsx";
import "./index.css";

import api from "./lib/api";

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
    // Handle redirect promise to ensure the handshake completes
    msalInstance.handleRedirectPromise().then(async (response) => {
        // If we just returned from a redirect, handle the response
        if (response && response.idToken) {
            const email = response.account?.username?.toLowerCase() || "";
            if (email && !email.endsWith("@bpitindia.edu.in")) {
                console.warn(`[MSAL] Unauthorized domain: ${email}`);
                sessionStorage.setItem("msal_error", "Please login with your college ID (@bpitindia.edu.in)");
                createRoot(document.getElementById("root")!).render(
                    <StrictMode>
                        <MsalProvider instance={msalInstance}>
                            <App />
                        </MsalProvider>
                    </StrictMode>
                );
                return;
            }

            console.log("✅ MSAL Redirect Response received, logging in to backend...");
            try {
                const data = await api.msalLogin(response.idToken);
                // Save user to localStorage so AuthContext can pick it up immediately
                if (data && data.user) {
                    localStorage.setItem("stufolio_user", JSON.stringify(data.user));
                    console.log("✅ User session saved:", data.user.email);
                }

                window.location.href = "/dashboard";
                return; // Stop rendering here as we are redirecting
            } catch (err: any) {
                console.error("❌ Backend MSAL Login failed:", err);
                // Save error to sessionStorage so LoginPage can show it
                sessionStorage.setItem("msal_error", err.message || "Failed to authenticate with backend");
                // On error, we still want to render the app so the login page can handle it
            }
        }

        createRoot(document.getElementById("root")!).render(
            <StrictMode>
                <MsalProvider instance={msalInstance}>
                    <App />
                </MsalProvider>
            </StrictMode>
        );
    }).catch(err => {
        console.error("MSAL Redirect Error:", err);
        // Still render the app so the user can see errors or try again
        createRoot(document.getElementById("root")!).render(
            <StrictMode>
                <MsalProvider instance={msalInstance}>
                    <App />
                </MsalProvider>
            </StrictMode>
        );
    });
});
