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

// ─── Types ────────────────────────────────────────────────────────────────────

type EditFormValues = {
  tanggal: string;
  weekApproval: string;
  remarkSudahDiScan: 'Sudah Di Scan' | 'Pending' | 'Belum Di Scan';
  cycleCount: string;
  catatan: string;
};

type FilterStatus = 'Semua' | 'Sudah Di Scan' | 'Pending' | 'Belum Di Scan';
type SortField = 'tanggal' | 'week' | null;
type SortDir = 'asc' | 'desc';

// A single task row in the "Add" form
interface TaskRow {
  id: string; // local only, for React key
  cycleCount: string;
  remarkSudahDiScan: 'Sudah Di Scan' | 'Pending' | 'Belum Di Scan';
  catatan: string;
  pdfFile: File | null;
  pdfError: string | null;
  // after upload
  pdfUrl: string | null;
  pdfName: string | null;
}

const CYCLE_COUNT_OPTIONS = ['TOP SHRINKAGE', 'TOP OVERAGE', 'REGULAR', 'REGULAR 2'];

function makeTaskRow(): TaskRow {
  return {
    id: Math.random().toString(36).slice(2),
    cycleCount: 'TOP SHRINKAGE',
    remarkSudahDiScan: 'Belum Di Scan',
    catatan: '',
    pdfFile: null,
    pdfError: null,
    pdfUrl: null,
    pdfName: null,
  };
}

