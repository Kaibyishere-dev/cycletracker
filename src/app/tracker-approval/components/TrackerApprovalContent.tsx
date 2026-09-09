'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, Image as ImageIcon, Eye, CheckSquare,
  CheckCircle, Clock, Filter, X, Upload, Calendar, RefreshCw,
} from 'lucide-react';
import { ApprovalEntry } from '@/lib/store';
import { useForm } from 'react-hook-form';
import SummaryCard from '@/components/ui/SummaryCard';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PhotoLightbox from '@/components/ui/PhotoLightbox';
import ToastContainer, { useToast } from '@/components/ui/Toast';
import { getSession } from '@/lib/auth';
import AppImage from '@/components/ui/AppImage';

type FormValues = {
  tanggal: string;
  weekApproval: string;
  remarkSudahDiScan: 'Sudah Di Scan' | 'Belum Di Scan';
  catatan: string;
};

type FilterStatus = 'Semua' | 'Sudah Di Scan' | 'Belum Di Scan';

const WEEK_OPTIONS = ['Semua', 'W35', 'W36', 'W37', 'W38', 'W39', 'W40'];

export default function TrackerApprovalContent() {
  const [entries, setEntries] = useState<ApprovalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Semua');
  const [filterWeek, setFilterWeek] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ApprovalEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; name: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const filtered = entries.filter((e) => {
    const matchSearch = e.weekApproval.toLowerCase().includes(search.toLowerCase()) ||
      e.tanggal.includes(search) || e.catatan.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'Semua' || e.remarkSudahDiScan === filterStatus;
    const matchWeek = filterWeek === 'Semua' || e.weekApproval === filterWeek;
    return matchSearch && matchStatus && matchWeek;
  });

  const totalScanned = entries.filter((e) => e.remarkSudahDiScan === 'Sudah Di Scan').length;
  const totalPending = entries.filter((e) => e.remarkSudahDiScan === 'Belum Di Scan').length;
  const totalWithPhoto = entries.filter((e) => e.photoUrl !== null).length;

  const weekGroups = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.weekApproval] = (acc[e.weekApproval] ?? 0) + 1;
    return acc;
  }, {});

  function openAddModal() {
    setEditingEntry(null);
    setPhotoPreview(null);
    setPhotoFile(null);
    reset({ tanggal: new Date().toISOString().split('T')[0], weekApproval: 'W37', remarkSudahDiScan: 'Belum Di Scan', catatan: '' });
    setModalOpen(true);
  }

  function openEditModal(entry: ApprovalEntry) {
    setEditingEntry(entry);
    setPhotoPreview(entry.photoUrl);
    setPhotoFile(null);
    reset({ tanggal: entry.tanggal, weekApproval: entry.weekApproval, remarkSudahDiScan: entry.remarkSudahDiScan, catatan: entry.catatan });
    setModalOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadPhoto(file: File): Promise<{ url: string; name: string } | null> {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'approval');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload foto gagal');
      }
      return await res.json().then((d) => ({ url: d.url, name: d.name }));
    } catch (err: any) {
      addToast('error', err.message || 'Upload foto gagal. Silakan coba lagi.');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onSubmit(data: FormValues) {
    const session = getSession();
    const editedBy = session?.username ?? 'admin';

    let finalPhotoUrl: string | null = editingEntry?.photoUrl ?? null;
    let finalPhotoName: string | null = editingEntry?.photoName ?? null;

    if (photoFile) {
      const uploaded = await uploadPhoto(photoFile);
      if (!uploaded) return;
      finalPhotoUrl = uploaded.url;
      finalPhotoName = uploaded.name;
    } else if (photoPreview === null) {
      finalPhotoUrl = null;
      finalPhotoName = null;
    }

    try {
      if (editingEntry) {
        const res = await fetch(`/api/tracker-approval/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, photoUrl: finalPhotoUrl, photoName: finalPhotoName, editedBy }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal memperbarui data'); }
        const updated = await res.json();
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        addToast('success', `Data approval ${data.weekApproval} tanggal ${formatDate(data.tanggal)} berhasil diperbarui.`);
      } else {
        const res = await fetch('/api/tracker-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, photoUrl: finalPhotoUrl, photoName: finalPhotoName, editedBy }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal menambahkan data'); }
        const created = await res.json();
        setEntries((prev) => [created, ...prev]);
        addToast('success', `Data approval ${data.weekApproval} berhasil ditambahkan.`);
      }
      setModalOpen(false);
      setPhotoPreview(null);
      setPhotoFile(null);
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
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatDateTime(dtStr: string) {
    const dt = new Date(dtStr);
    const d = String(dt.getDate()).padStart(2, '0');
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const h = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    return `${d}/${mo} ${h}:${mi}`;
  }

  const weekColors: Record<string, string> = {
    W35: 'bg-muted text-muted-foreground',
    W36: 'bg-secondary/10 text-secondary',
    W37: 'bg-primary/10 text-primary',
    W38: 'bg-accent/10 text-accent',
    W39: 'bg-pending-bg text-pending',
    W40: 'bg-success-bg text-success',
  };

  return (
    <div className="p-6 xl:p-8 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare size={22} className="text-primary" />
            Tracker Approval
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pendataan hasil scan berkas approval berdasarkan tanggal dan week</p>
        </div>
        <button onClick={openAddModal} className="btn-primary"><Plus size={16} />Tambah Data</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Approval" value={entries.length} color="blue" icon={<CheckSquare size={18} />} />
        <SummaryCard label="Sudah Di Scan" value={totalScanned} total={entries.length} color="green" icon={<CheckCircle size={18} />} />
        <SummaryCard label="Belum Di Scan" value={totalPending} color="amber" icon={<Clock size={18} />} />
        <SummaryCard label="Ada Foto" value={totalWithPhoto} total={entries.length} color="purple" icon={<ImageIcon size={18} />} />
      </div>

      {/* Week breakdown pills */}
      <div className="card-base p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Distribusi Per Week</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(weekGroups).sort().map(([week, count]) => (
            <button
              key={`week-pill-${week}`}
              onClick={() => setFilterWeek(filterWeek === week ? 'Semua' : week)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                ${filterWeek === week ? 'ring-2 ring-primary ring-offset-1' : ''}
                ${weekColors[week] ?? 'bg-muted text-muted-foreground'}`}
            >
              {week} <span className="opacity-70">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-4 mb-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Cari week, tanggal, catatan..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-muted-foreground flex-shrink-0" />
          {(['Semua', 'Sudah Di Scan', 'Belum Di Scan'] as FilterStatus[]).map((f) => (
            <button key={`filter-apv-${f}`} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap
                ${filterStatus === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={15} className="text-muted-foreground flex-shrink-0" />
          {WEEK_OPTIONS.map((w) => (
            <button key={`week-filter-${w}`} onClick={() => setFilterWeek(w)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap
                ${filterWeek === w ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
              {w}
            </button>
          ))}
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
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Week</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Remark Scan</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Foto</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Catatan</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Diedit Oleh</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <CheckSquare size={36} className="opacity-30" />
                      <p className="font-semibold text-base">Tidak ada data ditemukan</p>
                    </div>
                  </td></tr>
                ) : (
                  filtered.map((entry, idx) => (
                    <tr key={entry.id} className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors duration-150
                      ${removingId === entry.id ? 'row-exit' : ''} ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <td className="px-4 py-3 text-muted-foreground font-tabular text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 text-muted-foreground font-tabular text-xs">{formatDate(entry.tanggal)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${weekColors[entry.weekApproval] ?? 'bg-muted text-muted-foreground'}`}>
                          {entry.weekApproval}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={entry.remarkSudahDiScan} /></td>
                      <td className="px-4 py-3">
                        {entry.photoUrl ? (
                          <button onClick={() => setLightboxPhoto({ url: entry.photoUrl!, name: entry.photoName! })}
                            className="group relative w-10 h-10 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors">
                            <AppImage src={entry.photoUrl} alt={`Foto approval ${entry.weekApproval}`} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                            <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye size={14} className="text-white" />
                            </div>
                          </button>
                        ) : <span className="text-xs text-muted-foreground italic">Tidak ada</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[160px] truncate" title={entry.catatan}>
                        {entry.catatan || <span className="italic opacity-50">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-foreground">{entry.editedBy}</p>
                          <p className="text-xs text-muted-foreground font-tabular">{formatDateTime(entry.editedAt)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(entry)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteTarget(entry.id)} className="p-1.5 rounded-lg hover:bg-danger-bg hover:text-danger text-muted-foreground transition-colors"><Trash2 size={14} /></button>
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative card-base w-full max-w-lg shadow-modal scale-enter overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-base text-foreground">{editingEntry ? 'Edit Data Approval' : 'Tambah Data Approval'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Tanggal <span className="text-danger">*</span></label>
                <input {...register('tanggal', { required: 'Tanggal wajib diisi' })} type="date" className="input-field" />
                {errors.tanggal && <p className="mt-1 text-xs text-danger">{errors.tanggal.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Week Approval <span className="text-danger">*</span></label>
                <input {...register('weekApproval', { required: 'Week wajib diisi' })} type="text" placeholder="Contoh: W37" className="input-field" />
                {errors.weekApproval && <p className="mt-1 text-xs text-danger">{errors.weekApproval.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Remark Sudah Di Scan <span className="text-danger">*</span></label>
                <select {...register('remarkSudahDiScan', { required: true })} className="input-field">
                  <option value="Belum Di Scan">Belum Di Scan</option>
                  <option value="Sudah Di Scan">Sudah Di Scan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Catatan</label>
                <textarea {...register('catatan')} rows={3} placeholder="Keterangan tambahan (opsional)" className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Foto Hasil Scan</label>
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <AppImage src={photoPreview} alt="Preview foto approval" width={480} height={200} className="w-full h-36 object-cover" unoptimized />
                    <button type="button" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-black/80 transition-colors"><X size={14} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Upload size={22} /><span className="text-sm font-medium">Klik untuk upload foto</span><span className="text-xs">JPG, PNG — maks. 5MB</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || uploadingPhoto}>
                  {(isSubmitting || uploadingPhoto) ? (
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

      <ConfirmModal open={deleteTarget !== null} title="Hapus Data Approval" description="Data ini akan dihapus secara permanen. Lanjutkan?" confirmLabel="Ya, Hapus" onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />
      {lightboxPhoto && <PhotoLightbox open photoUrl={lightboxPhoto.url} photoName={lightboxPhoto.name} onClose={() => setLightboxPhoto(null)} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}