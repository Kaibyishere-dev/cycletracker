'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, AlertTriangle, Clock, CheckCircle, Filter, X, Bell, ChevronRight, Calendar, MessageSquareOff, RefreshCw, Recycle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import SummaryCard from '@/components/ui/SummaryCard';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ToastContainer, { useToast } from '@/components/ui/Toast';
import { getSession } from '@/lib/auth';

export type LetterStatus = 'LETTER 1' | 'LETTER 2' | 'LETTER 3' | 'FINAL LETTER';
export type ReplyStatus = 'Belum Ada Balasan' | 'Sudah Ada Balasan';
export type DisplayStatus = LetterStatus | 'PROPOS DISPOS';

export interface EmailSupplierEntry {
  id: string;
  namaPT: string;
  namaBarang: string;
  kodeBarang: string;
  letterStatus: LetterStatus;
  tanggalLetter1: string;
  tanggalLetterTerakhir: string;
  replyStatus: ReplyStatus;
  catatan: string;
  editedBy: string;
  editedAt: string;
}

type FormValues = {
  namaPT: string;
  namaBarang: string;
  kodeBarang: string;
  letterStatus: LetterStatus;
  tanggalLetter1: string;
  tanggalLetterTerakhir: string;
  replyStatus: ReplyStatus;
  catatan: string;
};

type FilterLetter = 'Semua' | LetterStatus | 'PROPOS DISPOS';
type FilterReply = 'Semua' | ReplyStatus;

const LETTER_OPTIONS: LetterStatus[] = ['LETTER 1', 'LETTER 2', 'LETTER 3', 'FINAL LETTER'];

