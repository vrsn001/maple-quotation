import React, { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   BRAND STYLES — injected via <style> to avoid Tailwind conflicts
   ═══════════════════════════════════════════════════════════════ */
export const BrandStyles = `
  /* ── INPUTS ─────────────────────────────────────────────────── */
  .maple-input {
    background: #232329;
    border: 1.5px solid #38383f;
    color: #ffffff;
    border-radius: 10px;
    padding: 0 16px;
    height: 48px;
    font-size: 14px;
    width: 100%;
    transition: all 0.15s;
    font-family: var(--font-outfit), system-ui, sans-serif;
    appearance: none;
  }
  .maple-input:hover:not(:disabled) { border-color: #4a4a54; }
  .maple-input:focus {
    outline: none;
    border-color: #632a2a;
    box-shadow: 0 0 0 3px rgba(99,42,42,0.12);
  }
  .maple-input::placeholder { color: #555560; }
  .maple-input:disabled { opacity: 0.38; cursor: not-allowed; }

  textarea.maple-input {
    height: auto;
    min-height: 96px;
    padding: 14px 16px;
    resize: vertical;
    line-height: 1.65;
  }
  select.maple-input {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2352526a'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
  select.maple-input option { background: #18181b; color: #ffffff; }

  /* ── BUTTONS ────────────────────────────────────────────────── */
  .maple-btn-primary {
    background: #632a2a;
    color: #ffffff;
    font-weight: 700;
    font-size: 13px;
    padding: 0 18px;
    height: 34px;
    border-radius: 8px;
    transition: all 0.15s ease;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(99,42,42,0.25);
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .maple-btn-primary:hover { background: #7a3333; }

  .maple-btn-secondary {
    background: transparent;
    border: 1px solid #38383f;
    color: #e4e4e7;
    font-size: 13px;
    font-weight: 500;
    height: 34px;
    padding: 0 16px;
    border-radius: 8px;
    transition: all 0.15s ease;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .maple-btn-secondary:hover { background: #18181b; border-color: #888896; }

  .maple-btn-icon {
    width: 32px;
    height: 32px;
    background: #18181b;
    border: 1px solid #2e2e33;
    border-radius: 8px;
    color: #888896;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 13px;
  }
  .maple-btn-icon:hover { color: #ffffff; border-color: #3f3f46; }
  .maple-btn-icon.danger:hover {
    background: rgba(240,71,71,0.10);
    color: #f04747;
    border-color: rgba(240,71,71,0.25);
  }

  /* ── SECTION LABELS & HEADINGS ───────────────────────────────── */
  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888896;
    margin-bottom: 8px;
    display: block;
    font-family: var(--font-instrument), serif;
  }

  .section-heading {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #2e2e33;
    display: block;
    width: 100%;
    font-family: var(--font-instrument), serif;
  }

  /* ── CARDS ───────────────────────────────────────────────────── */
  .card {
    background: #18181b;
    border: 1px solid #2e2e33;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    position: relative;
    overflow: hidden;
  }

  /* ── BADGES ───────────────────────────────────────────────────── */
  .live-edit-badge {
    background: rgba(34,197,94,0.08);
    color: #22c55e;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 4px 10px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 5px;
    border: 1px solid rgba(34,197,94,0.2);
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .live-edit-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .badge-accent {
    background: rgba(99,42,42,0.10);
    color: #632a2a;
    border: 1px solid rgba(99,42,42,0.18);
  }

  /* ── TOPBAR ──────────────────────────────────────────────────── */
  .topbar {
    height: 52px;
    background: #0d0d0f;
    border-bottom: 1px solid #1e1e23;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  /* ── NAV ITEM ────────────────────────────────────────────────── */
  .nav-item {
    height: 40px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 8px;
    margin: 2px 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #888896;
    background: transparent;
    border: none;
    border-left: 2px solid transparent;
    cursor: pointer;
    width: calc(100% - 16px);
    transition: all 0.15s ease;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .nav-item:hover { background: #1e1e23; color: #e4e4e7; }
  .nav-item.active {
    background: rgba(99,42,42,0.1);
    color: #a85555;
    border-left-color: #632a2a;
    padding-left: 12px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  .nav-item .icon { font-size: 13px; opacity: 0.8; }
  .nav-item.active .icon { opacity: 1; }

  /* ── FINANCIALS ──────────────────────────────────────────────── */
  .fin-line {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 8px 0;
    border-bottom: 1px solid #1f1f23;
  }
  .fin-line .fin-label { color: #888896; }
  .fin-line .fin-value { color: #e4e4e7; font-weight: 500; }
  .fin-line.grand {
    padding-top: 14px;
    margin-top: 4px;
    border-top: 2px solid #2e2e33;
    border-bottom: none;
  }
  .fin-line.grand .fin-label { font-size: 15px; font-weight: 700; color: #ffffff; }
  .fin-line.grand .fin-value { font-size: 18px; font-weight: 800; color: #632a2a; }
  .fin-header {
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 16px;
    font-family: var(--font-instrument), serif;
  }

  /* ── PREVIEW ─────────────────────────────────────────────────── */
  .preview-container {
    margin-top: 16px;
    background: #111114;
    border: 1px solid #1e1e23;
    border-radius: 12px;
    padding: 18px;
    min-height: 200px;
  }
  .preview-placeholder {
    color: #555560;
    font-size: 12px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 160px;
  }

  /* ── ROOM HEADER ─────────────────────────────────────────────── */
  .room-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: #111114;
    border-bottom: 1px solid #1e1e23;
    gap: 16px;
    flex-wrap: wrap;
  }
  .room-name-input {
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    outline: none;
    font-family: var(--font-outfit), system-ui, sans-serif;
    min-width: 160px;
  }
  .room-name-input::placeholder { color: #38383f; }

  /* ── TABLE ───────────────────────────────────────────────────── */
  .maple-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .maple-table th {
    text-align: left;
    padding: 10px 16px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    color: #555560;
    background: #111114;
    border-bottom: 1px solid #1e1e23;
  }
  .maple-table td {
    padding: 16px;
    border-bottom: 1px solid #1e1e23;
    vertical-align: top;
    background: #111114;
  }
  .maple-table tbody tr { transition: background 0.12s ease; }
  .maple-table tbody tr:hover td { background: #16161a; }
  .maple-table tbody tr:last-child td { border-bottom: none; }

  /* ── ITEM IMAGE ──────────────────────────────────────────────── */
  .item-img-box {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    background: #232329;
    border: 1px solid #38383f;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    cursor: pointer;
  }
  .item-img-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #ffffff;
    cursor: pointer;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .item-img-box:hover .item-img-overlay { opacity: 1; }

  /* ── EMPTY STATE ─────────────────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
    border: 1px dashed #2e2e33;
    border-radius: 10px;
    color: #555560;
    font-size: 13px;
  }
  .empty-state-icon { font-size: 28px; margin-bottom: 12px; opacity: 0.5; }
  .empty-state-title {
    font-size: 13px;
    font-weight: 600;
    color: #555560;
    margin-bottom: 6px;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .empty-state-desc {
    font-size: 12px;
    color: #555560;
    max-width: 280px;
    line-height: 1.7;
  }

  /* ── DRAFT CARDS ─────────────────────────────────────────────── */
  .draft-card {
    background: #18181b;
    border: 1px solid #2e2e33;
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .draft-card:hover {
    border-color: rgba(99,42,42,0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.45);
  }

  /* ── TOAST ───────────────────────────────────────────────────── */
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  .toast {
    background: #18181b;
    border: 1px solid #2e2e33;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #e4e4e7;
    pointer-events: all;
    animation: slideUp 0.25s ease both;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    min-width: 180px;
    font-family: var(--font-outfit), system-ui, sans-serif;
  }
  .toast.success { border-color: rgba(46,184,114,0.28); color: #2eb872; }
  .toast.error { border-color: rgba(240,71,71,0.28); color: #f04747; }

  /* ── MODAL ───────────────────────────────────────────────────── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(10px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .modal-box {
    background: #18181b;
    border: 1px solid #2e2e33;
    border-radius: 20px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: scaleIn 0.22s ease both;
    box-shadow: 0 30px 80px rgba(0,0,0,0.75);
    position: relative;
  }
  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px;
    border-bottom: 1px solid #2e2e33;
  }
  .modal-title {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    font-family: var(--font-instrument), serif;
  }
  .modal-body { padding: 24px; }
  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #2e2e33;
    display: flex;
    justify-content: flex-end;
  }

  /* ── CREATIVE BUTTON ──────────────────────────────────────────── */
  .creative-btn {
    position: relative;
    cursor: pointer;
    overflow: hidden;
    text-align: center;
    font-weight: 600;
    font-family: var(--font-instrument), serif;
    font-size: 13px;
    transition: all 0.22s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
  }
  .creative-btn .text-wrapper {
    display: inline-block;
    transition: all 0.22s ease;
  }
  .creative-btn:hover .text-wrapper {
    transform: translateY(-150%);
    opacity: 0;
  }
  .creative-btn .hover-layer {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateY(100%);
    opacity: 0;
    transition: all 0.22s ease;
  }
  .creative-btn:hover .hover-layer {
    transform: translateY(0);
    opacity: 1;
  }
  .creative-btn.primary {
    background: #632a2a;
    color: #ffffff;
    border-color: #632a2a;
    height: 34px;
    padding: 0 18px;
    box-shadow: 0 2px 8px rgba(99,42,42,0.25);
  }
  .creative-btn.primary .hover-layer { background: #7a3333; color: #ffffff; }
  .creative-btn.secondary {
    background: transparent;
    color: #e4e4e7;
    border-color: #38383f;
    height: 34px;
    padding: 0 16px;
  }
  .creative-btn.secondary:hover { border-color: #888896; }
  .creative-btn.secondary .hover-layer { background: #18181b; color: #e4e4e7; }
  .creative-btn.outline { background: transparent; color: #e4e4e7; border-color: #2e2e33; }
  .creative-btn.outline .hover-layer { background: #232329; color: #e4e4e7; }
  .creative-btn.danger .hover-layer { background: #f04747; color: white; }
  .creative-btn.danger:hover { border-color: #f04747; }
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

/** 
 * CREATIVE BUTTON
 * Implements the sliding text effect for a premium feel
 */
export const CreativeButton = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "", 
  icon,
  type = "button"
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: "primary" | "secondary" | "danger" | "outline"; 
  className?: string;
  icon?: React.ReactNode;
  type?: "button" | "submit";
}) => {
  return (
    <button 
      type={type}
      onClick={onClick}
      className={`creative-btn ${variant} ${className} group rounded-[8px]`}
    >
      <span className="text-wrapper flex items-center gap-2">
        {icon}
        {children}
      </span>
      <div className="hover-layer font-bold flex items-center gap-2">
        {icon}
        {children}
      </div>
    </button>
  );
};