function parseWeekNum(week: string): number {
  const match = week.match(/W(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function parseDateVal(dateStr: string): number {
  return new Date(dateStr).getTime();
}

interface WeekGroup {
  week: string;
  tasks: ApprovalEntry[];
  dateVal: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrackerApprovalContent() {
  const [entries, setEntries] = useState<ApprovalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Semua');
  const [filterWeek, setFilterWeek] = useState('Semua');
  const [sortField, setSortField] = useState<SortField>('tanggal');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ApprovalEntry | null>(null);

  // Add-mode multi-task state
  const [addTanggal, setAddTanggal] = useState('');
  const [addWeek, setAddWeek] = useState('');
  const [addWeekError, setAddWeekError] = useState('');
  const [addTanggalError, setAddTanggalError] = useState('');
  const [taskRows, setTaskRows] = useState<TaskRow[]>([makeTaskRow()]);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit-mode single task state
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [editPdfError, setEditPdfError] = useState<string | null>(null);
  const [editUploadingPdf, setEditUploadingPdf] = useState(false);
  const editPdfInputRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { toasts, addToast, removeToast } = useToast();

  // Edit form (react-hook-form, single task)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditFormValues>();

  // Per-task PDF input refs (for add mode)
  const taskPdfRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ─── Data fetching ──────────────────────────────────────────────────────────

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

  // ─── Derived values ─────────────────────────────────────────────────────────

  const availableWeeks = Array.from(new Set(entries.map((e) => e.weekApproval)))
    .sort((a, b) => parseWeekNum(a) - parseWeekNum(b));

  const totalScanned = entries.filter((e) => e.remarkSudahDiScan === 'Sudah Di Scan').length;
  const totalPending = entries.filter((e) => e.remarkSudahDiScan === 'Pending').length;
  const totalBelum = entries.filter((e) => e.remarkSudahDiScan === 'Belum Di Scan').length;
  const totalWithPdf = entries.filter((e) => e.pdfUrl !== null).length;

  // ─── Grouping logic ─────────────────────────────────────────────────────────

  const filteredTasks = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.weekApproval.toLowerCase().includes(q) ||
      e.tanggal.includes(q) ||
      formatDate(e.tanggal).includes(q) ||
      e.catatan.toLowerCase().includes(q) ||
      (e.cycleCount ?? '').toLowerCase().includes(q) ||
      e.remarkSudahDiScan.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'Semua' || e.remarkSudahDiScan === filterStatus;
    const matchWeek = filterWeek === 'Semua' || e.weekApproval === filterWeek;
    return matchSearch && matchStatus && matchWeek;
  });

  const groupMap = new Map<string, ApprovalEntry[]>();
  for (const task of filteredTasks) {
    const key = task.weekApproval;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(task);
  }

  const weekGroups: WeekGroup[] = Array.from(groupMap.entries()).map(([week, tasks]) => {
    const dates = tasks.map((t) => parseDateVal(t.tanggal)).filter((d) => !isNaN(d));
    const dateVal = dates.length > 0 ? (sortDir === 'asc' ? Math.min(...dates) : Math.max(...dates)) : 0;
    return { week, tasks, dateVal };
  });

  weekGroups.sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === 'tanggal') {
      const diff = a.dateVal - b.dateVal;
      return sortDir === 'asc' ? diff : -diff;
    }
    if (sortField === 'week') {
      const diff = parseWeekNum(a.week) - parseWeekNum(b.week);
      return sortDir === 'asc' ? diff : -diff;
    }
    return 0;
  });

  // ─── Duplicate label helper ─────────────────────────────────────────────────
  /**
   * Given a list of tasks in a group, build a map from task.id → display label.
   * If a cycle count appears more than once, append #1, #2, etc.
   * If it appears only once, no suffix.
   */
  function buildCycleLabelMap(tasks: ApprovalEntry[]): Map<string, string> {
    // Count occurrences per cycleCount
    const countMap = new Map<string, number>();
    for (const t of tasks) {
      const cc = t.cycleCount || '—';
      countMap.set(cc, (countMap.get(cc) ?? 0) + 1);
    }
    // Assign labels
    const seenMap = new Map<string, number>();
    const labelMap = new Map<string, string>();
    for (const t of tasks) {
      const cc = t.cycleCount || '—';
      const total = countMap.get(cc) ?? 1;
      if (total > 1) {
        const seen = (seenMap.get(cc) ?? 0) + 1;
        seenMap.set(cc, seen);
        labelMap.set(t.id, `${cc} #${seen}`);
      } else {
        labelMap.set(t.id, cc);
      }
    }
    return labelMap;
  }

  // ─── Sort toggle ────────────────────────────────────────────────────────────

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

  // ─── Modal open helpers ─────────────────────────────────────────────────────

  function openAddModal() {
    setEditingEntry(null);
    setAddTanggal(new Date().toISOString().split('T')[0]);
    setAddWeek('');
    setAddTanggalError('');
    setAddWeekError('');
    setTaskRows([makeTaskRow()]);
    setModalOpen(true);
  }

  function openEditModal(entry: ApprovalEntry) {
    setEditingEntry(entry);
    setEditPdfFile(null);
    setEditPdfError(null);
    reset({
      tanggal: entry.tanggal,
      weekApproval: entry.weekApproval,
      remarkSudahDiScan: entry.remarkSudahDiScan,
      cycleCount: entry.cycleCount || 'TOP SHRINKAGE',
      catatan: entry.catatan,
    });
    setModalOpen(true);
  }

  // ─── Task row management (Add mode) ─────────────────────────────────────────

  function addTaskRow() {
    setTaskRows((prev) => [...prev, makeTaskRow()]);
  }

  function removeTaskRow(id: string) {
    setTaskRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateTaskRow(id: string, patch: Partial<TaskRow>) {
    setTaskRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  function handleTaskPdfChange(taskId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      updateTaskRow(taskId, { pdfError: 'File harus berformat PDF', pdfFile: null });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      updateTaskRow(taskId, { pdfError: 'Ukuran file terlalu besar (maksimal 10MB)', pdfFile: null });
      return;
    }
    updateTaskRow(taskId, { pdfFile: file, pdfError: null });
  }

  // ─── PDF upload helper ──────────────────────────────────────────────────────

  async function uploadPdf(file: File): Promise<{ url: string; name: string } | null> {
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
    }
  }

  // ─── Submit: Add (multi-task) ────────────────────────────────────────────────

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!addTanggal) { setAddTanggalError('Tanggal wajib diisi'); valid = false; } else { setAddTanggalError(''); }
    if (!addWeek.trim()) { setAddWeekError('Week wajib diisi'); valid = false; } else { setAddWeekError(''); }
    if (!valid) return;

    setAddSubmitting(true);
    const session = getSession();
    const editedBy = session?.username ?? 'admin';

    try {
      // Upload PDFs for each task that has a file
      const resolvedTasks = await Promise.all(
        taskRows.map(async (row) => {
          let pdfUrl = row.pdfUrl;
          let pdfName = row.pdfName;
          if (row.pdfFile) {
            const uploaded = await uploadPdf(row.pdfFile);
            if (!uploaded) throw new Error('Upload PDF gagal untuk salah satu task');
            pdfUrl = uploaded.url;
            pdfName = uploaded.name;
          }
          return {
            cycleCount: row.cycleCount,
            remarkSudahDiScan: row.remarkSudahDiScan,
            catatan: row.catatan,
            pdfUrl,
            pdfName,
          };
        })
      );

      const res = await fetch('/api/tracker-approval/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: addTanggal,
          weekApproval: addWeek.trim(),
          tasks: resolvedTasks,
          editedBy,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menambahkan data');
      }

      const created: ApprovalEntry[] = await res.json();
      setEntries((prev) => [...created, ...prev]);
      addToast('success', `${created.length} task berhasil ditambahkan untuk ${addWeek.trim()}.`);
      setModalOpen(false);
    } catch (err: any) {
      addToast('error', err.message || 'Operasi gagal. Silakan coba lagi.');
    } finally {
      setAddSubmitting(false);
    }
  }

  // ─── Submit: Edit (single task) ──────────────────────────────────────────────

  async function onEditSubmit(data: EditFormValues) {
    const session = getSession();
    const editedBy = session?.username ?? 'admin';

    let finalPdfUrl: string | null = editingEntry?.pdfUrl ?? null;
    let finalPdfName: string | null = editingEntry?.pdfName ?? null;

    if (editPdfFile) {
      setEditUploadingPdf(true);
      const uploaded = await uploadPdf(editPdfFile);
      setEditUploadingPdf(false);
      if (!uploaded) return;
      finalPdfUrl = uploaded.url;
      finalPdfName = uploaded.name;
    }

    try {
      const res = await fetch(`/api/tracker-approval/${editingEntry!.id}`, {
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
      setModalOpen(false);
      setEditPdfFile(null);
      setEditPdfError(null);
      reset();
    } catch (err: any) {
      addToast('error', err.message || 'Operasi gagal. Silakan coba lagi.');
    }
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────

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

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const [y, m, d] = dateStr.split('-');
    const bulan = BULAN[parseInt(m, 10) - 1] ?? m;
    return `${parseInt(d, 10)} ${bulan} ${y}`;
  }

  function groupDateLabel(tasks: ApprovalEntry[]): string {
    const dates = Array.from(new Set(tasks.map((t) => t.tanggal))).sort();
    if (dates.length === 0) return '—';
    if (dates.length === 1) return formatDate(dates[0]);
    return `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`;
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

  const CC_COLORS = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-orange-100 text-orange-700',
    'bg-teal-100 text-teal-700',
  ];
  function ccColor(cycleCount: string): string {
    const idx = CYCLE_COUNT_OPTIONS.indexOf(cycleCount);
    return CC_COLORS[idx >= 0 ? idx : 0];
  }

  // ─── Edit PDF handler ────────────────────────────────────────────────────────

  function handleEditPdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditPdfError(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setEditPdfError('File harus berformat PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEditPdfError('Ukuran file terlalu besar (maksimal 10MB)');
      return;
    }
    setEditPdfFile(file);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

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

        <div className="flex flex-wrap gap-4 items-start">
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

      {/* Table — grouped by WEEK */}
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
                {weekGroups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <CheckSquare size={36} className="opacity-30" />
                        <p className="font-semibold text-base">Tidak ada data ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  weekGroups.map((group, groupIdx) => {
                    const taskCount = group.tasks.length;
                    // Build label map for this group (handles duplicates)
                    const labelMap = buildCycleLabelMap(group.tasks);

                    return group.tasks.map((task, taskIdx) => {
                      const isFirst = taskIdx === 0;
                      const isLast = taskIdx === taskCount - 1;
                      const isRemoving = removingId === task.id;
                      const cycleLabel = labelMap.get(task.id) ?? (task.cycleCount || '—');

                      return (
                        <tr
                          key={task.id}
                          className={`border-b border-border transition-colors duration-150
                            ${isLast ? 'border-b-2 border-border/60' : ''}
                            ${isRemoving ? 'opacity-0' : ''}
                            ${groupIdx % 2 === 0 ? 'bg-white hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'}`}
                        >
                          {isFirst && (
                            <td rowSpan={taskCount} className="px-4 py-3 text-muted-foreground font-tabular text-xs align-top border-r border-border/40">
                              {groupIdx + 1}
                            </td>
                          )}
                          {/* Date — individual per task, no rowspan */}
                          <td className={`px-4 py-2.5 text-sm text-foreground font-tabular whitespace-nowrap border-r border-border/40 ${isFirst ? 'pt-3' : ''} ${isLast ? 'pb-3' : ''}`}>
                            {formatDate(task.tanggal)}
                          </td>
                          {isFirst && (
                            <td rowSpan={taskCount} className="px-4 py-3 align-middle border-r border-border/40 text-center">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                {group.week}
                              </span>
                            </td>
                          )}

                          {/* Cycle Count — with duplicate label */}
                          <td className={`px-4 py-2.5 ${isFirst ? 'pt-3' : ''} ${isLast ? 'pb-3' : ''}`}>
                            {task.cycleCount ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${ccColor(task.cycleCount)}`}>
                                {cycleLabel}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </td>

                          {/* Remark Scan */}
                          <td className={`px-4 py-2.5 ${isFirst ? 'pt-3' : ''} ${isLast ? 'pb-3' : ''}`}>
                            <RemarkBadge status={task.remarkSudahDiScan} />
                          </td>

                          {/* Hasil Scan */}
                          <td className={`px-4 py-2.5 ${isFirst ? 'pt-3' : ''} ${isLast ? 'pb-3' : ''}`}>
                            {task.pdfUrl ? (
                              <div className="flex items-center gap-1.5">
                                <FileText size={14} className="text-primary flex-shrink-0" />
                                <span className="text-xs text-foreground max-w-[110px] truncate" title={task.pdfName ?? ''}>
                                  {task.pdfName ?? 'PDF'}
                                </span>
                                <a
                                  href={task.pdfUrl}
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

                          {/* Catatan */}
                          <td className={`px-4 py-2.5 text-sm text-muted-foreground max-w-[160px] truncate ${isFirst ? 'pt-3' : ''} ${isLast ? 'pb-3' : ''}`} title={task.catatan}>
                            {task.catatan || <span className="italic opacity-50">—</span>}
                          </td>

                          {/* Aksi */}
                          <td className={`px-4 py-2.5 ${isFirst ? 'pt-3' : ''} ${isLast ? 'pb-3' : ''}`}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                                title={`Edit ${cycleLabel}`}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(task.id)}
                                className="p-1.5 rounded-lg hover:bg-danger-bg hover:text-danger text-muted-foreground transition-colors"
                                title={`Hapus ${cycleLabel}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !apiError && weekGroups.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Menampilkan <strong>{weekGroups.length}</strong> week
              {' '}(<strong>{filteredTasks.length}</strong> task)
              {filteredTasks.length !== entries.length && (
                <> dari total <strong>{entries.length}</strong> task</>
              )}
            </span>
            <span>Data dari database</span>
          </div>
        )}
      </div>

      {/* ─── Modal Add (multi-task) ─────────────────────────────────────────── */}
      {modalOpen && !editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative card-base w-full max-w-2xl shadow-modal scale-enter overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-base text-foreground">Tambah Data Approval</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="px-6 py-5 space-y-5">
              {/* Tanggal + Week */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Tanggal <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={addTanggal}
                    onChange={(e) => setAddTanggal(e.target.value)}
                    className="input-field"
                  />
                  {addTanggalError && <p className="mt-1 text-xs text-danger">{addTanggalError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Week Approval <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: W37"
                    value={addWeek}
                    onChange={(e) => setAddWeek(e.target.value)}
                    className="input-field"
                  />
                  {addWeekError && <p className="mt-1 text-xs text-danger">{addWeekError}</p>}
                </div>
              </div>

              {/* Task rows */}
              <div className="space-y-4">
                {taskRows.map((row, idx) => (
                  <div key={row.id} className="border border-border rounded-xl p-4 space-y-3 bg-muted/20 relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Task {idx + 1}
                      </span>
                      {taskRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTaskRow(row.id)}
                          className="p-1 rounded hover:bg-danger-bg hover:text-danger text-muted-foreground transition-colors"
                          title="Hapus task ini"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Cycle Count */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Cycle Count <span className="text-danger">*</span>
                      </label>
                      <select
                        value={row.cycleCount}
                        onChange={(e) => updateTaskRow(row.id, { cycleCount: e.target.value })}
                        className="input-field text-sm"
                      >
                        {CYCLE_COUNT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Remark Scan */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Remark Scan <span className="text-danger">*</span>
                      </label>
                      <select
                        value={row.remarkSudahDiScan}
                        onChange={(e) => updateTaskRow(row.id, { remarkSudahDiScan: e.target.value as TaskRow['remarkSudahDiScan'] })}
                        className="input-field text-sm"
                      >
                        <option value="Belum Di Scan">Belum Di Scan</option>
                        <option value="Pending">Pending</option>
                        <option value="Sudah Di Scan">Sudah Di Scan</option>
                      </select>
                    </div>

                    {/* Hasil Scan PDF */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Hasil Scan Berkas</label>
                      {row.pdfFile ? (
                        <div className="mb-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-primary flex-shrink-0" />
                            <span className="text-xs text-foreground truncate">{row.pdfFile.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">({(row.pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              updateTaskRow(row.id, { pdfFile: null, pdfError: null });
                              const ref = taskPdfRefs.current[row.id];
                              if (ref) ref.value = '';
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => taskPdfRefs.current[row.id]?.click()}
                        className="w-full border-2 border-dashed border-border rounded-lg py-3 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors text-xs"
                      >
                        <Upload size={14} />
                        {row.pdfFile ? 'Ganti PDF' : 'Upload PDF'}
                        <span className="opacity-60">— maks. 10MB</span>
                      </button>
                      <input
                        ref={(el) => { taskPdfRefs.current[row.id] = el; }}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => handleTaskPdfChange(row.id, e)}
                      />
                      {row.pdfError && (
                        <p className="mt-1 text-xs text-danger flex items-center gap-1">
                          <AlertCircle size={11} /> {row.pdfError}
                        </p>
                      )}
                    </div>

                    {/* Catatan */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Catatan</label>
                      <textarea
                        rows={2}
                        placeholder="Keterangan tambahan (opsional)"
                        value={row.catatan}
                        onChange={(e) => updateTaskRow(row.id, { catatan: e.target.value })}
                        className="input-field resize-none text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add task button */}
              <button
                type="button"
                onClick={addTaskRow}
                className="w-full border-2 border-dashed border-primary/40 rounded-xl py-3 flex items-center justify-center gap-2 text-primary hover:border-primary hover:bg-primary/5 transition-colors text-sm font-semibold"
              >
                <Plus size={16} />
                Tambah Task Cycle Count
              </button>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={addSubmitting}>
                  {addSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Menyimpan...
                    </span>
                  ) : `Tambah Data (${taskRows.length} task)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Edit (single task) ───────────────────────────────────────── */}
      {modalOpen && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative card-base w-full max-w-lg shadow-modal scale-enter overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-base text-foreground">Edit Data Approval</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onEditSubmit)} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Tanggal <span className="text-danger">*</span>
                </label>
                <input {...register('tanggal', { required: 'Tanggal wajib diisi' })} type="date" className="input-field" />
                {errors.tanggal && <p className="mt-1 text-xs text-danger">{errors.tanggal.message}</p>}
              </div>

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

                {editingEntry.pdfUrl && !editPdfFile && (
                  <div className="mb-3 p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate">{editingEntry.pdfName ?? 'PDF'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={editingEntry.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Lihat PDF</a>
                      <a href={editingEntry.pdfUrl} download={editingEntry.pdfName ?? 'hasil-scan.pdf'} className="text-xs text-primary hover:underline">Download</a>
                    </div>
                  </div>
                )}

                {editPdfFile && (
                  <div className="mb-3 p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate">{editPdfFile.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">({(editPdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEditPdfFile(null); setEditPdfError(null); if (editPdfInputRef.current) editPdfInputRef.current.value = ''; }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => editPdfInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-sm font-medium">
                    {editingEntry.pdfUrl && !editPdfFile ? 'Ganti PDF' : 'Upload PDF'}
                  </span>
                  <span className="text-xs">Hanya PDF — maks. 10MB</span>
                </button>
                <input ref={editPdfInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleEditPdfChange} />
                {editPdfError && (
                  <p className="mt-1.5 text-xs text-danger flex items-center gap-1">
                    <AlertCircle size={12} /> {editPdfError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Catatan</label>
                <textarea {...register('catatan')} rows={3} placeholder="Keterangan tambahan (opsional)" className="input-field resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || editUploadingPdf}>
                  {(isSubmitting || editUploadingPdf) ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {editUploadingPdf ? 'Mengupload PDF...' : 'Menyimpan...'}
                    </span>
                  ) : 'Simpan Perubahan'}
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