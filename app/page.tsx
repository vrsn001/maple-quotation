"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import { MAPLE_LOGO_B64 } from "./maple-logo-b64";

// Modular Imports
import { 
  QuoteData, QuoteItem, QuoteRoom, QuoteMeta, CompanyPayment, Draft, 
  UnitType, DiscountType, GstMode 
} from "./lib/types";

import { 
  money, computeTotals, safeParse, newItem, newRoom, 
  makeId, todayISODate, toNumber, quickConvert, discountAmount 
} from "./lib/utils";
import { TEMPLATES } from "./lib/constants";

import { MasterProposalPdf } from "./components/PdfCatalog";
import { 
  LiveClock, InputLabel, TextInput, Select, TextArea, 
  NumberInput, BrandStyles 
} from "./components/BrandUI";

const LS_KEY_DRAFTS = "mapleQuotation.drafts.v1";
const LS_KEY_LAST = "mapleQuotation.last.v2";
const LS_KEY_TERMS = "mapleQuotation.terms.v1";

export default function QuotationBuilderPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BrandStyles }} />
      <QuotationBuilderContent />
    </>
  );
}

function LivePreviewPanel({ data, computed, terms }: { data: QuoteData; computed: ReturnType<typeof computeTotals>; terms: string[] }) {
  return (
    <div className="live-preview-panel flex-1 overflow-y-auto p-4">
      {!data.client.name ? (
        <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
          <div className="mb-3 h-7 w-6 rounded border border-[var(--border)] bg-[var(--bg-surface)]" />
          <p className="text-[11px] font-medium max-w-[220px]">Fill in client details to see preview</p>
        </div>
      ) : (
        <div style={{ background: 'white', color: '#111', padding: '24px', minHeight: '100%', fontSize: '11px', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #632a2a', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#632a2a' }}>MAPLE FURNISHERS</div>
            <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>
              <div>B-3, W.H.S. Timber Market Kriti Nagar</div>
              <div>Delhi-110015</div>
              <div>9262968727</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', background: '#fafafa', padding: '10px', borderRadius: '4px' }}>
            <div>
              <div style={{ fontSize: '8px', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Prepared For</div>
              <div style={{ fontWeight: 700 }}>{data.client.name || '—'}</div>
              <div style={{ color: '#666' }}>{data.client.phone}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '8px', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Ref No.</div>
              <div style={{ fontWeight: 700 }}>{data.quote.number}</div>
              <div style={{ color: '#666' }}>{data.quote.date}</div>
            </div>
          </div>

          {data.rooms.map((room) => (
            <div key={room.id} style={{ marginBottom: '16px' }}>
              <div style={{ background: '#632a2a', color: 'white', padding: '6px 10px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '3px', marginBottom: '8px' }}>
                {room.name || 'Room'} — {room.items.length} items
              </div>
              {room.items.map((item) => {
                const total = (item.price || 0) * (item.unitValue || 1) * (item.quantity || 1);
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.category || 'Item'}</div>
                      <div style={{ color: '#666', fontSize: '9px' }}>{item.description}</div>
                      <div style={{ color: '#999', fontSize: '8px' }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#632a2a' }}>₹{total.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
            {computed.totals.lines.map((line) => (
              <div key={line.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: line.emphasis ? 700 : 400, color: line.emphasis ? '#632a2a' : '#333', fontSize: line.emphasis ? '12px' : '9px' }}>
                <span>{line.label}</span>
                <span>₹{line.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {terms.length > 0 && (
            <div style={{ marginTop: '16px', padding: '10px', background: '#fafafa', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', marginBottom: '6px', color: '#632a2a' }}>Terms & Conditions</div>
              {terms.map((t, i) => <div key={i} style={{ fontSize: '8px', color: '#555', marginBottom: '3px' }}>{i + 1}. {t}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuotationBuilderContent() {
  const [activeTab, setActiveTab] = useState<"client" | "rooms" | "finance" | "payment" | "drafts">("client");
  const [data, setData] = useState<QuoteData>({
    version: 2,
    client: { name: "", phone: "", address: "" },
    quote: { 
      number: "MF/2026/DRAFT", 
      date: todayISODate(), 
      validityDays: 15, 
      siteName: "", 
      salesPerson: "Senior Consultant" 
    },
    rooms: [newRoom("General Area")],
    charges: {
      packingPercent: 0,
      loadingCharge: 0,
      gstPercent: 18,
      gstMode: "excluded",
      splitCgstSgst: true,
      overallDiscountValue: 0,
      overallDiscountType: "flat",
    },
    payment: { upiId: "maple@bank", bankName: "Heritage Bank", accountName: "Maple Furnishers", accountNumber: "", ifsc: "" },
    updatedAt: Date.now(),
  });
  
  const [terms, setTerms] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // FEATURE 1 — UNDO/REDO
  const [history, setHistory] = useState<QuoteData[]>([]);
  const [future, setFuture] = useState<QuoteData[]>([]);

  function selectTab(tab: typeof activeTab) {
    setActiveTab(tab);
  }

  function openTemplates() {
    setShowTemplates(true);
  }

  const updateData = (newData: QuoteData | ((prev: QuoteData) => QuoteData)) => {
    setHistory(h => [...h.slice(-49), data]);
    setFuture([]);
    if (typeof newData === 'function') {
      setData(prev => newData(prev));
    } else {
      setData(newData);
    }
  };

  function undo() {
    if (!history.length) return;
    setFuture(f => [data, ...f]);
    setData(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
    toast("Undone");
  }

  function redo() {
    if (!future.length) return;
    setHistory(h => [...h, data]);
    setData(future[0]);
    setFuture(f => f.slice(1));
    toast("Redone");
  }

  // FEATURE 2 — TOAST SYSTEM
  const [toasts, setToasts] = useState<{id:string; msg:string; type:string}[]>([]);
  function toast(msg: string, type = "success") {
    const id = makeId();
    setToasts(t => [...t, {id, msg, type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }

  const computed = useMemo(() => computeTotals(data), [data]);

  // FEATURE 3 — KEYBOARD SHORTCUTS
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveDraft(); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); onGeneratePdf(); }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); if(confirm("Start new quote?")) window.location.reload(); }
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.shiftKey && e.key === 'z') { e.preventDefault(); redo(); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [data, history, future]);

  // Persist last state
  useEffect(() => {
    localStorage.setItem(LS_KEY_LAST, JSON.stringify(data));
  }, [data]);

  // Load drafts, terms, last session, and check share link
  useEffect(() => {
    // FEATURE 5 — SHARE LINK CHECK
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    if (qParam) {
      try {
        const decoded = JSON.parse(atob(qParam));
        if (decoded.version === 2) {
          setData(decoded);
          toast("Shared quote loaded ✓");
          return; // Skip loading last session if shared quote exists
        }
      } catch {}
    }

    const last = safeParse<QuoteData>(localStorage.getItem(LS_KEY_LAST));
    if (last && last.version === 2) {
      setData(last);
    } else {
      setData(prev => ({
        ...prev,
        quote: { ...prev.quote, number: `MF/2026/Q-${Math.floor(Math.random()*1000).toString().padStart(3, '0')}` }
      }));
    }

    const loadedDrafts = safeParse<Draft[]>(localStorage.getItem(LS_KEY_DRAFTS)) || [];
    setDrafts(loadedDrafts);
    const loadedTerms = safeParse<string[]>(localStorage.getItem(LS_KEY_TERMS)) || [
      "50% Advance at the time of booking.",
      "40% After completion of woodwork structure.",
      "10% Before delivery of items.",
      "GST will be extra as applicable.",
      "Transportation and loading extra if not mentioned.",
    ];
    setTerms(loadedTerms);
  }, []);

  function saveDraft() {
    const name = prompt("Enter draft name:", data.client.name || "Untitled Quote");
    if (!name) return;
    const newDraft: Draft = { id: makeId(), name, savedAt: Date.now(), data };
    const updated = [newDraft, ...drafts];
    setDrafts(updated);
    localStorage.setItem(LS_KEY_DRAFTS, JSON.stringify(updated));
    toast("Draft saved ✓");
  }

  function deleteDraft(id: string) {
    if (!confirm("Delete this draft?")) return;
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem(LS_KEY_DRAFTS, JSON.stringify(updated));
    toast("Draft deleted");
  }

  function updateRoom(roomIndex: number, patch: Partial<QuoteRoom>) {
    updateData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r, i) => (i === roomIndex ? { ...r, ...patch } : r)),
    }));
  }

  function deleteRoom(roomIndex: number) {
    if (data.rooms.length <= 1) return;
    if (!confirm("Delete this entire room?")) return;
    updateData(prev => ({ ...prev, rooms: prev.rooms.filter((_, i) => i !== roomIndex) }));
  }

  function updateItem(roomIndex: number, itemIndex: number, patch: Partial<QuoteItem>) {
    updateData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r, i) =>
        i !== roomIndex ? r : { ...r, items: r.items.map((it, ii) => (ii === itemIndex ? { ...it, ...patch } : it)) },
      ),
    }));
  }

  async function handleImageUpload(roomIdx: number, itemIdx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      updateItem(roomIdx, itemIdx, { imageUrl: b64 });
    };
    reader.readAsDataURL(file);
  }

  function deleteItem(roomIdx: number, itemIdx: number) {
    updateData(prev => {
      const rooms = [...prev.rooms];
      rooms[roomIdx].items = rooms[roomIdx].items.filter((_, i) => i !== itemIdx);
      return { ...prev, rooms };
    });
  }

  function addRoom() {
    updateData((prev) => ({ ...prev, rooms: [...prev.rooms, newRoom("")] }));
  }

  function addItem(roomIndex: number, template?: any) {
    updateData((prev) => {
      const rooms = [...prev.rooms];
      rooms[roomIndex].items.push(newItem(template));
      return { ...prev, rooms };
    });
  }

  async function onGeneratePdf() {
    toast("Generating PDF...", "success");
    const blob = await pdf(<MasterProposalPdf data={data} computed={computed} terms={terms} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    toast("PDF generated ✓");
  }

  async function onImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        const newRooms: QuoteRoom[] = [newRoom("Imported Inventory")];
        rows.forEach(row => {
          newRooms[0].items.push(newItem({
            category: String(row.Category || row.category || ""),
            description: String(row.Description || row.description || ""),
            price: toNumber(row.Price || row.price || 0),
            quantity: toNumber(row.Quantity || row.quantity || 1),
            unitType: (row.Unit || row.unit || "nos") as UnitType,
            material: String(row.Material || ""),
          }));
        });
        updateData(prev => ({ ...prev, rooms: [...prev.rooms, ...newRooms] }));
        toast("Excel imported ✓");
      } catch (err) { toast("Excel import failed", "error"); }
    };
    reader.readAsBinaryString(file);
  }

  function shareQuote() {
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?q=${encoded}`;
    navigator.clipboard.writeText(url);
    toast("Share link copied to clipboard ✓");
  }

  const applyTemplate = (type: 1 | 2 | 3) => {
    if (!confirm("Apply this template? Current data will be replaced.")) return;
    
    let templateData: QuoteData = { ...data, updatedAt: Date.now() };

    if (type === 1) { // Living Room Package
      templateData.rooms = [{
        id: makeId(),
        name: "Living Room",
        roomDiscountValue: 0,
        roomDiscountType: "flat",
        moodBoard: [],
        items: [
          newItem({ category: "Sofa Set", description: "Premium fabric 3+2 seater", price: 85000, quantity: 1, unitType: "set" }),
          newItem({ category: "TV Console", description: "Wall mounted with storage", price: 35000, quantity: 1, unitType: "nos" }),
          newItem({ category: "Coffee Table", description: "Marble top center table", price: 22000, quantity: 1, unitType: "nos" }),
          newItem({ category: "Display Unit", description: "Glass door cabinet", price: 45000, quantity: 1, unitType: "nos" }),
        ]
      }];
    } else if (type === 2) { // Full Home
      templateData.rooms = ["Living Room", "Master Bedroom", "Kitchen", "Bathroom"].map(name => ({
        id: makeId(),
        name,
        roomDiscountValue: 0,
        roomDiscountType: "flat",
        moodBoard: [],
        items: [
          newItem({ category: `${name} Item 1`, price: 50000, quantity: 1, unitType: "nos" }),
          newItem({ category: `${name} Item 2`, price: 30000, quantity: 1, unitType: "nos" }),
        ]
      }));
    } else if (type === 3) { // Bedroom Set
      templateData.rooms = [{
        id: makeId(),
        name: "Master Bedroom",
        roomDiscountValue: 0,
        roomDiscountType: "flat",
        moodBoard: [],
        items: [
          newItem({ category: "King Bed", description: "Engineered wood with storage", price: 180000, quantity: 1, unitType: "nos" }),
          newItem({ category: "Wardrobe", description: "4-door sliding wardrobe", price: 95000, quantity: 1, unitType: "nos" }),
          newItem({ category: "Side Tables", description: "Pair of matching tables", price: 35000, quantity: 1, unitType: "nos" }),
        ]
      }];
    }

    updateData(templateData);
    setShowTemplates(false);
    toast("Template applied ✓");
  };

  function seedSampleData() {
    // Keep existing seed logic but use updateData and toast
    const samples: Draft[] = Array.from({ length: 5 }).map((_, i) => {
      const id = makeId();
      const sampleData: QuoteData = {
        version: 2,
        client: { name: `Demo Client ${i+1}`, phone: `99999999${i}`, address: "Sample Address" },
        quote: { number: `MF/2026/DEMO-${i+1}`, date: todayISODate(), validityDays: 15, siteName: "Demo Site", salesPerson: "Demo User" },
        rooms: [newRoom("Living Area")],
        charges: { packingPercent: 0, loadingCharge: 0, gstPercent: 18, gstMode: "excluded", splitCgstSgst: true, overallDiscountValue: 0, overallDiscountType: "flat" },
        payment: { upiId: "maple@bank", bankName: "Heritage Bank", accountName: "Maple Furnishers", accountNumber: "", ifsc: "" },
        updatedAt: Date.now()
      };
      return { id, name: `Demo: ${sampleData.client.name}`, savedAt: Date.now(), data: sampleData };
    });
    setDrafts(prev => [...samples, ...prev]);
    localStorage.setItem(LS_KEY_DRAFTS, JSON.stringify([...samples, ...drafts]));
    toast("Sample drafts added");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-[240px] flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg shadow-[var(--accent-glow)]">
              <img src={MAPLE_LOGO_B64} alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <div>
              <div className="text-[14px] font-bold leading-tight tracking-tight">Maple</div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Quotation Suite</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-3 mt-6 space-y-1">
          <div className="px-3 mb-2">
            <span className="section-label">Navigation</span>
          </div>
          {[
            { id: "client", label: "Overview", icon: "▤" },
            { id: "rooms", label: "Rooms & Items", icon: "❖" },
            { id: "finance", label: "Finance & T&C", icon: "±" },
            { id: "payment", label: "Settlement", icon: "💳" },
            { id: "drafts", label: "Archives", icon: "📂" },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => selectTab(item.id as typeof activeTab)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="text-base opacity-70">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mx-3 mb-6 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label">System Time</span>
            <LiveClock />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>Shortcuts</span>
              <span className="kbd">CTRL+?</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-[9px] text-[var(--text-muted)] font-medium"><span className="kbd mr-1">S</span> Save</div>
              <div className="text-[9px] text-[var(--text-muted)] font-medium"><span className="kbd mr-1">P</span> PDF</div>
              <div className="text-[9px] text-[var(--text-muted)] font-medium"><span className="kbd mr-1">Z</span> Undo</div>
              <div className="text-[9px] text-[var(--text-muted)] font-medium"><span className="kbd mr-1">N</span> New</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* TOP BAR */}
        <header className="topbar">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group">
              <span className="text-[var(--text-muted)] text-sm">#</span>
              <input 
                value={data.quote.number} 
                onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, number: e.target.value }}))}
                className="bg-transparent border-none text-sm font-bold focus:outline-none w-40 text-[var(--text)] group-hover:text-[var(--accent)] transition-colors"
                placeholder="QUOTE-NO"
              />
            </div>
            <div className="divider-v h-4" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse-glow" />
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Live Editing</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--bg-elevated)] rounded-lg p-0.5 border border-[var(--border)] mr-2">
              <button type="button" onClick={undo} className="maple-btn-icon" title="Undo (Ctrl+Z)">↺</button>
              <button type="button" onClick={redo} className="maple-btn-icon" title="Redo (Ctrl+Shift+Z)">↻</button>
            </div>
            
            <button type="button" onClick={openTemplates} className="maple-btn-secondary h-8">Templates</button>
            <button type="button" onClick={shareQuote} className="maple-btn-secondary h-8">Share</button>
            <button type="button" onClick={saveDraft} className="maple-btn-secondary h-8">Save Draft</button>
            <button type="button" onClick={onGeneratePdf} className="maple-btn-primary h-8">Generate PDF</button>
          </div>
        </header>


        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section className="contents">
          
          {activeTab === "client" && (
            <div className="max-w-4xl space-y-6 animate-slide-up">
              <div className="card p-8">
                <h2 className="section-heading">Client Information</h2>
                <div className="grid grid-cols-2 gap-6">
                  <InputLabel label="Client Full Name">
                    <TextInput value={data.client.name} onChange={(e) => updateData(p => ({ ...p, client: { ...p.client, name: e.target.value }}))} placeholder="e.g. Vimal Gupta" />
                  </InputLabel>
                  <InputLabel label="Contact Phone">
                    <TextInput value={data.client.phone} onChange={(e) => updateData(p => ({ ...p, client: { ...p.client, phone: e.target.value }}))} placeholder="+91" />
                  </InputLabel>
                  <div className="col-span-2">
                    <InputLabel label="Project Site / Delivery Address">
                      <TextArea value={data.client.address} onChange={(e) => updateData(p => ({ ...p, client: { ...p.client, address: e.target.value }}))} rows={3} placeholder="Full address..." />
                    </InputLabel>
                  </div>
                </div>
              </div>

              <div className="card p-8">
                <h2 className="section-heading">Proposal Configuration</h2>
                <div className="grid grid-cols-2 gap-6">
                  <InputLabel label="Quote Identifier">
                    <TextInput value={data.quote.number} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, number: e.target.value }}))} />
                  </InputLabel>
                  <InputLabel label="Submission Date">
                    <TextInput type="date" value={data.quote.date} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, date: e.target.value }}))} />
                  </InputLabel>
                  <InputLabel label="Validity Period (Days)">
                    <NumberInput value={data.quote.validityDays} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, validityDays: toNumber(e.target.value) }}))} />
                  </InputLabel>
                  <InputLabel label="Sales Executive">
                    <TextInput value={data.quote.salesPerson} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, salesPerson: e.target.value }}))} />
                  </InputLabel>
                  <InputLabel label="Project / Site Name">
                    <TextInput value={data.quote.siteName} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, siteName: e.target.value }}))} placeholder="e.g. Skyline Residency" />
                  </InputLabel>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rooms" && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center justify-between bg-[var(--bg-elevated)]/30 p-4 rounded-xl border border-[var(--border-subtle)]">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)]">Project Inventory</h2>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-0.5">Allocation by Room & Category</p>
                </div>
                <div className="flex gap-3">
                  <label className="maple-btn-secondary h-9 cursor-pointer">
                    <span>📥 Import Excel</span>
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={onImportExcel} />
                  </label>
                  <button onClick={addRoom} className="maple-btn-primary h-9">+ Create Room</button>
                </div>
              </div>

              {data.rooms.map((room, rIdx) => (
                <div key={room.id} className="card overflow-hidden border-[var(--border-subtle)] shadow-lg hover:border-[var(--border)] transition-base">
                  <div className="room-header">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)]">
                        {rIdx + 1}
                      </div>
                      <input 
                        value={room.name} 
                        onChange={(e) => updateRoom(rIdx, { name: e.target.value })} 
                        className="room-name-input" 
                        placeholder="Room Name (e.g. Master Bedroom)..." 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-neutral">{room.items.length} items</span>
                      <div className="divider-v h-4 mx-2" />
                      <Select className="h-8 w-44 text-[10px]" onChange={(e) => {
                        const t = TEMPLATES.find(t => t.label === e.target.value);
                        if(t) addItem(rIdx, t);
                      }}>
                        <option value="">Quick Add Template...</option>
                        {TEMPLATES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                      </Select>
                      <button onClick={() => addItem(rIdx)} className="maple-btn-secondary h-8 px-3 text-[10px]">+ Item</button>
                      <button onClick={() => deleteRoom(rIdx)} className="maple-btn-icon danger ml-1">✕</button>
                    </div>
                  </div>

                  {room.items.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">🛋️</div>
                      <div className="empty-state-title">Room is empty</div>
                      <p className="empty-state-desc">Add items manually or use a template to populate this room with inventory.</p>
                      <button onClick={() => addItem(rIdx)} className="maple-btn-primary h-8 px-4 mt-2">Add First Item</button>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="maple-table">
                      <thead>
                        <tr>
                          <th className="w-[40%]">Item & Specification</th>
                          <th className="w-[20%]">Technical Detail</th>
                          <th className="w-[25%]">Commercials</th>
                          <th className="text-right w-[15%]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.items.map((item, iIdx) => (
                          <tr key={item.id} className="group">
                            <td>
                              <div className="flex gap-4">
                                <div className="item-img-box">
                                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20 text-xl">📸</div>}
                                  <label className="item-img-overlay">
                                    REPLACE
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(rIdx, iIdx, e)} />
                                  </label>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                  <input 
                                    value={item.category} 
                                    onChange={(e) => updateItem(rIdx, iIdx, { category: e.target.value })} 
                                    className="w-full bg-transparent border-none font-bold text-[14px] text-[var(--text)] focus:outline-none" 
                                    placeholder="Item Category..."
                                  />
                                  <textarea 
                                    value={item.description} 
                                    onChange={(e) => updateItem(rIdx, iIdx, { description: e.target.value })} 
                                    className="w-full bg-transparent border-none text-[12px] text-[var(--text-secondary)] focus:outline-none resize-none h-14 leading-relaxed"
                                    placeholder="Brief description or notes..."
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <InputLabel label="Material"><TextInput className="h-7 text-[10px] px-2" value={item.material} onChange={(e) => updateItem(rIdx, iIdx, { material: e.target.value })} /></InputLabel>
                                  <InputLabel label="Fabric"><TextInput className="h-7 text-[10px] px-2" value={item.fabric} onChange={(e) => updateItem(rIdx, iIdx, { fabric: e.target.value })} /></InputLabel>
                                </div>
                                <div>
                                  <span className="section-label mb-1.5 block">Size (L × W × H)</span>
                                  <div className="flex gap-1">
                                    {(['l', 'w', 'h'] as Array<keyof NonNullable<QuoteItem['dimensions']>>).map(d => (
                                      <NumberInput key={d} placeholder={d.toUpperCase()} className="h-7 text-[10px] px-1 text-center" value={item.dimensions?.[d]} onChange={(e) => updateItem(rIdx, iIdx, { dimensions: { ...item.dimensions!, [d]: toNumber(e.target.value) } })} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                                <InputLabel label="Unit Rate"><NumberInput className="h-8 font-bold" value={item.price} onChange={(e) => updateItem(rIdx, iIdx, { price: toNumber(e.target.value) })} /></InputLabel>
                                <InputLabel label="Type"><Select className="h-8 text-[10px] px-1" value={item.unitType} onChange={(e) => updateItem(rIdx, iIdx, { unitType: e.target.value as any })}>
                                  <option value="nos">NOS</option><option value="set">SET</option><option value="sqft">SQFT</option><option value="rft">RFT</option>
                                </Select></InputLabel>
                                <InputLabel label="Unit Value"><NumberInput className="h-8" value={item.unitValue} onChange={(e) => updateItem(rIdx, iIdx, { unitValue: toNumber(e.target.value) })} /></InputLabel>
                                <InputLabel label="Quantity"><NumberInput className="h-8" value={item.quantity} onChange={(e) => updateItem(rIdx, iIdx, { quantity: toNumber(e.target.value) })} /></InputLabel>
                              </div>
                            </td>
                            <td className="text-right">
                              <div className="text-[14px] font-bold text-[var(--text)] tabular-nums">{money((item.price || 0) * (item.unitValue || 1) * (item.quantity || 1))}</div>
                              <button onClick={() => deleteItem(rIdx, iIdx)} className="text-[10px] text-[var(--red)] font-bold uppercase mt-6 opacity-0 group-hover:opacity-100 transition-base hover:underline">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}

                  {/* Room Footer */}
                  <div className="px-6 py-4 bg-[var(--bg-elevated)]/20 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <span className="section-label">Room Discount</span>
                        <div className="flex gap-1.5">
                          <NumberInput className="h-8 w-20 px-2" value={room.roomDiscountValue} onChange={(e) => updateRoom(rIdx, { roomDiscountValue: toNumber(e.target.value) })} />
                          <Select className="h-8 w-24 text-[10px] px-1" value={room.roomDiscountType} onChange={(e) => updateRoom(rIdx, { roomDiscountType: e.target.value as any })}>
                            <option value="flat">Flat ₹</option><option value="percent">% Off</option>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="section-label mr-3">Room Net:</span>
                      <span className="text-lg font-bold text-[var(--accent)] tabular-nums">{money(computed.summaryByRoom[rIdx]?.net)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}


          {activeTab === "finance" && (
            <div className="max-w-3xl space-y-6 animate-slide-up">
              <div className="card p-8">
                <h2 className="section-heading">Financial Adjustments</h2>
                <div className="grid grid-cols-2 gap-6">
                  <InputLabel label="Global Discount">
                    <div className="flex gap-2">
                      <NumberInput value={data.charges.overallDiscountValue} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, overallDiscountValue: toNumber(e.target.value) }}))} />
                      <Select className="w-32" value={data.charges.overallDiscountType} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, overallDiscountType: e.target.value as any }}))}>
                        <option value="flat">Flat ₹</option><option value="percent">% Off</option>
                      </Select>
                    </div>
                  </InputLabel>
                  <InputLabel label="GST Configuration">
                    <div className="flex gap-2">
                      <NumberInput placeholder="Rate %" value={data.charges.gstPercent} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, gstPercent: toNumber(e.target.value) }}))} />
                      <Select className="w-32" value={data.charges.gstMode} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, gstMode: e.target.value as any }}))}>
                        <option value="excluded">Extra</option><option value="included">Inclusive</option>
                      </Select>
                    </div>
                  </InputLabel>
                  <InputLabel label="Packing & Handling (%)">
                    <NumberInput value={data.charges.packingPercent} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, packingPercent: toNumber(e.target.value) }}))} />
                  </InputLabel>
                  <InputLabel label="Logistics / Loading (₹)">
                    <NumberInput value={data.charges.loadingCharge} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, loadingCharge: toNumber(e.target.value) }}))} />
                  </InputLabel>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-[var(--accent-dim)] border border-[var(--accent)]/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Split GST into CGST & SGST (9%+9%)</span>
                  </div>
                  <button 
                    onClick={() => updateData(p => ({ ...p, charges: { ...p.charges, splitCgstSgst: !p.charges.splitCgstSgst }}))}
                    className={`w-10 h-5 rounded-full transition-base relative ${data.charges.splitCgstSgst ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)]'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-base ${data.charges.splitCgstSgst ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="card p-8">
                <h2 className="section-heading">Terms & Conditions</h2>
                <div className="space-y-4">
                  {terms.map((t, i) => (
                    <div key={i} className="flex gap-4 group items-start">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center border border-[var(--border)] shrink-0 mt-1">
                        <span className="text-[10px] font-bold text-[var(--text-muted)]">{i+1}</span>
                      </div>
                      <TextArea value={t} rows={2} className="text-[13px] py-3 px-4 leading-relaxed" onChange={(e) => {
                        const n = [...terms]; n[i] = e.target.value; setTerms(n);
                      }} />
                      <button onClick={() => setTerms(p => p.filter((_, idx) => idx !== i))} className="maple-btn-icon danger mt-2 opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setTerms(p => [...p, "New condition..."])} className="w-full py-4 border-2 border-dashed border-[var(--border)] rounded-xl text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-base bg-transparent">
                    + Append New Term
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="max-w-2xl animate-slide-up">
              <div className="card p-8">
                <h2 className="section-heading">Settlement Accounts</h2>
                <div className="space-y-6">
                  <InputLabel label="Digital Payments (UPI ID / VPA)">
                    <TextInput value={data.payment.upiId} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, upiId: e.target.value }}))} placeholder="e.g. maplefurnishers@axis" />
                  </InputLabel>
                  <div className="divider" />
                  <div className="grid grid-cols-2 gap-6">
                    <InputLabel label="Bank Institution"><TextInput value={data.payment.bankName} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, bankName: e.target.value }}))} /></InputLabel>
                    <InputLabel label="Account Holder"><TextInput value={data.payment.accountName} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, accountName: e.target.value }}))} /></InputLabel>
                    <InputLabel label="Account Number"><TextInput value={data.payment.accountNumber} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, accountNumber: e.target.value }}))} /></InputLabel>
                    <InputLabel label="IFSC Branch Code"><TextInput value={data.payment.ifsc} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, ifsc: e.target.value }}))} /></InputLabel>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "drafts" && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Archives & Drafts</h2>
                <button onClick={seedSampleData} className="maple-btn-secondary h-9 px-4 text-[11px]">+ Seed Sample Data</button>
              </div>
              
              {drafts.length === 0 ? (
                <div className="card p-20 empty-state border-dashed">
                  <div className="empty-state-icon text-4xl mb-4">🗄️</div>
                  <div className="empty-state-title text-lg">No drafts archived</div>
                  <p className="empty-state-desc">Your saved quotations will appear here for quick retrieval and versioning.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {drafts.map(d => (
                    <div key={d.id} className="draft-card group">
                      <button onClick={() => { if(confirm("Load draft?")) setData(d.data); }} className="w-full text-left">
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-xl">📄</div>
                          <div className="text-right">
                            <div className="text-[14px] font-bold text-[var(--accent)]">{money(computeTotals(d.data).totals.grandTotal)}</div>
                            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-bold mt-1">{d.data.rooms.length} Rooms</div>
                          </div>
                        </div>
                        <div className="font-bold text-[14px] text-[var(--text)] truncate mb-1">{d.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                          {new Date(d.savedAt).toLocaleDateString()} at {new Date(d.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </button>
                      <button onClick={() => deleteDraft(d.id)} className="maple-btn-icon danger absolute top-3 right-3 opacity-0 group-hover:opacity-100 scale-90">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </section>
        </div>
      </main>

      {/* LIVE PREVIEW PANEL */}
      <aside className="w-[360px] border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col overflow-hidden shrink-0">
        <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg)]/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
          <div>
            <h3 className="text-[13px] font-bold">Summary & Preview</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Real-time sync</span>
            </div>
          </div>
          <div className="flex gap-1.5">
             <button onClick={onGeneratePdf} className="maple-btn-icon" title="Preview Full PDF">⬈</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="card p-5 bg-[var(--bg-elevated)]/30 border-[var(--border)] shadow-xl">
            <h4 className="section-label mb-4">Financial Overview</h4>
            <div className="space-y-0.5">
              {computed.totals.lines.map(line => (
                <div key={line.key} className={`fin-line ${line.isLast ? 'grand' : ''}`}>
                  <span className="fin-line-label">{line.label}</span>
                  <span className={`fin-line-value ${line.isLast ? 'large' : ''} ${line.emphasis ? 'accent' : ''}`}>{money(line.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden bg-white border-transparent">
            <div className="px-4 py-2 bg-[#f8f9fa] border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Proposal Preview</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">DRAFT</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto transform origin-top hover:scale-[1.02] transition-base">
              <LivePreviewPanel data={data} computed={computed} terms={terms} />
            </div>
          </div>
        </div>
      </aside>


      {/* TOAST SYSTEM */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
      </div>

      {/* TEMPLATES MODAL */}
      {showTemplates && (
        <div className="modal-overlay">
          <div className="modal-box max-w-[500px]">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Proposal Templates</h3>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-1">Pre-configured Inventory Packages</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="maple-btn-icon">✕</button>
            </div>
            
            <div className="modal-body space-y-4">
              {[
                { type: 1, title: "Living Room Package", desc: "Sofa Set, TV Console, Coffee Table, Display Unit", items: 4, icon: "🛋️" },
                { type: 2, title: "Full Home Renovation", desc: "Living, Master Bedroom, Modular Kitchen, Bathroom", items: 12, icon: "🏠" },
                { type: 3, title: "Master Bedroom Set", desc: "King Size Bed, 4-Door Wardrobe, Pair of Side Tables", items: 3, icon: "🛏️" }
              ].map((temp) => (
                <div key={temp.type} className="card p-5 bg-[var(--bg-elevated)]/40 hover:border-[var(--accent)] transition-base group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-xl group-hover:scale-110 transition-base">{temp.icon}</div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text)]">{temp.title}</h4>
                        <span className="badge badge-accent mt-1">{temp.items} ITEMS</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[12px] text-[var(--text-secondary)] mb-5 leading-relaxed">Includes {temp.desc}. Perfect for quick estimates.</p>
                  <button onClick={() => applyTemplate(temp.type as any)} className="maple-btn-template w-full">Apply Template</button>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowTemplates(false)} className="maple-btn-secondary h-9 px-6">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
