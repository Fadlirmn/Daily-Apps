import logo from "./assets/logo.svg"

/** Logo Arunika (monogram A + U) dari src/assets/logo.svg. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <img src={logo} alt="Arunika" className={className} draggable={false} />
  )
}
