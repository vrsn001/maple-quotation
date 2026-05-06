import React, { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   BRAND STYLES — injected via <style> to avoid Tailwind conflicts
   ═══════════════════════════════════════════════════════════════ */
export const BrandStyles = `
  /* ── INPUTS ─────────────────────────────────────────────────── */
  .maple-input {
    background: var(--bg-elevated);
    border: 1.5px solid var(--border);
    color: var(--text);
    border-radius: var(--r-md);
    padding: 0 14px;
    height: 40px;
    font-size: 13px;
    width: 100%;
    transition: border-color var(--t-base) var(--ease-out),
                box-shadow var(--t-base) var(--ease-out),
                background var(--t-base) var(--ease-out);
    font-family: 'Inter', system-ui, sans-serif;
    font-feature-settings: 'cv11', 'ss01';
    appearance: none;
  }
  .maple-input:hover:not(:disabled) {
    border-color: var(--border-focus);
    background: var(--bg-hover);
  }
  .maple-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim), 0 0 0 1px var(--accent);
    background: var(--bg-hover);
  }
  .maple-input::placeholder { color: var(--text-disabled); }
  .maple-input:disabled { opacity: 0.45; cursor: not-allowed; }
  textarea.maple-input {
    height: auto;
    padding: 10px 14px;
    resize: vertical;
    line-height: 1.6;
  }
  select.maple-input {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235c5c6e'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
  select.maple-input option { background: #1c1c22; color: #f4f4f6; }

  /* ── BUTTONS BASE ────────────────────────────────────────────── */
  .maple-btn-primary,
  .maple-btn-secondary,
  .maple-btn-danger,
  .maple-btn-ghost,
  .maple-btn-template {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: 'Inter', system-ui, sans-serif;
    font-feature-settings: 'cv11', 'ss01';
    cursor: pointer;
    border: none;
    outline: none;
    white-space: nowrap;
    transition: all var(--t-base) var(--ease-out);
    position: relative;
    overflow: hidden;
  }
  .maple-btn-primary::after,
  .maple-btn-secondary::after,
  .maple-btn-danger::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0);
    transition: background var(--t-fast) ease;
  }
  .maple-btn-primary:hover::after  { background: rgba(255,255,255,0.06); }
  .maple-btn-secondary:hover::after { background: rgba(255,255,255,0.04); }
  .maple-btn-danger:hover::after   { background: rgba(255,255,255,0.06); }

  /* ── PRIMARY ─────────────────────────────────────────────────── */
  .maple-btn-primary {
    background: var(--accent);
    background-image: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
    color: #13100a;
    font-weight: 700;
    font-size: 12.5px;
    letter-spacing: 0.02em;
    padding: 0 20px;
    height: 36px;
    border-radius: var(--r-md);
    box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 2px 12px rgba(200,169,110,0.22);
  }
  .maple-btn-primary:hover {
    box-shadow: 0 2px 16px rgba(200,169,110,0.35), 0 1px 4px rgba(0,0,0,0.4);
    transform: translateY(-1px);
  }
  .maple-btn-primary:active {
    transform: scale(0.97) translateY(0);
    box-shadow: 0 1px 4px rgba(200,169,110,0.20);
  }

  /* ── SECONDARY ───────────────────────────────────────────────── */
  .maple-btn-secondary {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 12.5px;
    padding: 0 16px;
    height: 36px;
    border-radius: var(--r-md);
    border: 1.5px solid var(--border);
    box-shadow: var(--shadow-sm);
  }
  .maple-btn-secondary:hover {
    background: var(--bg-hover);
    color: var(--text);
    border-color: var(--border-focus);
    transform: translateY(-1px);
  }
  .maple-btn-secondary:active  { transform: scale(0.97); }

  /* ── DANGER ──────────────────────────────────────────────────── */
  .maple-btn-danger {
    background: #8b1a1d;
    background-image: linear-gradient(135deg, #8b1a1d 0%, #a82024 100%);
    color: #fff;
    font-weight: 700;
    font-size: 12.5px;
    padding: 0 16px;
    height: 36px;
    border-radius: var(--r-md);
    border: 1.5px solid rgba(255,255,255,0.06);
    box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 2px 12px rgba(240,71,71,0.18);
  }
  .maple-btn-danger:hover {
    background-image: linear-gradient(135deg, #a82024 0%, #c0282d 100%);
    box-shadow: 0 2px 16px rgba(240,71,71,0.28);
    transform: translateY(-1px);
  }
  .maple-btn-danger:active  { transform: scale(0.97); }

  /* ── GHOST ───────────────────────────────────────────────────── */
  .maple-btn-ghost {
    background: transparent;
    color: var(--text-muted);
    font-size: 12.5px;
    font-weight: 500;
    padding: 0 10px;
    height: 32px;
    border-radius: var(--r-sm);
    border: none;
  }
  .maple-btn-ghost:hover {
    background: var(--bg-elevated);
    color: var(--text);
  }
  .maple-btn-ghost:active { opacity: 0.7; }

  /* ── ICON BUTTON ─────────────────────────────────────────────── */
  .maple-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--r-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    transition: all var(--t-fast) var(--ease-out);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
  }
  .maple-btn-icon:hover { background: var(--bg-elevated); color: var(--text); }
  .maple-btn-icon.danger:hover { background: var(--red-dim); color: var(--red); }

  /* ── TEMPLATE BUTTON ─────────────────────────────────────────── */
  .maple-btn-template {
    background: transparent;
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.02em;
    padding: 0 14px;
    height: 34px;
    border-radius: var(--r-md);
    border: 1.5px solid var(--border);
    transition: all var(--t-base) var(--ease-out);
  }
  .maple-btn-template:hover {
    background: var(--accent);
    background-image: linear-gradient(135deg, var(--accent), var(--accent-hover));
    color: #13100a;
    border-color: transparent;
    box-shadow: 0 2px 12px rgba(200,169,110,0.28);
    transform: translateY(-1px);
  }

  /* ── SECTION LABELS & HEADINGS ───────────────────────────────── */
  .section-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }

  .section-heading {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-heading::before {
    content: '';
    display: block;
    width: 3px;
    height: 14px;
    background: linear-gradient(180deg, var(--accent), var(--accent-light));
    border-radius: 9999px;
    flex-shrink: 0;
  }

  /* ── CARDS ───────────────────────────────────────────────────── */
  .card {
    background: var(--bg-surface);
    border: 1.5px solid var(--border-subtle);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-sm);
    transition: border-color var(--t-base) var(--ease-out);
  }
  .card:focus-within { border-color: rgba(200,169,110,0.18); }
  .card.hoverable:hover { border-color: var(--border); box-shadow: var(--shadow-md); }

  /* ── BADGE ───────────────────────────────────────────────────── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: var(--r-pill);
  }
  .badge-accent   { background: var(--accent-dim);  color: var(--accent-light); }
  .badge-green    { background: var(--green-dim);   color: var(--green); }
  .badge-red      { background: var(--red-dim);     color: var(--red); }
  .badge-neutral  { background: var(--bg-elevated); color: var(--text-muted); border: 1px solid var(--border); }

  /* ── DIVIDERS ────────────────────────────────────────────────── */
  .divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 16px 0;
  }
  .divider-v {
    width: 1px;
    background: var(--border-subtle);
    align-self: stretch;
  }

  /* ── TOASTS ──────────────────────────────────────────────────── */
  .toast-container {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9999;
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
    pointer-events: none;
    max-width: 360px;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    border-radius: var(--r-md);
    font-size: 13px;
    font-weight: 500;
    background: var(--bg-elevated);
    border: 1.5px solid var(--border);
    color: var(--text);
    animation: slideUp 0.24s var(--ease-bounce) both;
    pointer-events: all;
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(12px);
    line-height: 1.4;
  }
  .toast::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--text-muted);
  }
  .toast.success::before  { background: var(--accent); }
  .toast.error::before    { background: var(--red); }
  .toast.success { border-color: rgba(200,169,110,0.30); }
  .toast.error   { border-color: rgba(240,71,71,0.30); }

  /* ── EMPTY STATE ─────────────────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 24px;
    gap: 12px;
  }
  .empty-state-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--r-md);
    background: var(--bg-elevated);
    border: 1.5px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-bottom: 4px;
  }
  .empty-state-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  .empty-state-desc {
    font-size: 12px;
    color: var(--text-muted);
    max-width: 240px;
    line-height: 1.6;
  }

  /* ── STAT CARD ───────────────────────────────────────────────── */
  .stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }
  .stat-row + .stat-row {
    border-top: 1px solid var(--border-subtle);
  }
  .stat-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
  }
  .stat-value {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    tabular-nums;
    font-variant-numeric: tabular-nums;
  }
  .stat-value.accent { color: var(--accent-light); font-size: 16px; }
  .stat-value.large  { font-size: 20px; }

  /* ── TABLE ───────────────────────────────────────────────────── */
  .maple-table { width: 100%; border-collapse: collapse; text-align: left; }
  .maple-table thead th {
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-surface);
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .maple-table tbody tr {
    border-bottom: 1px solid var(--border-subtle);
    transition: background var(--t-fast) ease;
  }
  .maple-table tbody tr:hover { background: var(--bg-elevated); }
  .maple-table tbody tr:last-child { border-bottom: none; }
  .maple-table tbody td { padding: 14px; vertical-align: top; }

  /* ── MODAL ───────────────────────────────────────────────────── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(8px);
    padding: 24px;
    animation: fadeIn 0.15s ease both;
  }
  .modal-box {
    background: var(--bg-surface);
    border: 1.5px solid var(--border);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-lg), 0 0 60px rgba(0,0,0,0.6);
    animation: scaleIn 0.22s var(--ease-bounce) both;
    width: 100%;
    max-width: 480px;
    overflow: hidden;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .modal-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  .modal-body { padding: 24px; }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 24px;
    border-top: 1px solid var(--border-subtle);
    background: var(--bg-elevated);
  }

  /* ── SIDEBAR NAV ─────────────────────────────────────────────── */
  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 38px;
    padding: 0 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    border-radius: var(--r-md);
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all var(--t-base) var(--ease-out);
    text-align: left;
    font-family: 'Inter', system-ui, sans-serif;
    position: relative;
  }
  .nav-item:hover {
    background: var(--bg-elevated);
    color: var(--text-secondary);
  }
  .nav-item.active {
    background: var(--accent-dim);
    color: var(--accent-light);
    font-weight: 600;
  }
  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: linear-gradient(180deg, var(--accent), var(--accent-light));
    border-radius: 0 var(--r-pill) var(--r-pill) 0;
  }

  /* ── FINANCIAL SUMMARY ───────────────────────────────────────── */
  .fin-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 0;
  }
  .fin-line + .fin-line { border-top: 1px solid var(--border-subtle); }
  .fin-line.grand {
    border-top: 2px solid var(--border);
    margin-top: 6px;
    padding-top: 14px;
  }
  .fin-line-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
  }
  .fin-line-value {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .fin-line.grand .fin-line-label { font-size: 12px; color: var(--text-secondary); }
  .fin-line.grand .fin-line-value  { font-size: 19px; color: var(--accent-light); }

  /* ── ROOM HEADER ─────────────────────────────────────────────── */
  .room-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid var(--border-subtle);
  }
  .room-name-input {
    background: transparent;
    border: none;
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    outline: none;
    font-family: 'Inter', system-ui, sans-serif;
    min-width: 0;
    flex: 1;
    letter-spacing: -0.01em;
  }
  .room-name-input::placeholder { color: var(--text-disabled); }

  /* ── DRAFTS CARD ─────────────────────────────────────────────── */
  .draft-card {
    background: var(--bg-surface);
    border: 1.5px solid var(--border-subtle);
    border-radius: var(--r-lg);
    padding: 18px 20px;
    cursor: pointer;
    transition: all var(--t-base) var(--ease-out);
    position: relative;
    text-align: left;
    width: 100%;
  }
  .draft-card:hover {
    border-color: var(--accent);
    box-shadow: 0 4px 20px rgba(200,169,110,0.10);
    transform: translateY(-2px);
  }

  /* ── HEADER BAR ──────────────────────────────────────────────── */
  .topbar {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    border-bottom: 1px solid var(--border-subtle);
    background: rgba(8,8,11,0.8);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  /* ── QUICK SHORTCUTS ─────────────────────────────────────────── */
  .kbd {
    display: inline-flex;
    align-items: center;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }

  /* ── ITEM IMAGE UPLOAD ───────────────────────────────────────── */
  .item-img-box {
    width: 72px;
    height: 72px;
    border-radius: var(--r-md);
    background: var(--bg-elevated);
    border: 1.5px dashed var(--border);
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    transition: border-color var(--t-base) ease;
  }
  .item-img-box:hover { border-color: var(--accent); }
  .item-img-box img { width: 100%; height: 100%; object-fit: cover; }
  .item-img-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    cursor: pointer;
    transition: opacity var(--t-fast) ease;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: white;
  }
  .item-img-box:hover .item-img-overlay { opacity: 1; }
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
      <span className="section-label" style={{ color: "var(--text-disabled)" }}>
        ——:——:——
      </span>
    );

  return (
    <span className="section-label" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
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
  <div className={`flex flex-col gap-[5px] ${className}`}>
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
