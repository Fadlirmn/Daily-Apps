import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { fetchBackendData } from "./store"

function RootApp() {
  useEffect(() => {
    try {
      document.documentElement.dataset.theme =
        localStorage.getItem("arunika_theme") || "dark"
    } catch {
      /* abaikan */
    }
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* offline cache opsional — app tetap jalan tanpa SW */
        })
      })
    }
    if (localStorage.getItem("arunika_auth") === "true") {
      fetchBackendData()
    }
  }, [])
  return <App />
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
