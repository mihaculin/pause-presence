import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

const CLERK_PUBLISHABLE_KEY = "pk_test_cnVsaW5nLWtyaWxsLTI1LmNsZXJrLmFjY291bnRzLmRldiQ";

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
