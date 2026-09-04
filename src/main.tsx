import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/outfit"

import { App } from "@/app/app"
import "@/styles/globals.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Elemen root aplikasi tidak ditemukan.")
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
