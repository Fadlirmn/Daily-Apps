import { useState } from "react";
import { Action, Icon, inputCls, PrimaryButton } from "./ui";

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("sumbul");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login gagal");
      }
      localStorage.setItem("arunika_token", data.token);
      localStorage.setItem("arunika_auth", "true");
      onLogin();
    } catch (err: any) {
      setError(err.message || "Email atau password salah.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-extra bg-surface-container p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 grid size-16 place-items-center rounded-full bg-primary-container text-primary">
            <Icon name="lock" className="text-icon-lg" />
          </div>
          <h1 className="text-headline text-on-surface">Masuk ke Arunika</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">Masukkan kredensial akun Anda</p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-medium bg-expense/20 p-4 text-expense">
            <Icon name="error" />
            <p className="text-body-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-label-sm text-on-surface-variant">Email</label>
            <input
              type="text"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sumbul"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-label-sm text-on-surface-variant">Password</label>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <PrimaryButton onClick={() => handleLogin({ preventDefault() {} } as React.FormEvent)}>
            Masuk
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
