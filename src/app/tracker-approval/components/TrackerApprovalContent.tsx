'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, CheckSquare,
  CheckCircle, Clock, X, Upload, RefreshCw,
  FileText, Download, ChevronUp, ChevronDown, ChevronsUpDown,
  AlertCircle,
} from 'lucide-react';
import { ApprovalEntry } from '@/lib/store';
import { useForm } from 'react-hook-form';
import SummaryCard from '@/components/ui/SummaryCard';

import ConfirmModal from '@/components/ui/ConfirmModal';
import ToastContainer, { useToast } from '@/components/ui/Toast';
import { getSession } from '@/lib/auth';

type FormValues = {
  tanggal: string;
  weekApproval: string;
  remarkSudahDiScan: 'Sudah Di Scan' | 'Pending' | 'Belum Di Scan';
  cycleCount: string;
  catatan: string;
};

type FilterStatus = 'Semua' | 'Sudah Di Scan' | 'Pending' | 'Belum Di Scan';
type SortField = 'tanggal' | 'week' | null;
type SortDir = 'asc' | 'desc';

const CYCLE_COUNT_OPTIONS = ['TOP SHRINKAGE', 'TOP OVERAGE', 'REGULAR', 'REGULAR 2'];

function parseWeekNum(week: string): number {
  const match = week.match(/W(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function parseDateVal(dateStr: string): number {
  return new Date(dateStr).getTime();
}

export default function TrackerApprovalContent() {
  const [entries, setEntries] = useState<ApprovalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Semua');
  const [filterWeek, setFilterWeek] = useState('Semua');
  const [sortField, setSortField] = useState<SortField>('tanggal');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ApprovalEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/tracker-approval');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memuat data');
      }
      setEntries(await res.json());
    } catch (err: any) {
      setApiError(err.message || 'Gagal memuat data dari server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Derive unique weeks from data
  const availableWeeks = Array.from(new Set(entries.map((e) => e.weekApproval)))
    .sort((a, b) => parseWeekNum(a) - parseWeekNum(b));

  // Filter + sort
  const filtered = entries
    .filter((e) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        e.weekApproval.toLowerCase().includes(q) ||
        e.tanggal.includes(q) ||
        formatDate(e.tanggal).includes(q) ||
        e.catatan.toLowerCase().includes(q) ||
        e.cycleCount.toLowerCase().includes(q) ||
        e.remarkSudahDiScan.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'Semua' || e.remarkSudahDiScan === filterStatus;
      const matchWeek = filterWeek === 'Semua' || e.weekApproval === filterWeek;
      return matchSearch && matchStatus && matchWeek;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      if (sortField === 'tanggal') {
        const diff = parseDateVal(a.tanggal) - parseDateVal(b.tanggal);
        return sortDir === 'asc' ? diff : -diff;
      }
      if (sortField === 'week') {
        const diff = parseWeekNum(a.weekApproval) - parseWeekNum(b.weekApproval);
        return sortDir === 'asc' ? diff : -diff;
      }
      return 0;
    });

  // Summary counts
  const totalScanned = entries.filter((e) => e.remarkSudahDiScan === 'Sudah Di Scan').length;
  const totalPending = entries.filter((e) => e.remarkSudahDiScan === 'Pending').length;
  const totalBelum = entries.filter((e) => e.remarkSudahDiScan === 'Belum Di Scan').length;
  const totalWithPdf = entries.filter((e) => e.pdfUrl !== null).length;

  function handleSortToggle(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  function openAddModal() {
    setEditingEntry(null);
    setPdfFile(null);
    setPdfError(null);
    reset({
      tanggal: new Date().toISOString().split('T')[0],
      weekApproval: '',
      remarkSudahDiScan: 'Belum Di Scan',
      cycleCount: 'TOP SHRINKAGE',
      catatan: '',
    });
    setModalOpen(true);
  }

  function openEditModal(entry: ApprovalEntry) {
    setEditingEntry(entry);
    setPdfFile(null);
    setPdfError(null);
    reset({
      tanggal: entry.tanggal,
      weekApproval: entry.weekApproval,
      remarkSudahDiScan: entry.remarkSudahDiScan,
      cycleCount: entry.cycleCount || 'TOP SHRINKAGE',
      catatan: entry.catatan,
    });
    setModalOpen(true);
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfError(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('File harus berformat PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfError('Ukuran file terlalu besar (maksimal 10MB)');
      return;
    }
    setPdfFile(file);
  }

  async function uploadPdf(file: File): Promise<{ url: string; name: string } | null> {
    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'approval-pdf');
      const res = await fetch('/api/upload-pdf', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload PDF gagal');
      }
      const d = await res.json();
      return { url: d.url, name: d.name };
    } catch (err: any) {
      addToast('error', err.message || 'Upload PDF gagal, silakan coba lagi.');
      return null;
    } finally {
      setUploadingPdf(false);
    }
  }

  async function onSubmit(data: FormValues) {
    const session = getSession();
    const editedBy = session?.username ?? 'admin';

    let finalPdfUrl: string | null = editingEntry?.pdfUrl ?? null;
    let finalPdfName: string | null = editingEntry?.pdfName ?? null;

    if (pdfFile) {
      const uploaded = await uploadPdf(pdfFile);
      if (!uploaded) return;
      finalPdfUrl = uploaded.url;
      finalPdfName = uploaded.name;
    }

    try {
      if (editingEntry) {
        const res = await fetch(`/api/tracker-approval/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            cycleCount: data.cycleCount,
            pdfUrl: finalPdfUrl,
            pdfName: finalPdfName,
            editedBy,
          }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal memperbarui data'); }
        const updated = await res.json();
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        addToast('success', `Data approval ${data.weekApproval} berhasil diperbarui.`);
      } else {
        const res = await fetch('/api/tracker-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            cycleCount: data.cycleCount,
            pdfUrl: finalPdfUrl,
            pdfName: finalPdfName,
            editedBy,
          }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menambahkan data'); }
        const created = await res.json();
        setEntries((prev) => [created, ...prev]);
        addToast('success', `Data approval ${data.weekApproval} berhasil ditambahkan.`);
      }
      setModalOpen(false);
      setPdfFile(null);
      setPdfError(null);
      reset();
    } catch (err: any) {
      addToast('error', err.message || 'Operasi gagal. Silakan coba lagi.');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/tracker-approval/${deleteTarget}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menghapus data'); }
      setRemovingId(deleteTarget);
      setTimeout(() => {
        setEntries((prev) => prev.filter((e) => e.id !== deleteTarget));
        setRemovingId(null);
        setDeleteTarget(null);
        addToast('success', 'Data approval berhasil dihapus.');
      }, 300);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menghapus data. Silakan coba lagi.');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function RemarkBadge({ status }: { status: string }) {
    if (status === 'Sudah Di Scan') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
          Sudah Di Scan
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
        Belum Di Scan
      </span>
    );
  }

  return (
    <div className="p-6 xl:p-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare size={22} className="text-primary" />
            Tracker Approval
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pendataan hasil scan berkas approval berdasarkan tanggal dan week</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2"><Plus size={16} />Tambah Data</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <SummaryCard label="Total Approval" value={entries.length} color="blue" icon={<CheckSquare size={18} />} />
        <SummaryCard label="Sudah Di Scan" value={totalScanned} total={entries.length} color="green" icon={<CheckCircle size={18} />} />
        <SummaryCard label="Pending" value={totalPending} total={entries.length} color="amber" icon={<Clock size={18} />} />
        <SummaryCard label="Belum Di Scan" value={totalBelum} color="red" icon={<AlertCircle size={18} />} />
        <SummaryCard label="Ada Hasil Scan" value={totalWithPdf} total={entries.length} color="purple" icon={<FileText size={18} />} />
      </div>

      {/* Search + Filter + Sort */}
      <div className="card-base p-4 mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari tanggal, week, cycle count, catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-4 items-start">
          {/* Status filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Scan</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['Semua', 'Sudah Di Scan', 'Pending', 'Belum Di Scan'] as FilterStatus[]).map((f) => (
                <button
                  key={`filter-status-${f}`}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap
                    ${filterStatus === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Week filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Week</span>
            <select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className="input-field py-1.5 text-xs min-w-[140px]"
            >
              <option value="Semua">Semua Week</option>
              {availableWeeks.map((w) => (
                <option key={`week-opt-${w}`} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Urutkan</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSortToggle('tanggal')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap
                  ${sortField === 'tanggal' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}
              >
                Tanggal <SortIcon field="tanggal" />
              </button>
              <button
                onClick={() => handleSortToggle('week')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap
                  ${sortField === 'week' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}
              >
                Week <SortIcon field="week" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
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
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    <button onClick={() => handleSortToggle('tanggal')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Tanggal <SortIcon field="tanggal" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    <button onClick={() => handleSortToggle('week')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Week <SortIcon field="week" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Cycle Count</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Remark Scan</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Hasil Scan</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Catatan</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <CheckSquare size={36} className="opacity-30" />
                        <p className="font-semibold text-base">Tidak ada data ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors duration-150
                        ${removingId === entry.id ? 'opacity-0' : ''} ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground font-tabular text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-tabular whitespace-nowrap">{formatDate(entry.tanggal)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {entry.weekApproval}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {entry.cycleCount ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-secondary/10 text-secondary whitespace-nowrap">
                            {entry.cycleCount}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <RemarkBadge status={entry.remarkSudahDiScan} />
                      </td>
                      <td className="px-4 py-3">
                        {entry.pdfUrl ? (
                          <div className="flex items-center gap-1.5">
                            <FileText size={14} className="text-primary flex-shrink-0" />
                            <span className="text-xs text-foreground max-w-[120px] truncate" title={entry.pdfName ?? ''}>
                              {entry.pdfName ?? 'PDF'}
                            </span>
                            <a
                              href={entry.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
                              title="Lihat / Download PDF"
                            >
                              <Download size={13} />
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Belum Ada PDF</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[160px] truncate" title={entry.catatan}>
                        {entry.catatan || <span className="italic opacity-50">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(entry)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(entry.id)} className="p-1.5 rounded-lg hover:bg-danger-bg hover:text-danger text-muted-foreground transition-colors" title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !apiError && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>Menampilkan <strong>{filtered.length}</strong> dari <strong>{entries.length}</strong> data</span>
            <span>Data dari database</span>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative card-base w-full max-w-lg shadow-modal scale-enter overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-base text-foreground">
                {editingEntry ? 'Edit Data Approval' : 'Tambah Data Approval'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
              {/* Tanggal */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Tanggal <span className="text-danger">*</span>
                </label>
                <input {...register('tanggal', { required: 'Tanggal wajib diisi' })} type="date" className="input-field" />
                {errors.tanggal && <p className="mt-1 text-xs text-danger">{errors.tanggal.message}</p>}
              </div>

              {/* Week Approval */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Week Approval <span className="text-danger">*</span>
                </label>
                <input
                  {...register('weekApproval', { required: 'Week wajib diisi' })}
                  type="text"
                  placeholder="Contoh: W37"
                  className="input-field"
                />
                {errors.weekApproval && <p className="mt-1 text-xs text-danger">{errors.weekApproval.message}</p>}
              </div>

              {/* Cycle Count */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Cycle Count <span className="text-danger">*</span>
                </label>
                <select {...register('cycleCount', { required: 'Cycle Count wajib dipilih' })} className="input-field">
                  {CYCLE_COUNT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {errors.cycleCount && <p className="mt-1 text-xs text-danger">{errors.cycleCount.message}</p>}
              </div>

              {/* Remark Scan */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Remark Scan <span className="text-danger">*</span>
                </label>
                <select {...register('remarkSudahDiScan', { required: true })} className="input-field">
                  <option value="Belum Di Scan">Belum Di Scan</option>
                  <option value="Pending">Pending</option>
                  <option value="Sudah Di Scan">Sudah Di Scan</option>
                </select>
              </div>

              {/* Hasil Scan PDF */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Hasil Scan Berkas</label>

                {/* Show existing PDF when editing */}
                {editingEntry?.pdfUrl && !pdfFile && (
                  <div className="mb-3 p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate">{editingEntry.pdfName ?? 'PDF'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={editingEntry.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Lihat PDF
                      </a>
                      <a
                        href={editingEntry.pdfUrl}
                        download={editingEntry.pdfName ?? 'hasil-scan.pdf'}
                        className="text-xs text-primary hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                )}

                {/* PDF selected preview */}
                {pdfFile && (
                  <div className="mb-3 p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate">{pdfFile.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPdfFile(null); setPdfError(null); if (pdfInputRef.current) pdfInputRef.current.value = ''; }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-sm font-medium">
                    {editingEntry?.pdfUrl && !pdfFile ? 'Ganti PDF' : 'Upload PDF'}
                  </span>
                  <span className="text-xs">Hanya PDF — maks. 10MB</span>
                </button>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handlePdfChange}
                />
                {pdfError && (
                  <p className="mt-1.5 text-xs text-danger flex items-center gap-1">
                    <AlertCircle size={12} /> {pdfError}
                  </p>
                )}
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Catatan</label>
                <textarea
                  {...register('catatan')}
                  rows={3}
                  placeholder="Keterangan tambahan (opsional)"
                  className="input-field resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || uploadingPdf}>
                  {(isSubmitting || uploadingPdf) ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {uploadingPdf ? 'Mengupload PDF...' : 'Menyimpan...'}
                    </span>
                  ) : editingEntry ? 'Simpan Perubahan' : 'Tambah Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Hapus Data Approval"
        description="Data ini akan dihapus secara permanen. Lanjutkan?"
        confirmLabel="Ya, Hapus"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}