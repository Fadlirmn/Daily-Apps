import { useEffect, useRef, useState } from "react";
import Activity from "./Activity";
import Finance from "./Finance";
import Logo from "./Logo";
import Profile from "./Profile";
import Report from "./Report";
import Today from "./Today";
import TxSheet from "./TxSheet";
import { Login } from "./Login";
import { deleteTx, fmt, useStore } from "./store";
import { Action, Icon, NavContext, ProfileChip } from "./ui";

const NAV = [
  { id: "today", icon: "today", label: "Hari Ini" },
  { id: "activity", icon: "check_circle", label: "Aktivitas" },
  { id: "finance", icon: "account_balance_wallet", label: "Keuangan" },
  { id: "report", icon: "bar_chart", label: "Laporan" },
];
const MOBILE_NAV = NAV;

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("arunika_auth") === "true");
  useStore(); // re-render saat data berubah
  const [active, setActive] = useState("today");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleLogout() {
    localStorage.removeItem("arunika_auth");
    localStorage.removeItem("arunika_token");
    localStorage.removeItem("arunika:v1");
    setAuthed(false);
  }

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  function onSaved(id: string, isNew: boolean) {
    window.clearTimeout(timer.current);
    setToast({ id: isNew ? id : "", text: isNew ? "Transaksi berhasil disimpan" : "Transaksi diperbarui" });
    timer.current = window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <NavContext.Provider value={setActive}>
    <div className="app-shell relative mx-auto min-h-screen max-w-mobile overflow-hidden bg-background lg:max-w-none">
      <aside className="desktop-sidebar hidden border-r border-outline-variant bg-surface lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-6 py-7">
          <Logo className="h-11 w-14 shrink-0" />
          <div>
            <p className="text-title text-on-surface">Arunika</p>
            <p className="text-label-sm text-on-surface-variant">Aktivitas & keuangan</p>
          </div>
        </div>

        <nav aria-label="Navigasi utama" className="space-y-2 px-3">
          {NAV.map((item) => (
            <Action
              key={item.id}
              label={`Buka ${item.label}`}
              onClick={() => setActive(item.id)}
              className={`flex items-center gap-4 rounded-full px-4 py-3 ${
                active === item.id ? "bg-primary-container text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <Icon name={item.icon} filled={active === item.id} />
              <span className="text-label">{item.label}</span>
            </Action>
          ))}
        </nav>

        <Action
          label="Tambah transaksi cepat"
          onClick={() => setSheetOpen(true)}
          className="mx-4 mt-7 flex items-center justify-center gap-3 rounded-large bg-primary px-4 py-4 text-label text-on-primary"
        >
          <Icon name="add" />
          Tambah transaksi
        </Action>

        <div className="mt-auto flex flex-col gap-3 border-t border-outline-variant p-5">
          <div className="flex justify-center">
            <ProfileChip active={active === "profile"} />
          </div>
          <Action
            label="Keluar aplikasi"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-full bg-surface-container-high py-3 text-label text-expense hover:bg-expense/10"
          >
            <Icon name="logout" className="text-icon-sm" />
            Keluar
          </Action>
        </div>
      </aside>

      <div className="desktop-content">
        {active === "today" && <Today setActive={setActive} />}
        {active === "activity" && <Activity />}
        {active === "finance" && <Finance />}
        {active === "report" && <Report />}
        {active === "profile" && (
          <div className="space-y-5">
            <Profile />
            <div className="px-4 lg:hidden pb-10">
              <Action
                label="Keluar aplikasi"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-full bg-surface-container-high py-4 text-label text-expense"
              >
                <Icon name="logout" className="text-icon-sm" />
                Keluar
              </Action>
            </div>
          </div>
        )}
      </div>

      <nav className="absolute inset-x-0 bottom-0 z-30 grid grid-cols-5 items-end border-t border-outline-variant bg-nav px-2 pb-safe pt-2 lg:hidden">
        {MOBILE_NAV.slice(0, 2).map((item) => (
          <NavItem key={item.id} {...item} active={active === item.id} onClick={() => setActive(item.id)} />
        ))}
        <div className="flex justify-center">
          <Action
            label="Tambah cepat"
            onClick={() => setSheetOpen(true)}
            className="fab -mt-8 grid size-16 place-items-center rounded-large bg-primary text-on-primary"
          >
            <Icon name="add" className="text-icon-lg" />
          </Action>
        </div>
        {MOBILE_NAV.slice(2).map((item) => (
          <NavItem key={item.id} {...item} active={active === item.id} onClick={() => setActive(item.id)} />
        ))}
      </nav>

      {toast && (
        <div role="status" className="absolute bottom-28 left-4 right-4 z-40 flex items-center gap-3 rounded-medium bg-inverse-surface p-4 text-inverse-on-surface lg:left-1/2 lg:right-auto lg:w-96 lg:-translate-x-1/2">
          <Icon name="check_circle" className="text-tertiary" />
          <p className="flex-1 text-body-sm">{toast.text}</p>
          {toast.id && (
            <Action
              label="Urungkan transaksi"
              onClick={() => {
                deleteTx(toast.id);
                setToast(null);
              }}
              className="text-label text-primary"
            >
              Urungkan
            </Action>
          )}
        </div>
      )}

      {sheetOpen && <TxSheet close={() => setSheetOpen(false)} onSaved={onSaved} />}
    </div>
    </NavContext.Provider>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  id: string;
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Action
      label={`Buka ${label}`}
      onClick={onClick}
      className={`flex min-w-0 flex-col items-center gap-1 pb-2 ${active ? "text-on-surface" : "text-on-surface-variant"}`}
    >
      <div className={`grid h-8 w-16 place-items-center rounded-full ${active ? "bg-primary-container" : ""}`}>
        <Icon name={icon} filled={active} className="text-icon-sm" />
      </div>
      <span className="truncate text-label-sm">{label}</span>
    </Action>
  );
}
