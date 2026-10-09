import { createContext, useContext, type ReactNode, type SyntheticEvent } from "react";
import { useStore } from "./store";

/** Fungsi pindah tab, disediakan App. */
export const NavContext = createContext<(id: string) => void>(() => {});

export function Icon({ name, filled = false, className = "" }: { name: string; filled?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-rounded ${filled ? "icon-filled" : ""} ${className}`}>
      {name}
    </span>
  );
}

export function Action({
  children,
  label,
  className = "",
  onClick,
}: {
  children: ReactNode;
  label: string;
  className?: string;
  onClick?: (e: SyntheticEvent) => void;
}) {
  return (
    <div
      aria-label={label}
      className={`cursor-pointer select-none ${className}`}
      onClick={onClick}
      onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onClick?.(event)}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export const inputCls =
  "w-full rounded-large border border-outline bg-surface px-4 py-3 text-body text-on-surface outline-none focus:border-primary";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-label-sm text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

export function Segmented({
  items,
  value,
  onChange,
}: {
  items: (string | [string, string])[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-full bg-surface-container p-1">
      {items.map((it) => {
        const [id, icon] = Array.isArray(it) ? it : [it, ""];
        return (
          <Action
            key={id}
            label={`Buka ${id}`}
            onClick={() => onChange(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-label ${
              value === id ? "bg-primary-container text-primary" : "text-on-surface-variant"
            }`}
          >
            {icon && <Icon name={icon} className="text-icon-xs" />}
            {id}
          </Action>
        );
      })}
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-scrim" role="dialog" aria-modal="true" aria-label={title}>
      <Action label="Tutup" className="absolute inset-0" onClick={onClose}>
        <span />
      </Action>
      <section className="sheet relative z-10 max-h-[92%] w-full overflow-y-auto rounded-t-sheet bg-surface-container-high p-5 pb-7 lg:mx-auto lg:mb-8 lg:max-w-mobile lg:rounded-sheet">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-outline" />
        <div className="flex items-center justify-between">
          <p className="text-title text-on-surface">{title}</p>
          <Action label="Tutup" onClick={onClose} className="grid size-11 place-items-center rounded-full">
            <Icon name="close" />
          </Action>
        </div>
        <div className="mt-4 space-y-4">{children}</div>
      </section>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  icon = "check",
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  icon?: string;
  danger?: boolean;
}) {
  return (
    <Action
      label={typeof children === "string" ? children : "Simpan"}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-full py-4 text-label ${
        danger ? "bg-expense/20 text-expense" : "bg-primary text-on-primary"
      }`}
    >
      <Icon name={icon} />
      {children}
    </Action>
  );
}

export function Progress({ pct, tone = "bg-primary" }: { pct: number; tone?: string }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-outline-variant"
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-large bg-surface-container px-6 py-8 text-center text-on-surface-variant">
      <Icon name={icon} className="text-icon-lg" />
      <p className="text-body-sm">{text}</p>
    </div>
  );
}

export function SectionHead({
  title,
  sub,
  actionLabel,
  actionText,
  onAction,
}: {
  title: string;
  sub?: string;
  actionLabel?: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <div className="min-w-0">
        <p className="text-title text-on-surface">{title}</p>
        {sub && <p className="mt-1 text-label-sm text-on-surface-variant">{sub}</p>}
      </div>
      {actionLabel && (
        <Action label={actionLabel} onClick={onAction} className="rounded-full px-3 py-2 text-label text-primary">
          {actionText ?? "Tambah"}
        </Action>
      )}
    </div>
  );
}


/** Foto profil (inisial) dengan nama di bawahnya; membuka halaman Profil. */
export function ProfileChip({ active = false }: { active?: boolean }) {
  const go = useContext(NavContext);
  const { profile } = useStore();
  const name = profile.name || "?";
  return (
    <Action label="Buka profil" onClick={() => go("profile")} className="flex min-w-0 shrink-0 flex-col items-center gap-1">
      <div className={`grid size-12 place-items-center rounded-full bg-primary-container text-primary ${active ? "ring-2 ring-primary" : ""}`}>
        <span className="text-title font-semibold">{name.charAt(0).toUpperCase()}</span>
      </div>
      <span className="max-w-20 truncate text-label-sm text-on-surface">{name}</span>
    </Action>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between px-5 pb-4 pt-6">
      <div className="min-w-0">
        <p className="text-headline text-on-surface">{title}</p>
        {sub && <p className="mt-1 text-body-sm text-on-surface-variant">{sub}</p>}
      </div>
      <div className="flex items-center gap-1">
        {right}
        <div className="lg:hidden">
          <ProfileChip />
        </div>
      </div>
    </header>
  );
}

/** Navigasi periode (bulan/minggu/tahun) dengan panah. */
export function Stepper({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <Action label="Sebelumnya" onClick={onPrev} className="grid size-11 place-items-center rounded-full text-on-surface">
        <Icon name="chevron_left" />
      </Action>
      <p className="text-title text-on-surface">{label}</p>
      <Action label="Berikutnya" onClick={onNext} className="grid size-11 place-items-center rounded-full text-on-surface">
        <Icon name="chevron_right" />
      </Action>
    </div>
  );
}
