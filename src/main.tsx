import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AzureAuthProvider } from "@/auth/AuthProvider";
import { msalInstance } from "@/auth/msal";

void msalInstance.initialize().then(async () => {
  await msalInstance.handleRedirectPromise();

  createRoot(document.getElementById("root")!).render(
    <AzureAuthProvider>
      <App />
    </AzureAuthProvider>,
  );
});
