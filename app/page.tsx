"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import { MAPLE_LOGO_B64 } from "./maple-logo-b64";

// Modular Imports
import { 
  QuoteData, QuoteItem, QuoteRoom, QuoteMeta, CompanyPayment, Draft, 
  UnitType, DiscountType, GstMode, TotalsResult 
} from "./lib/types";

import { 
  money, computeTotals, safeParse, newItem, newRoom, 
  makeId, todayISODate, toNumber, quickConvert, discountAmount 
} from "./lib/utils";
import { TEMPLATES } from "./lib/constants";

import { MasterProposalPdf } from "./components/PdfCatalog";
import { 
  LiveClock, InputLabel, TextInput, Select, TextArea, 
  NumberInput, BrandStyles, CreativeButton
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

function LivePreviewPanel({ data, computed, terms }: { data: QuoteData; computed: TotalsResult; terms: string[] }) {
  return (
    <div className="live-preview-panel flex-1 overflow-y-auto p-4">
      {!data.client.name ? (
        <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
          <div className="mb-3 h-7 w-6 rounded border border-[var(--border)] bg-[var(--bg-surface)]" />
          <p className="text-[11px] font-medium max-w-[220px]">Fill in client details to see preview</p>
        </div>
      ) : (
        <div style={{ background: 'white', color: '#111', padding: '24px', minHeight: '100%', fontSize: '11px', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #8a3535', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#8a3535' }}>MAPLE FURNISHERS</div>
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
              <div style={{ fontSize: '9px', color: '#999', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Ref No.</div>
              <div style={{ fontWeight: 800, fontSize: '12px' }}>{data.quote.number}</div>
              <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>{data.quote.date}</div>
            </div>
          </div>

          {data.rooms.map((room) => (
            <div key={room.id} style={{ marginBottom: '16px' }}>
              <div style={{ background: '#8a3535', color: 'white', padding: '6px 10px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '3px', marginBottom: '8px' }}>
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
                    <div style={{ fontWeight: 800, color: '#8a3535', fontSize: '13px' }}>₹{total.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
            {computed.totals.lines.map((line) => (
              <div key={line.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: line.emphasis ? 700 : 400, color: line.emphasis ? '#8a3535' : '#333', fontSize: line.emphasis ? '12px' : '9px' }}>
                <span>{line.label}</span>
                <span>₹{line.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {terms.length > 0 && (
            <div style={{ marginTop: '20px', padding: '12px', background: '#f8f8f8', borderRadius: '6px', border: '1px solid #eee' }}>
              <div style={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', color: '#8a3535', letterSpacing: '0.05em' }}>Terms & Conditions</div>
              {terms.map((t, i) => <div key={i} style={{ fontSize: '9px', color: '#444', marginBottom: '5px', lineHeight: '1.4' }}>{i + 1}. {t}</div>)}
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

  function addItem(roomIndex: number, template?: Partial<QuoteItem>) {
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

    const JSZip = (await import("jszip")).default;
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) return;

        // 1. Extract Data Rows using XLSX
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as Record<string, string | number>[];

        // 2. Extract Images using JSZip
        const zip = await JSZip.loadAsync(file);
        const mediaFolder = zip.folder("xl/media");
        const images: string[] = [];

        if (mediaFolder) {
          const mediaFiles = Object.keys(mediaFolder.files).sort((a, b) => {
            // Sort by number in filename (image1.png, image2.png...)
            const numA = parseInt(a.match(/\d+/)?.[0] || "0");
            const numB = parseInt(b.match(/\d+/)?.[0] || "0");
            return numA - numB;
          });

          for (const path of mediaFiles) {
            const fileData = await mediaFolder.file(path.split('/').pop()!)?.async("base64");
            if (fileData) {
              const ext = path.split('.').pop()?.toLowerCase() || "png";
              images.push(`data:image/${ext};base64,${fileData}`);
            }
          }
        }

        // 3. Map to Rooms/Items & Metadata
        const newRooms: QuoteRoom[] = [newRoom("Imported Inventory")];
        const metadata: any = {};
        
        rows.forEach((row, idx) => {
          // Check for global metadata in any row
          if (row['Client Name'] || row['client_name']) metadata.clientName = String(row['Client Name'] || row['client_name']);
          if (row['Phone'] || row['phone']) metadata.phone = String(row['Phone'] || row['phone']);
          if (row['Address'] || row['address']) metadata.address = String(row['Address'] || row['address']);
          if (row['Site'] || row['site'] || row['Project']) metadata.siteName = String(row['Site'] || row['site'] || row['Project']);
          if (row['Quote No'] || row['quote_no']) metadata.quoteNo = String(row['Quote No'] || row['quote_no']);

          newRooms[0].items.push(newItem({
            category: String(row.Category || row.category || row.Item || "New Item"),
            description: String(row.Description || row.description || ""),
            price: toNumber(row.Price || row.price || row.Rate || 0),
            quantity: toNumber(row.Quantity || row.quantity || row.Qty || 1),
            unitType: (row.Unit || row.unit || "nos") as UnitType,
            material: String(row.Material || row.material || ""),
            imageUrl: images[idx] || ""
          }));
        });

        updateData(prev => ({ 
          ...prev, 
          client: {
            ...prev.client,
            name: metadata.clientName || prev.client.name,
            phone: metadata.phone || prev.client.phone,
            address: metadata.address || prev.client.address,
          },
          quote: {
            ...prev.quote,
            number: metadata.quoteNo || prev.quote.number,
            siteName: metadata.siteName || prev.quote.siteName,
          },
          rooms: [...prev.rooms, ...newRooms] 
        }));
        toast(`Imported ${rows.length} items with metadata ✓`);
      } catch (err) {
        console.error(err);
        toast("Excel import failed", "error");
      }
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
    
    const templateData: QuoteData = { ...data, updatedAt: Date.now() };

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

  function seedFullSampleData() {
    const sample: QuoteData = {
      version: 2,
      client: { 
        name: "Oberoi Realty - Presidential Suite", 
        phone: "+91 92629 68727", 
        address: "Oberoi Commerz II, International Business Park, Oberoi Garden City, Goregaon (East), Mumbai, Maharashtra 400063" 
      },
      quote: { 
        number: "MF/PRO/2026/089", 
        date: todayISODate(), 
        validityDays: 30, 
        siteName: "Goregaon East Project", 
        salesPerson: "Arjun Sharma" 
      },
      rooms: [
        {
          id: makeId(),
          name: "Grand Living Area",
          roomDiscountValue: 15000,
          roomDiscountType: "flat",
          moodBoard: [],
          items: [
            newItem({ 
              category: "Heritage Chesterfield Sofa", 
              description: "Handcrafted 3-seater sofa with deep button tufting, upholstered in premium Italian leather (Oxblood Maroon). Solid teak wood frame with mahogany finish.",
              price: 185000, 
              quantity: 1, 
              unitType: "nos",
              material: "Teak Wood & Italian Leather",
              imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop"
            }),
            newItem({ 
              category: "Imperial Marble Coffee Table", 
              description: "Nero Marquina marble top with geometric brass inlay work. Tapered metal legs with antique gold finish.",
              price: 45000, 
              quantity: 1, 
              unitType: "nos",
              material: "Marble & Brass",
              imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=2069&auto=format&fit=crop"
            })
          ]
        },
        {
          id: makeId(),
          name: "Master Suite",
          roomDiscountValue: 5,
          roomDiscountType: "percent",
          moodBoard: [],
          items: [
            newItem({ 
              category: "Velvet Wingback Bed", 
              description: "King-sized bed with high-back velvet upholstery. Storage base with hydraulic lift mechanism.",
              price: 220000, 
              quantity: 1, 
              unitType: "nos",
              material: "Velvet & Engineered Wood",
              imageUrl: "https://images.unsplash.com/photo-1505693419148-43311b1348f2?q=80&w=2070&auto=format&fit=crop"
            }),
            newItem({ 
              category: "Antique Dresser", 
              description: "6-drawer dresser with hand-carved floral motifs and crystal knobs.",
              price: 65000, 
              quantity: 1, 
              unitType: "nos",
              material: "Solid Oak",
              imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1974&auto=format&fit=crop"
            })
          ]
        }
      ],
      charges: { 
        packingPercent: 2, 
        loadingCharge: 1500, 
        gstPercent: 18, 
        gstMode: "excluded", 
        splitCgstSgst: true, 
        overallDiscountValue: 10, 
        overallDiscountType: "percent" 
      },
      payment: { 
        upiId: "maplefurnishers@axis", 
        bankName: "Axis Bank", 
        accountName: "Maple Furnishers Private Limited", 
        accountNumber: "921020038847281", 
        ifsc: "UTIB0001293" 
      },
      updatedAt: Date.now()
    };
    setData(sample);
    setTerms([
      "50% Advance at the time of booking, 40% before dispatch, and 10% after installation.",
      "Delivery timeline: 4-6 weeks from the date of advance payment.",
      "Customized items cannot be returned or replaced once production starts.",
      "Standard 1-year warranty on manufacturing defects.",
      "GST as per government norms at the time of invoicing."
    ]);
    toast("Full sample data seeded ✓");
  }

  return (
    <div className="flex h-screen overflow-hidden font-outfit" style={{ background: '#09090b', color: '#f4f4f5' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-[240px] flex flex-col border-r border-[#1e1e23] shrink-0 z-30" style={{ background: '#09090b' }}>
        <div className="p-8">
          <div className="flex flex-col gap-1">
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif)' }}>MAPLE</h1>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#8a3535', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Quotation Suite</span>
          </div>
        </div>

        <nav className="flex-1 px-0 space-y-0 custom-scroll overflow-y-auto">
          <div style={{ padding: '20px 16px 8px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em', color: '#555560', textTransform: 'uppercase' }}>Navigation</span>
          </div>
          {[
            { id: "client", label: "Overview", icon: "▤" },
            { id: "rooms", label: "Inventory", icon: "❖" },
            { id: "finance", label: "Commercials", icon: "±" },
            { id: "payment", label: "Settlement", icon: "💳" },
            { id: "drafts", label: "Archives", icon: "📂" },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => selectTab(item.id as typeof activeTab)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              <span className="text-[12px] font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #1e1e23', padding: '24px 20px' }}>
          <div className="flex items-center justify-between mb-5">
            <span style={{ fontSize: '12px', color: '#7c7c8e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System time</span>
            <LiveClock />
          </div>
          <div className="space-y-4">
            {[
              { label: "Save Draft", key: "^S" },
              { label: "Export PDF", key: "^P" },
              { label: "Undo Change", key: "^Z" },
              { label: "New Quote", key: "^N" }
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center group cursor-pointer">
                <span style={{ fontSize: '13px', color: '#b0b0bc', transition: 'color 0.2s' }} className="group-hover:text-[#ffffff]">{item.label}</span>
                <span style={{ background: '#232329', border: '1px solid #38383f', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', color: '#7c7c8e', fontWeight: 700 }}>{item.key}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        <header className="topbar">
          <div className="flex items-center gap-3 mr-auto">
            <div className="flex flex-col bg-[#18181b] px-3 py-1 rounded-lg border border-[#2e2e33]">
              <span className="text-[8px] font-black text-[#555560] uppercase tracking-widest">Document №</span>
              <span className="text-[11px] font-bold text-[#ffffff]">{data.quote.number}</span>
            </div>
            <div className="w-[1px] h-4 bg-[#2e2e33]" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22c55e]/5 border border-[#22c55e]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wider">Live Editing</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#18181b] border border-[#2e2e33] rounded-xl p-1 gap-1">
              <button type="button" onClick={undo} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#232329] text-[#b0b0bc]">⟲</button>
              <button type="button" onClick={redo} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#232329] text-[#b0b0bc]">⟳</button>
            </div>
            <button type="button" onClick={() => setShowTemplates(true)} className="text-[12px] font-bold text-[#b0b0bc] hover:text-white px-3 transition-colors">Templates</button>
            <button type="button" onClick={shareQuote} className="text-[12px] font-bold text-[#b0b0bc] hover:text-white px-3 transition-colors">Share</button>
            <div className="w-[1px] h-6 bg-[#2e2e33] mx-1" />
            <CreativeButton onClick={() => { const id = makeId(); const d: Draft = { id, name: `Draft: ${data.client.name || 'Untitled'}`, savedAt: Date.now(), data }; setDrafts([d, ...drafts]); localStorage.setItem(LS_KEY_DRAFTS, JSON.stringify([d, ...drafts])); toast("Draft saved ✓"); }} variant="secondary" className="!h-9 !px-4">Save Draft</CreativeButton>
            <CreativeButton onClick={onGeneratePdf} className="!h-9 !px-4">Generate PDF</CreativeButton>
          </div>
        </header>


        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scroll" style={{ padding: '28px' }}>
          <section className="contents">
          
          {activeTab === "client" && (
            <div className="max-w-4xl space-y-6 animate-slide-up">
              <div className="card">
                <h2 className="section-heading">Client Information</h2>
                <div className="grid grid-cols-2 gap-5">
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

              <div className="card">
                <h2 className="section-heading">Proposal Configuration</h2>
                <div className="grid grid-cols-2 gap-5">
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
                  <div className="col-span-2">
                    <InputLabel label="Project / Site Name">
                      <TextInput value={data.quote.siteName} onChange={(e) => updateData(p => ({ ...p, quote: { ...p.quote, siteName: e.target.value }}))} placeholder="e.g. Skyline Residency" />
                    </InputLabel>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rooms" && (
            <div className="space-y-6 animate-slide-up">
              <div style={{ background: '#18181b', border: '1px solid #2e2e33', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Project Inventory</h2>
                  <p style={{ fontSize: '12px', color: '#888896', marginTop: '4px' }}>Allocation by Room & Category</p>
                </div>
                <div className="flex gap-3">
                  <label className="creative-btn secondary cursor-pointer !h-9 !px-5 !rounded-xl">
                    <span className="flex items-center gap-2">📥 Import Excel</span>
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={onImportExcel} />
                  </label>
                  <CreativeButton onClick={addRoom}>+ Create Room</CreativeButton>
                </div>
              </div>

              {data.rooms.map((room, rIdx) => (
                <div key={room.id} className="card overflow-hidden" style={{ padding: 0, marginBottom: '20px' }}>
                  <div className="room-header">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 rounded-full bg-[#8a3535] text-white flex items-center justify-center text-[12px] font-bold shrink-0">{rIdx + 1}</div>
                      <input
                        className="room-name-input !text-lg !font-bold flex-1"
                        value={room.name}
                        onChange={(e) => updateRoom(rIdx, { name: e.target.value })}
                        placeholder="Enter Room Name..."
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-[#0d0d0f] border border-[#2e2e33] rounded-xl px-3 h-9 gap-3">
                        <span className="text-[10px] font-bold text-[#7c7c8e] uppercase tracking-wider">{room.items.length} Items</span>
                        <div className="w-[1px] h-3 bg-[#2e2e33]" />
                        <Select 
                          className="!h-7 !border-none !bg-transparent !text-[12px] !w-40 !p-0"
                          value="" 
                          onChange={(e) => {
                            const t = TEMPLATES.find(t => t.label === e.target.value);
                            if(t) addItem(rIdx, t);
                          }}
                        >
                          <option value="">Quick Add Template...</option>
                          {TEMPLATES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                        </Select>
                      </div>
                      <CreativeButton onClick={() => addItem(rIdx)} variant="secondary" className="!h-9 !px-4">+ Item</CreativeButton>
                      <button onClick={() => deleteRoom(rIdx)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#f04747]/10 text-[#f04747] border border-[#f04747]/20 hover:bg-[#f04747] hover:text-white transition-all">✕</button>
                    </div>
                  </div>

                  {room.items.length === 0 ? (
                    <div className="empty-state" style={{ margin: '16px' }}>
                      <div className="empty-state-title">No items yet. Add your first item to this room.</div>
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
                                <div className="item-img-box group/img relative">
                                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20 text-xl">📸</div>}
                                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    <label className="text-[9px] font-bold text-white cursor-pointer hover:underline">
                                      LOCAL FILE
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(rIdx, iIdx, e)} />
                                    </label>
                                    <div className="w-full h-[1px] bg-white/20" />
                                    <button 
                                      onClick={() => {
                                        const url = prompt("Enter image URL:");
                                        if (url) updateItem(rIdx, iIdx, { imageUrl: url });
                                      }}
                                      className="text-[9px] font-bold text-white hover:underline"
                                    >
                                      FROM LINK
                                    </button>
                                  </div>
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
                                <div className="space-y-4 pr-6 min-w-[200px]">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-bold text-[#7c7c8e] uppercase ml-1">Material</span>
                                      <TextInput placeholder="Material..." className="!h-8 !text-[11px]" value={item.material} onChange={(e) => updateItem(rIdx, iIdx, { material: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-bold text-[#7c7c8e] uppercase ml-1">Fabric</span>
                                      <TextInput placeholder="Fabric..." className="!h-8 !text-[11px]" value={item.fabric} onChange={(e) => updateItem(rIdx, iIdx, { fabric: e.target.value })} />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 bg-[#18181b] p-2 rounded-lg border border-[#2e2e33]">
                                    <span className="text-[9px] font-bold text-[#7c7c8e] uppercase whitespace-nowrap">Size (L×W×H)</span>
                                    <div className="flex gap-1 flex-1">
                                      {(['l', 'w', 'h'] as Array<keyof NonNullable<QuoteItem['dimensions']>>).map(d => (
                                        <NumberInput key={d} placeholder={d.toUpperCase()} className="!h-7 !text-[10px] !px-1 text-center flex-1 !bg-[#0d0d0f]" value={item.dimensions?.[d]} onChange={(e) => updateItem(rIdx, iIdx, { dimensions: { ...item.dimensions!, [d]: toNumber(e.target.value) } })} />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-end gap-3 pr-6">
                                  <div className="space-y-1 w-24">
                                    <span className="text-[9px] font-bold text-[#7c7c8e] uppercase ml-1">Unit Rate</span>
                                    <NumberInput className="!h-10 !text-[14px] !font-bold" value={item.price} onChange={(e) => updateItem(rIdx, iIdx, { price: toNumber(e.target.value) })} />
                                  </div>
                                  <div className="space-y-1 w-20">
                                    <span className="text-[9px] font-bold text-[#7c7c8e] uppercase ml-1">Type</span>
                                    <Select className="!h-10 !text-[11px]" value={item.unitType} onChange={(e) => updateItem(rIdx, iIdx, { unitType: e.target.value as UnitType })}>
                                      <option value="nos">NOS</option><option value="set">SET</option><option value="sqft">SQFT</option><option value="rft">RFT</option>
                                    </Select>
                                  </div>
                                  <div className="space-y-1 w-16">
                                    <span className="text-[9px] font-bold text-[#7c7c8e] uppercase ml-1">U.Val</span>
                                    <NumberInput className="!h-10" value={item.unitValue} onChange={(e) => updateItem(rIdx, iIdx, { unitValue: toNumber(e.target.value) })} />
                                  </div>
                                  <div className="space-y-1 w-16">
                                    <span className="text-[9px] font-bold text-[#7c7c8e] uppercase ml-1">Qty</span>
                                    <NumberInput className="!h-10" value={item.quantity} onChange={(e) => updateItem(rIdx, iIdx, { quantity: toNumber(e.target.value) })} />
                                  </div>
                                </div>
                              </td>
                              <td className="text-right align-bottom pb-8">
                                <div className="text-[16px] font-black text-[#ffffff] tabular-nums mb-2">{money((item.price || 0) * (item.unitValue || 1) * (item.quantity || 1))}</div>
                                <button onClick={() => deleteItem(rIdx, iIdx)} className="text-[10px] text-[#f04747] font-bold uppercase hover:underline transition-base">Remove Item</button>
                              </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}

                  {/* Room Footer */}
                  <div className="px-6 py-4 flex items-center justify-between" style={{ background: '#111114', borderTop: '1px solid #1e1e23' }}>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <span className="section-label mb-0">Room Discount</span>
                        <div className="flex gap-2">
                          <NumberInput className="h-7 w-16 px-2 text-[11px]" value={room.roomDiscountValue} onChange={(e) => updateRoom(rIdx, { roomDiscountValue: toNumber(e.target.value) })} />
                          <Select className="h-7 w-20 text-[10px] px-1" value={room.roomDiscountType} onChange={(e) => updateRoom(rIdx, { roomDiscountType: e.target.value as DiscountType })}>
                            <option value="flat">₹ Flat</option><option value="percent">% Off</option>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="section-label mb-0 mr-3 inline-block">Room Net:</span>
                      <span className="text-lg font-bold text-[#8a3535] tabular-nums">{money(computed.summaryByRoom[rIdx]?.net)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}


          {activeTab === "finance" && (
            <div className="max-w-3xl space-y-6 animate-slide-up">
              <div className="card">
                <h2 className="section-heading">Financial Adjustments</h2>
                <div className="grid grid-cols-2 gap-5">
                  <InputLabel label="Global Discount">
                    <div className="flex gap-2">
                      <NumberInput value={data.charges.overallDiscountValue} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, overallDiscountValue: toNumber(e.target.value) }}))} />
                      <Select className="w-32" value={data.charges.overallDiscountType} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, overallDiscountType: e.target.value as DiscountType }}))}>
                        <option value="flat">Flat ₹</option><option value="percent">% Off</option>
                      </Select>
                    </div>
                  </InputLabel>
                  <InputLabel label="GST Configuration">
                    <div className="flex gap-2">
                      <NumberInput placeholder="Rate %" value={data.charges.gstPercent} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, gstPercent: toNumber(e.target.value) }}))} />
                      <Select className="w-32" value={data.charges.gstMode} onChange={(e) => updateData(p => ({ ...p, charges: { ...p.charges, gstMode: e.target.value as GstMode }}))}>
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
                <div className="mt-8 p-6 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(99,42,42,0.03)', border: '1px solid rgba(99,42,42,0.1)' }}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8a3535]" />
                      <span className="text-[14px] font-bold text-[#f4f4f6]">Tax Configuration</span>
                    </div>
                    <span className="text-[12px] text-[#88889a] ml-3.5">Split GST into CGST (9%) & SGST (9%) for regional compliance</span>
                  </div>
                  <button 
                    onClick={() => updateData(p => ({ ...p, charges: { ...p.charges, splitCgstSgst: !p.charges.splitCgstSgst }}))}
                    className={`w-12 h-6 rounded-full transition-all relative ${data.charges.splitCgstSgst ? 'bg-[#8a3535]' : 'bg-[#2e2e33]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${data.charges.splitCgstSgst ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="card">
                <h2 className="section-heading">Terms & Conditions</h2>
                <div className="space-y-4">
                  {terms.map((t, i) => (
                    <div key={i} className="flex gap-4 group items-start">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: '#232329', border: '1px solid #38383f' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#888896' }}>{i+1}</span>
                      </div>
                      <TextArea 
                        value={t} 
                        style={{ height: '44px', minHeight: '44px', maxHeight: '44px', padding: '12px 14px', overflowY: 'hidden', resize: 'none', fontSize: '13px', lineHeight: '1.4' }}
                        onChange={(e) => {
                          const n = [...terms]; n[i] = e.target.value; setTerms(n);
                        }} 
                      />
                      <button onClick={() => setTerms(p => p.filter((_, idx) => idx !== i))} className="maple-btn-icon danger mt-2 opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setTerms(p => [...p, "New condition..."])} style={{ width: '100%', padding: '14px', border: '1px dashed #2e2e33', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555560', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}>
                    + Append New Term
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="max-w-2xl animate-slide-up">
              <div className="card">
                <h2 className="section-heading">Settlement Accounts</h2>
                <div className="space-y-6">
                  <InputLabel label="Digital Payments (UPI ID / VPA)">
                    <TextInput value={data.payment.upiId} onChange={(e) => updateData(p => ({ ...p, payment: { ...p.payment, upiId: e.target.value }}))} placeholder="e.g. maplefurnishers@axis" />
                  </InputLabel>
                  <div className="h-[1px] my-6" style={{ background: '#2e2e33' }} />
                  <div className="grid grid-cols-2 gap-5">
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Saved Drafts</h2>
                  <p style={{ fontSize: '12px', color: '#888896', marginTop: '4px' }}>Saved locally in this browser</p>
                </div>
                <CreativeButton onClick={seedFullSampleData} variant="secondary" className="h-9 !px-4 text-[11px]">+ Seed Full Sample</CreativeButton>
              </div>

              {drafts.length === 0 ? (
                <div style={{ color: '#555560', textAlign: 'center', padding: '20px', border: '1px dashed #2e2e33', borderRadius: '8px', fontSize: '13px' }}>
                  No drafts yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {drafts.map(d => (
                    <div key={d.id} className="draft-card group">
                      <button onClick={() => { if(confirm("Load draft?")) setData(d.data); }} className="w-full text-left">
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#232329', border: '1px solid #38383f' }}>📄</div>
                          <div className="text-right">
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#8a3535' }}>{money(computeTotals(d.data).totals.grandTotal)}</div>
                            <div style={{ fontSize: '9px', color: '#888896', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: '4px' }}>{d.data.rooms.length} Rooms</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }} className="truncate mb-1">{d.name}</div>
                        <div style={{ fontSize: '11px', color: '#888896' }} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#2e2e33]" />
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

      {/* COMMAND CENTER (RIGHT DASHBOARD) */}
      <aside className="w-[400px] flex flex-col overflow-hidden shrink-0 z-20" style={{ background: '#09090b', borderLeft: '1px solid #1e1e23' }}>
        <div className="p-7 border-b border-[#1e1e23] bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em] font-serif">Command Center</h3>
              <span className="text-[9px] text-[#555560] font-bold mt-1 uppercase tracking-widest">Global Action Hub</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22c55e]/5 border border-[#22c55e]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[9px] font-black text-[#22c55e] uppercase tracking-tighter">Live Sync</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowTemplates(true)} className="flex flex-col items-start justify-between p-4 rounded-2xl bg-[#111114] border border-[#2e2e33] hover:border-[#8a3535] transition-all group h-24">
              <span className="text-xl group-hover:scale-110 transition-transform bg-[#18181b] w-10 h-10 flex items-center justify-center rounded-xl border border-[#2e2e33]">❖</span>
              <span className="text-[10px] font-bold text-[#b0b0bc] uppercase tracking-wider">Templates</span>
            </button>
            <button onClick={shareQuote} className="flex flex-col items-start justify-between p-4 rounded-2xl bg-[#111114] border border-[#2e2e33] hover:border-[#8a3535] transition-all group h-24">
              <span className="text-xl group-hover:scale-110 transition-transform bg-[#18181b] w-10 h-10 flex items-center justify-center rounded-xl border border-[#2e2e33]">🔗</span>
              <span className="text-[10px] font-bold text-[#b0b0bc] uppercase tracking-wider">Share Link</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-7 space-y-10">
          {/* Financial Summary */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-[#7c7c8e] uppercase tracking-[0.15em]">Financial Summary</span>
              <span className="text-[9px] font-bold text-[#555560] uppercase tracking-tighter">SEC: {data.rooms.length} Units</span>
            </div>
            
            <div className="bg-[#111114] rounded-2xl overflow-hidden border border-[#1e1e23] relative">
              {/* Halftone Texture Overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '4px 4px' }} />
              
              <div className="p-5 space-y-3.5 relative">
                {computed.totals.lines.filter(l => !l.isLast).map(line => (
                  <div key={line.key} className="flex justify-between items-center group/line border-b border-[#ffffff]/[0.02] pb-2 last:border-0">
                    <div className="flex flex-col">
                      <span className={`text-[12px] transition-colors ${line.emphasis ? 'font-bold text-white' : 'text-[#888896] group-hover/line:text-[#b0b0bc]'}`}>
                        {line.label}
                      </span>
                    </div>
                    <span className={`text-[12px] tabular-nums font-medium ${line.emphasis ? 'text-white' : 'text-[#e4e4e7]'}`}>
                      {money(line.value)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="bg-[#8a3535] p-6 border-t border-[#ffffff]/10 relative overflow-hidden group/seal">
                {/* Perforated Edge Effect */}
                <div className="absolute top-0 left-0 right-0 h-[2px] flex justify-between gap-1 px-1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#111114] -translate-y-1/2" />
                  ))}
                </div>
                
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em] mb-1">Grand Total</span>
                    <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">Official Seal of Value</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[26px] font-black text-white tabular-nums tracking-tighter drop-shadow-lg">
                      {money(computed.totals.grandTotal)}
                    </div>
                  </div>
                </div>
                
                {/* Subtle Barcode */}
                <div className="flex gap-[1px] mt-4 opacity-20 group-hover/seal:opacity-40 transition-opacity">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} style={{ width: Math.random() > 0.5 ? '1px' : '2px', height: '12px' }} className="bg-white" />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Professional Review */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-[#7c7c8e] uppercase tracking-[0.15em]">Professional Review</span>
              <button onClick={onGeneratePdf} className="text-[9px] font-black text-[#8a3535] uppercase tracking-widest hover:underline transition-base">Popout PDF ⬈</button>
            </div>
            
            <div className="relative group">
              <div className="aspect-[3/4.2] overflow-hidden rounded-2xl bg-white shadow-2xl relative ring-1 ring-white/10 group-hover:ring-[#8a3535]/50 transition-all duration-500">
                {!data.client.name ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8f9fa] p-8 text-center">
                    <div className="text-3xl mb-4 opacity-20">👤</div>
                    <div className="text-[13px] font-bold text-[#1a1a1a] mb-2">Missing Client Data</div>
                    <p className="text-[11px] text-[#7d6e63] leading-relaxed">Fill in the overview section to generate the professional proposal preview.</p>
                  </div>
                ) : (
                  <div className="origin-top scale-[0.65] w-[153.8%] h-[153.8%] absolute top-0 left-0">
                    <LivePreviewPanel data={data} computed={computed} terms={terms} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px] gap-4">
                  <CreativeButton onClick={onGeneratePdf} className="!rounded-full shadow-xl">Full Screen Preview</CreativeButton>
                  <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Click to Expand</span>
                </div>
              </div>
            </div>
          </section>
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
                  <CreativeButton onClick={() => applyTemplate(temp.type as 1 | 2 | 3)} className="w-full !rounded-xl !h-10">Apply Template</CreativeButton>
                  </div>
                ))}
              </div>
  
              <div className="modal-footer">
                <CreativeButton onClick={() => setShowTemplates(false)} variant="secondary" className="h-10 !px-8 !rounded-xl">Close</CreativeButton>
              </div>
          </div>
        </div>
      )}

    </div>
  );
}
