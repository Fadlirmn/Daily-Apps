import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { fetchBackendData } from './store'

function RootApp() {
  useEffect(() => {
    if (localStorage.getItem("arunika_auth") === "true") {
      fetchBackendData();
    }
  }, []);
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
