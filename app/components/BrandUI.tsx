import React, { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   BRAND STYLES — injected via <style> to avoid Tailwind conflicts
   ═══════════════════════════════════════════════════════════════ */
export const BrandStyles = `
  /* ── INPUTS ─────────────────────────────────────────────────── */
  .maple-input {
    background: #27272a;
    border: 1px solid #3f3f46;
    color: #fafafa;
    border-radius: 8px;
    padding: 0 14px;
    height: 42px;
    font-size: 13px;
    width: 100%;
    transition: border-color 0.15s;
    font-family: 'Inter', system-ui, sans-serif;
    appearance: none;
  }
  .maple-input:hover:not(:disabled) {
    border-color: #52525b;
  }
  .maple-input:focus {
    outline: none;
    border-color: #c8a96e;
    box-shadow: 0 0 0 3px rgba(200,169,110,0.1);
  }
  .maple-input::placeholder { color: #52525b; }
  .maple-input:disabled { opacity: 0.45; cursor: not-allowed; }
  
  textarea.maple-input {
    height: auto;
    padding: 10px 14px;
    resize: vertical;
    line-height: 1.6;
  }
  select.maple-input {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2371717a'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
  select.maple-input option { background: #18181b; color: #fafafa; }

  /* ── BUTTONS ────────────────────────────────────────────────── */
  .maple-btn-primary {
    background: #c8a96e;
    color: #000;
    font-weight: 700;
    font-size: 12px;
    padding: 0 16px;
    height: 32px;
    border-radius: 6px;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .maple-btn-primary:hover {
    background: #d4b97e;
  }

  .maple-btn-secondary {
    background: transparent;
    border: 1px solid #3f3f46;
    color: #a1a1aa;
    font-size: 12px;
    font-weight: 500;
    height: 32px;
    padding: 0 14px;
    border-radius: 6px;
    transition: all 0.2s ease;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .maple-btn-secondary:hover {
    border-color: #71717a;
    color: #fafafa;
  }

  .maple-btn-icon {
    width: 28px;
    height: 28px;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 6px;
    color: #a1a1aa;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .maple-btn-icon:hover {
    color: #fafafa;
    border-color: #3f3f46;
  }
  .maple-btn-icon.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
  }

  /* ── SECTION LABELS & HEADINGS ───────────────────────────────── */
  .section-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: #71717a;
    margin-bottom: 6px;
    display: block;
  }

  .section-heading {
    font-size: 15px;
    font-weight: 600;
    color: #fafafa;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid #27272a;
    display: block;
    width: 100%;
  }

  /* ── CARDS ───────────────────────────────────────────────────── */
  .card {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
    border-left: 3px solid #c8a96e;
    position: relative;
  }

  /* ── BADGES ───────────────────────────────────────────────────── */
  .live-edit-badge {
    background: rgba(34,197,94,0.1);
    color: #22c55e;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .live-edit-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
  }

  /* ── TOPBAR ──────────────────────────────────────────────────── */
  .topbar {
    height: 48px;
    background: #09090b;
    border-bottom: 1px solid #1f1f1f;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  /* ── NAV ITEM ────────────────────────────────────────────────── */
  .nav-item {
    height: 38px;
    padding: 0 16px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    margin: 1px 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #71717a;
    background: transparent;
    border: none;
    cursor: pointer;
    width: calc(100% - 16px);
    transition: all 0.15s ease;
  }
  .nav-item:hover {
    background: #1f1f1f;
    color: #fafafa;
  }
  .nav-item.active {
    background: rgba(200,169,110,0.1);
    color: #c8a96e;
    border-left: 2px solid #c8a96e;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  .nav-item .icon {
    font-size: 14px;
    opacity: 0.6;
  }
  .nav-item.active .icon {
    opacity: 1;
  }

  /* ── FINANCIALS ──────────────────────────────────────────────── */
  .fin-line {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #a1a1aa;
    padding: 6px 0;
    border-bottom: 1px solid #1f1f1f;
  }
  .fin-line.grand {
    font-size: 15px;
    font-weight: 700;
    color: #c8a96e;
    border-top: 1px solid #3f3f46;
    border-bottom: none;
    padding-top: 12px;
    margin-top: 4px;
  }
  .fin-header {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #71717a;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  /* ── PREVIEW ─────────────────────────────────────────────────── */
  .preview-container {
    margin-top: 16px;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 10px;
    padding: 16px;
    min-height: 200px;
  }
  .preview-placeholder {
    color: #52525b;
    font-size: 12px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 160px;
  }
`;

/* ═══════════════════════════════════════════════════════════════
   REACT COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/** Live clock shown in the sidebar footer */
export const LiveClock = () => {
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted)
    return (
      <span className="section-label" style={{ color: "#38383f" }}>
        ——:——:——
      </span>
    );

  return (
    <span className="section-label" style={{ color: "#71717a", letterSpacing: "0.08em" }}>
      {time}
    </span>
  );
};

/** Wraps an input/select with a floating label */
export const InputLabel = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-[6px] w-full ${className}`}>
    <label className="section-label">{label}</label>
    {children}
  </div>
);

/** Thin wrapper components that apply .maple-input */
export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`maple-input ${props.className ?? ""}`} />
);

export const NumberInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} type="number" className={`maple-input ${props.className ?? ""}`} />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`maple-input ${props.className ?? ""}`} />
);

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`maple-input ${props.className ?? ""}`} />
);