function daysSince(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function isExpired(entry: EmailSupplierEntry): boolean {
  if (entry.replyStatus === 'Sudah Ada Balasan') return false;
  return daysSince(entry.tanggalLetterTerakhir) > 7;
}

function daysUntilExpiry(entry: EmailSupplierEntry): number {
  return 7 - daysSince(entry.tanggalLetterTerakhir);
}

/**
 * Determines if a FINAL LETTER entry has passed its validity period.
 * FINAL LETTER is considered expired when tanggalLetterTerakhir is in the past (today or earlier counts as expired).
 * We use daysSince > 0 meaning the date has passed (strictly past).
 */
function isFinalLetterExpired(entry: EmailSupplierEntry): boolean {
  if (entry.replyStatus === 'Sudah Ada Balasan') return false;
  if (entry.letterStatus !== 'FINAL LETTER') return false;
  // FINAL LETTER expires when the tanggalLetterTerakhir date has passed (day after)
  return daysSince(entry.tanggalLetterTerakhir) > 0;
}

/**
 * Returns the computed display status for an entry.
 * If FINAL LETTER has expired → PROPOS DISPOS
 * Otherwise → the stored letterStatus
 */
function getDisplayStatus(entry: EmailSupplierEntry): DisplayStatus {
  if (isFinalLetterExpired(entry)) return 'PROPOS DISPOS';
  return entry.letterStatus;
}

const LETTER_COLORS: Record<LetterStatus, string> = {
  'LETTER 1': 'bg-blue-50 text-blue-700 border border-blue-200',
  'LETTER 2': 'bg-amber-50 text-amber-700 border border-amber-200',
  'LETTER 3': 'bg-orange-50 text-orange-700 border border-orange-200',
  'FINAL LETTER': 'bg-red-50 text-red-700 border border-red-200',
};

const DISPOSAL_COLOR = 'bg-purple-50 text-purple-700 border border-purple-200';
const DISPOSAL_DOT = 'bg-purple-500';

const LETTER_DOT: Record<LetterStatus, string> = {
  'LETTER 1': 'bg-blue-500',
  'LETTER 2': 'bg-amber-500',
  'LETTER 3': 'bg-orange-500',
  'FINAL LETTER': 'bg-red-500',
};

function getStatusColor(status: DisplayStatus): string {
  if (status === 'PROPOS DISPOS') return DISPOSAL_COLOR;
  return LETTER_COLORS[status as LetterStatus];
}

function getStatusDot(status: DisplayStatus): string {
  if (status === 'PROPOS DISPOS') return DISPOSAL_DOT;
  return LETTER_DOT[status as LetterStatus];
}

export default function EmailSupplierContent() {
  const [entries, setEntries] = useState<EmailSupplierEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterLetter, setFilterLetter] = useState<FilterLetter>('Semua');
  const [filterReply, setFilterReply] = useState<FilterReply>('Semua');
  const [filterExpired, setFilterExpired] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EmailSupplierEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>();
  const watchedLetter1 = watch('tanggalLetter1');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/tracker-email-supplier');
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal memuat data'); }
      setEntries(await res.json());
    } catch (err: any) {
      setApiError(err.message || 'Gagal memuat data dari server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filtered = entries.filter((e) => {
    const displayStatus = getDisplayStatus(e);
    const matchSearch = e.namaPT.toLowerCase().includes(search.toLowerCase()) ||
      e.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
      e.kodeBarang.toLowerCase().includes(search.toLowerCase()) ||
      e.catatan.toLowerCase().includes(search.toLowerCase());
    const matchLetter = filterLetter === 'Semua' ||
      (filterLetter === 'PROPOS DISPOS' ? displayStatus === 'PROPOS DISPOS' : e.letterStatus === filterLetter && displayStatus !== 'PROPOS DISPOS');
    const matchReply = filterReply === 'Semua' || e.replyStatus === filterReply;
    const matchExpired = !filterExpired || isExpired(e);
    return matchSearch && matchLetter && matchReply && matchExpired;
  });

  const totalEntries = entries.length;
  const totalExpired = entries.filter((e) => isExpired(e)).length;
  const totalReplied = entries.filter((e) => e.replyStatus === 'Sudah Ada Balasan').length;
  // FINAL LETTER aktif = FINAL LETTER yang belum expired (belum jadi PROPOS DISPOS)
  const totalFinalLetter = entries.filter((e) => e.letterStatus === 'FINAL LETTER' && e.replyStatus === 'Belum Ada Balasan' && !isFinalLetterExpired(e)).length;
  const totalDisposal = entries.filter((e) => isFinalLetterExpired(e)).length;

  // Distribution: LETTER 1/2/3 = stored status (excluding PROPOS DISPOS entries)
  // FINAL LETTER = only those not yet expired
  // DISPOSAL = those with PROPOS DISPOS computed status
  const letterDist = LETTER_OPTIONS.reduce<Record<string, number>>((acc, l) => {
    if (l === 'FINAL LETTER') {
      acc[l] = entries.filter((e) => e.letterStatus === l && !isFinalLetterExpired(e)).length;
    } else {
      acc[l] = entries.filter((e) => e.letterStatus === l).length;
    }
    return acc;
  }, {});
  const disposalDist = totalDisposal;

  function openAddModal() {
    setEditingEntry(null);
    const today = new Date().toISOString().split('T')[0];
    reset({ namaPT: '', namaBarang: '', kodeBarang: '', letterStatus: 'LETTER 1', tanggalLetter1: today, tanggalLetterTerakhir: today, replyStatus: 'Belum Ada Balasan', catatan: '' });
    setModalOpen(true);
  }

  function openEditModal(entry: EmailSupplierEntry) {
    setEditingEntry(entry);
    reset({ namaPT: entry.namaPT, namaBarang: entry.namaBarang, kodeBarang: entry.kodeBarang, letterStatus: entry.letterStatus, tanggalLetter1: entry.tanggalLetter1, tanggalLetterTerakhir: entry.tanggalLetterTerakhir, replyStatus: entry.replyStatus, catatan: entry.catatan });
    setModalOpen(true);
  }

  async function onSubmit(data: FormValues) {
    const session = getSession();
    const editedBy = session?.username ?? 'admin';

    try {
      if (editingEntry) {
        const res = await fetch(`/api/tracker-email-supplier/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, editedBy }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal memperbarui data'); }
        const updated = await res.json();
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        addToast('success', `Data email supplier ${data.namaPT} berhasil diperbarui.`);
      } else {
        const res = await fetch('/api/tracker-email-supplier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, editedBy }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menambahkan data'); }
        const created = await res.json();
        setEntries((prev) => [created, ...prev]);
        addToast('success', `Email supplier ${data.namaPT} berhasil ditambahkan.`);
      }
      setModalOpen(false);
      reset();
    } catch (err: any) {
      addToast('error', err.message || 'Operasi gagal. Silakan coba lagi.');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/tracker-email-supplier/${deleteTarget}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menghapus data'); }
      setRemovingId(deleteTarget);
      setTimeout(() => {
        setEntries((prev) => prev.filter((e) => e.id !== deleteTarget));
        setRemovingId(null);
        setDeleteTarget(null);
        addToast('success', 'Data email supplier berhasil dihapus.');
      }, 300);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menghapus data. Silakan coba lagi.');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    const bulan = BULAN[parseInt(m, 10) - 1] ?? m;
    return `${parseInt(d, 10)} ${bulan} ${y}`;
  }

  function getExpiryBadge(entry: EmailSupplierEntry) {
    if (entry.replyStatus === 'Sudah Ada Balasan') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle size={10} />Sudah Dibalas</span>;
    }
    // If PROPOS DISPOS, show special badge
    if (isFinalLetterExpired(entry)) {
      const daysPast = daysSince(entry.tanggalLetterTerakhir);
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"><Recycle size={10} />Final Letter berakhir {daysPast}h lalu</span>;
    }
    const days = daysUntilExpiry(entry);
    if (days < 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 animate-pulse"><AlertTriangle size={10} />Kadaluarsa {Math.abs(days)}h lalu</span>;
    if (days === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200"><Clock size={10} />Kadaluarsa Hari Ini</span>;
    if (days <= 2) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock size={10} />{days}h lagi</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground"><Clock size={10} />{days}h lagi</span>;
  }

  // Alert: expired entries (letter 1/2/3 expired) + PROPOS DISPOS entries
  const expiredEntries = entries.filter((e) => isExpired(e) && !isFinalLetterExpired(e));
  const proposDisposEntries = entries.filter((e) => isFinalLetterExpired(e));

  return (
    <div className="p-6 xl:p-8 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail size={22} className="text-primary" />
            Tracker Email Supplier
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pemantauan email bad stock ke supplier — status LETTER dan notifikasi kadaluarsa</p>
        </div>
        <button onClick={openAddModal} className="btn-primary"><Plus size={16} />Tambah Email</button>
      </div>

      {expiredEntries.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
            <Bell size={15} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700 mb-1">{expiredEntries.length} LETTER Kadaluarsa — Perlu Tindak Lanjut</p>
            <div className="flex flex-wrap gap-2">
              {expiredEntries.map((e) => (
                <span key={`expired-pill-${e.id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-red-200 text-xs font-medium text-red-700">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${LETTER_DOT[e.letterStatus]}`} />
                  {e.namaPT} — {e.letterStatus}
                  <span className="text-red-400 font-normal">({Math.abs(daysUntilExpiry(e))}h kadaluarsa)</span>
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setFilterExpired(true)} className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors whitespace-nowrap">
            Lihat Semua <ChevronRight size={12} />
          </button>
        </div>
      )}

      {proposDisposEntries.length > 0 && (
        <div className="mb-5 rounded-xl border border-purple-200 bg-purple-50 p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
            <Recycle size={15} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-purple-700 mb-1">{proposDisposEntries.length} Supplier Perlu Proses Disposal — FINAL LETTER Telah Berakhir</p>
            <div className="flex flex-wrap gap-2">
              {proposDisposEntries.map((e) => (
                <span key={`dispos-pill-${e.id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-xs font-medium text-purple-700">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-purple-500" />
                  {e.namaPT} — PROPOS DISPOS
                  <span className="text-purple-400 font-normal">(Final Letter: {formatDate(e.tanggalLetterTerakhir)})</span>
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setFilterLetter('PROPOS DISPOS')} className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors whitespace-nowrap">
            Lihat Semua <ChevronRight size={12} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Email" value={totalEntries} color="blue" icon={<Mail size={18} />} />
        <SummaryCard label="LETTER Kadaluarsa" value={totalExpired} total={totalEntries} color="red" icon={<AlertTriangle size={18} />} />
        <SummaryCard label="Sudah Ada Balasan" value={totalReplied} total={totalEntries} color="green" icon={<CheckCircle size={18} />} />
        <SummaryCard label="FINAL LETTER Aktif" value={totalFinalLetter} color="amber" icon={<MessageSquareOff size={18} />} />
      </div>

      <div className="card-base p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Distribusi Per LETTER</p>
        <div className="flex flex-wrap gap-2">
          {LETTER_OPTIONS.map((letter) => (
            <button key={`letter-pill-${letter}`} onClick={() => setFilterLetter(filterLetter === letter ? 'Semua' : letter)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                ${filterLetter === letter ? 'ring-2 ring-primary ring-offset-1' : ''} ${LETTER_COLORS[letter]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${LETTER_DOT[letter]}`} />
              {letter} — {letterDist[letter] ?? 0} item
            </button>
          ))}
          <button
            onClick={() => setFilterLetter(filterLetter === 'PROPOS DISPOS' ? 'Semua' : 'PROPOS DISPOS')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
              ${filterLetter === 'PROPOS DISPOS' ? 'ring-2 ring-purple-500 ring-offset-1' : ''} ${DISPOSAL_COLOR}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${DISPOSAL_DOT}`} />
            DISPOSAL — {disposalDist} item
          </button>
        </div>
      </div>

      <div className="card-base p-4 mb-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Cari nama PT, barang, kode..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-muted-foreground flex-shrink-0" />
          {(['Semua', 'Belum Ada Balasan', 'Sudah Ada Balasan'] as FilterReply[]).map((f) => (
            <button key={`filter-reply-${f}`} onClick={() => setFilterReply(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap
                ${filterReply === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
              {f}
            </button>
          ))}
        </div>
        {filterExpired && (
          <button onClick={() => setFilterExpired(false)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle size={12} />Kadaluarsa<X size={12} />
          </button>
        )}
        {filterLetter !== 'Semua' && (
          <button onClick={() => setFilterLetter('Semua')} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border ${filterLetter === 'PROPOS DISPOS' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-primary/10 text-primary border-primary/20'}`}>
            {filterLetter}<X size={12} />
          </button>
        )}
      </div>

      <div className="card-base overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm">Memuat data dari database...</span>
          </div>
        ) : apiError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-danger font-medium">{apiError}</p>
            <button onClick={fetchEntries} className="btn-secondary text-xs">Coba Lagi</button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-10">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nama PT</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Barang</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status LETTER</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tgl LETTER 1</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tgl LETTER Terakhir</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status Balasan</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Kadaluarsa</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Catatan</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Mail size={36} className="opacity-30" />
                      <p className="font-semibold text-base">Tidak ada data email supplier ditemukan</p>
                      <p className="text-sm">{search || filterLetter !== 'Semua' || filterReply !== 'Semua' || filterExpired ? 'Coba ubah filter atau kata kunci pencarian.' : 'Klik "Tambah Email" untuk memasukkan data pertama.'}</p>
                    </div>
                  </td></tr>
                ) : (
                  filtered.map((entry, idx) => {
                    const expired = isExpired(entry);
                    const displayStatus = getDisplayStatus(entry);
                    const isDisposal = displayStatus === 'PROPOS DISPOS';
                    return (
                      <tr key={entry.id} className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors duration-150
                        ${removingId === entry.id ? 'row-exit' : ''} ${isDisposal ? 'bg-purple-50/30' : expired ? 'bg-red-50/40' : idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="px-4 py-3 text-muted-foreground font-tabular text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isDisposal && <Recycle size={13} className="text-purple-500 flex-shrink-0" />}
                            {!isDisposal && expired && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
                            <span className="font-medium text-foreground text-sm">{entry.namaPT}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{entry.namaBarang}</p>
                            <p className="text-xs text-muted-foreground font-tabular">{entry.kodeBarang}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(displayStatus)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(displayStatus)}`} />
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-tabular text-sm text-foreground">{formatDate(entry.tanggalLetter1)}</td>
                        <td className="px-4 py-3 font-tabular text-sm text-foreground">{formatDate(entry.tanggalLetterTerakhir)}</td>
                        <td className="px-4 py-3">
                          {entry.replyStatus === 'Sudah Ada Balasan' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle size={10} />Sudah Dibalas</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border"><Clock size={10} />Belum Dibalas</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{getExpiryBadge(entry)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[140px] truncate" title={entry.catatan}>
                          {entry.catatan || <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditModal(entry)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => setDeleteTarget(entry.id)} className="p-1.5 rounded-lg hover:bg-danger-bg hover:text-danger text-muted-foreground transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !apiError && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>Menampilkan <strong>{filtered.length}</strong> dari <strong>{entries.length}</strong> data</span>
            <span>Update setiap 7 hari setelah LETTER 1 dikirim</span>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative card-base w-full max-w-lg shadow-modal scale-enter overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                {editingEntry ? 'Edit Data Email Supplier' : 'Tambah Email Supplier'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Nama PT / Supplier <span className="text-danger">*</span></label>
                <input {...register('namaPT', { required: 'Nama PT wajib diisi' })} type="text" placeholder="Contoh: PT Sumber Makmur Abadi" className="input-field" />
                {errors.namaPT && <p className="mt-1 text-xs text-danger">{errors.namaPT.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nama Barang <span className="text-danger">*</span></label>
                  <input {...register('namaBarang', { required: 'Nama barang wajib diisi' })} type="text" placeholder="Nama barang bad stock" className="input-field" />
                  {errors.namaBarang && <p className="mt-1 text-xs text-danger">{errors.namaBarang.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Kode Barang <span className="text-danger">*</span></label>
                  <input {...register('kodeBarang', { required: 'Kode barang wajib diisi' })} type="text" placeholder="Contoh: SP-001" className="input-field" />
                  {errors.kodeBarang && <p className="mt-1 text-xs text-danger">{errors.kodeBarang.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Status LETTER <span className="text-danger">*</span></label>
                <p className="text-xs text-muted-foreground mb-2">Pilih LETTER sesuai urutan pengiriman. Update setiap 7 hari jika belum ada balasan.</p>
                <div className="grid grid-cols-2 gap-2">
                  {LETTER_OPTIONS.map((letter) => (
                    <label key={`letter-radio-${letter}`} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all duration-150 ${LETTER_COLORS[letter]}`}>
                      <input {...register('letterStatus', { required: true })} type="radio" value={letter} className="accent-primary" />
                      <span className="text-xs font-semibold">{letter}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Recycle size={11} className="text-purple-500" />
                  Status <strong>PROPOS DISPOS</strong> dihitung otomatis saat masa FINAL LETTER berakhir.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Tanggal LETTER 1 Dikirim <span className="text-danger">*</span></label>
                <p className="text-xs text-muted-foreground mb-1.5">Tanggal pertama kali email dikirim ke supplier.</p>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input {...register('tanggalLetter1', { required: 'Tanggal LETTER 1 wajib diisi' })} type="date" className="input-field pl-9" />
                </div>
                {errors.tanggalLetter1 && <p className="mt-1 text-xs text-danger">{errors.tanggalLetter1.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Tanggal LETTER Terakhir Dikirim <span className="text-danger">*</span></label>
                <p className="text-xs text-muted-foreground mb-1.5">Notifikasi kadaluarsa dihitung 7 hari dari tanggal ini. Untuk FINAL LETTER, tanggal ini juga menentukan kapan status berubah ke PROPOS DISPOS.</p>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input {...register('tanggalLetterTerakhir', { required: 'Tanggal LETTER terakhir wajib diisi', validate: (val) => !watchedLetter1 || val >= watchedLetter1 || 'Tanggal LETTER terakhir tidak boleh sebelum LETTER 1' })} type="date" className="input-field pl-9" />
                </div>
                {errors.tanggalLetterTerakhir && <p className="mt-1 text-xs text-danger">{errors.tanggalLetterTerakhir.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Status Balasan <span className="text-danger">*</span></label>
                <select {...register('replyStatus', { required: true })} className="input-field">
                  <option value="Belum Ada Balasan">Belum Ada Balasan</option>
                  <option value="Sudah Ada Balasan">Sudah Ada Balasan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Catatan</label>
                <textarea {...register('catatan')} rows={3} placeholder="Keterangan tambahan (opsional)" className="input-field resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                      Menyimpan...
                    </span>
                  ) : editingEntry ? 'Simpan Perubahan' : 'Tambah Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={deleteTarget !== null} title="Hapus Data Email Supplier" description="Data email supplier ini akan dihapus secara permanen. Lanjutkan?" confirmLabel="Ya, Hapus" onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}