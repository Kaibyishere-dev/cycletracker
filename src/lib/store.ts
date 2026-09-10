// Backend integration point: replace with API calls to your backend (e.g. REST, Supabase, etc.)

export interface HasilSOEntry {
  id: string;
  namaPT: string;
  remarkSudahDiScan: 'Sudah Di Scan' | 'Belum Di Scan';
  tanggalInput: string;
  photoUrl: string | null;
  photoName: string | null;
  catatan: string;
  editedBy: string;
  editedAt: string;
}

export interface ApprovalEntry {
  id: string;
  tanggal: string;
  weekApproval: string;
  remarkSudahDiScan: 'Sudah Di Scan' | 'Belum Di Scan';
  photoUrl: string | null;
  photoName: string | null;
  catatan: string;
  editedBy: string;
  editedAt: string;
}

export interface FormScanPickupEntry {
  id: string;
  namaPt: string;
  remarkSudahDiScan: 'Sudah Di Scan' | 'Belum Di Scan';
  remarkSudahDiAdjust: 'Sudah Di Adjust' | 'Belum Di Adjust';
  tanggalInput: string;
  photoUrl: string | null;
  photoName: string | null;
  pdfUrl: string | null;
  pdfName: string | null;
  catatan: string;
  editedBy: string;
  editedAt: string;
}

// ── Seed Data ──────────────────────────────────────────────────────────────────

export const initialHasilSO: HasilSOEntry[] = [
{
  id: 'so-001',
  namaPT: 'PT Sumber Makmur Abadi',
  remarkSudahDiScan: 'Sudah Di Scan',
  tanggalInput: '2026-09-01',
  photoUrl: "https://images.unsplash.com/photo-1652860520332-7b1dca630a25",
  photoName: 'scan_sumber_makmur_01.jpg',
  catatan: 'Scan lengkap semua halaman',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-01T08:32:00'
},
{
  id: 'so-002',
  namaPT: 'PT Cahaya Nusantara',
  remarkSudahDiScan: 'Sudah Di Scan',
  tanggalInput: '2026-09-01',
  photoUrl: "https://images.unsplash.com/photo-1597126470565-af3a035ae004",
  photoName: 'scan_cahaya_nusantara_01.jpg',
  catatan: '',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-01T09:15:00'
},
{
  id: 'so-003',
  namaPT: 'PT Maju Bersama Sejahtera',
  remarkSudahDiScan: 'Belum Di Scan',
  tanggalInput: '2026-09-02',
  photoUrl: null,
  photoName: null,
  catatan: 'Menunggu dokumen dari gudang',
  editedBy: 'supervisor.cc',
  editedAt: '2026-09-02T07:45:00'
},
{
  id: 'so-004',
  namaPT: 'PT Karya Mandiri Utama',
  remarkSudahDiScan: 'Sudah Di Scan',
  tanggalInput: '2026-09-02',
  photoUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1d87e7be4-1766525130357.png",
  photoName: 'scan_karya_mandiri_01.jpg',
  catatan: 'Scan 3 lembar',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-02T10:20:00'
},
{
  id: 'so-005',
  namaPT: 'PT Indo Global Persada',
  remarkSudahDiScan: 'Belum Di Scan',
  tanggalInput: '2026-09-03',
  photoUrl: null,
  photoName: null,
  catatan: '',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-03T08:00:00'
},
{
  id: 'so-006',
  namaPT: 'PT Sentosa Jaya Abadi',
  remarkSudahDiScan: 'Sudah Di Scan',
  tanggalInput: '2026-09-03',
  photoUrl: "https://images.unsplash.com/photo-1568435307471-3c0c8b921188",
  photoName: 'scan_sentosa_jaya_01.jpg',
  catatan: 'Lengkap 5 halaman',
  editedBy: 'supervisor.cc',
  editedAt: '2026-09-03T11:30:00'
},
{
  id: 'so-007',
  namaPT: 'PT Berkah Mulya Pratama',
  remarkSudahDiScan: 'Belum Di Scan',
  tanggalInput: '2026-09-04',
  photoUrl: null,
  photoName: null,
  catatan: 'Dokumen sedang diproses',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-04T07:15:00'
},
{
  id: 'so-008',
  namaPT: 'PT Surya Gemilang Nusantara',
  remarkSudahDiScan: 'Sudah Di Scan',
  tanggalInput: '2026-09-04',
  photoUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_129bacbf9-1765204284398.png",
  photoName: 'scan_surya_gemilang_01.jpg',
  catatan: '',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-04T14:05:00'
},
{
  id: 'so-009',
  namaPT: 'PT Graha Persada Indah',
  remarkSudahDiScan: 'Sudah Di Scan',
  tanggalInput: '2026-09-05',
  photoUrl: "https://images.unsplash.com/photo-1708191124984-61c3d49f34e3",
  photoName: 'scan_graha_persada_01.jpg',
  catatan: 'Scan ulang karena blur',
  editedBy: 'supervisor.cc',
  editedAt: '2026-09-05T09:50:00'
},
{
  id: 'so-010',
  namaPT: 'PT Mega Bintang Perkasa',
  remarkSudahDiScan: 'Belum Di Scan',
  tanggalInput: '2026-09-05',
  photoUrl: null,
  photoName: null,
  catatan: '',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-05T08:30:00'
},
{
  id: 'so-011',
  namaPT: 'PT Tunas Harapan Bangsa',
  remarkSudahDiScan: 'Sudah Di Scan',
  tanggalInput: '2026-09-08',
  photoUrl: "https://images.unsplash.com/photo-1545568900-77a62c23454c",
  photoName: 'scan_tunas_harapan_01.jpg',
  catatan: 'Hari ini — scan pagi',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-08T08:10:00'
},
{
  id: 'so-012',
  namaPT: 'PT Bumi Lestari Sejati',
  remarkSudahDiScan: 'Belum Di Scan',
  tanggalInput: '2026-09-08',
  photoUrl: null,
  photoName: null,
  catatan: '',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-08T08:15:00'
}];


export const initialApproval: ApprovalEntry[] = [
{
  id: 'apv-001',
  tanggal: '2026-09-01',
  weekApproval: 'W36',
  remarkSudahDiScan: 'Sudah Di Scan',
  photoUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1f33d1387-1777663912752.png",
  photoName: 'apv_w36_01.jpg',
  catatan: 'Approval minggu 36 lengkap',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-01T10:00:00'
},
{
  id: 'apv-002',
  tanggal: '2026-09-01',
  weekApproval: 'W36',
  remarkSudahDiScan: 'Sudah Di Scan',
  photoUrl: "https://img.rocket.new/generatedImages/rocket_gen_img_1ec5f4681-1766772669233.png",
  photoName: 'apv_w36_02.jpg',
  catatan: '',
  editedBy: 'supervisor.cc',
  editedAt: '2026-09-01T11:20:00'
},
{
  id: 'apv-003',
  tanggal: '2026-09-02',
  weekApproval: 'W36',
  remarkSudahDiScan: 'Belum Di Scan',
  photoUrl: null,
  photoName: null,
  catatan: 'Menunggu tanda tangan',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-02T08:30:00'
},
{
  id: 'apv-004',
  tanggal: '2026-09-03',
  weekApproval: 'W36',
  remarkSudahDiScan: 'Sudah Di Scan',
  photoUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
  photoName: 'apv_w36_04.jpg',
  catatan: '',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-03T13:00:00'
},
{
  id: 'apv-005',
  tanggal: '2026-09-04',
  weekApproval: 'W36',
  remarkSudahDiScan: 'Belum Di Scan',
  photoUrl: null,
  photoName: null,
  catatan: 'Perlu revisi',
  editedBy: 'supervisor.cc',
  editedAt: '2026-09-04T09:10:00'
},
{
  id: 'apv-006',
  tanggal: '2026-09-05',
  weekApproval: 'W36',
  remarkSudahDiScan: 'Sudah Di Scan',
  photoUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
  photoName: 'apv_w36_06.jpg',
  catatan: 'Scan 2 lembar',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-05T14:30:00'
},
{
  id: 'apv-007',
  tanggal: '2026-09-08',
  weekApproval: 'W37',
  remarkSudahDiScan: 'Belum Di Scan',
  photoUrl: null,
  photoName: null,
  catatan: 'Minggu baru',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-08T08:00:00'
},
{
  id: 'apv-008',
  tanggal: '2026-09-08',
  weekApproval: 'W37',
  remarkSudahDiScan: 'Sudah Di Scan',
  photoUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
  photoName: 'apv_w37_01.jpg',
  catatan: '',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-08T09:45:00'
},
{
  id: 'apv-009',
  tanggal: '2026-08-25',
  weekApproval: 'W35',
  remarkSudahDiScan: 'Sudah Di Scan',
  photoUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
  photoName: 'apv_w35_01.jpg',
  catatan: 'Lengkap',
  editedBy: 'supervisor.cc',
  editedAt: '2026-08-25T10:00:00'
},
{
  id: 'apv-010',
  tanggal: '2026-08-26',
  weekApproval: 'W35',
  remarkSudahDiScan: 'Sudah Di Scan',
  photoUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
  photoName: 'apv_w35_02.jpg',
  catatan: '',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-08-26T11:00:00'
}];


export const initialFormScanPickup: FormScanPickupEntry[] = [
{
  id: 'fsp-001',
  remarkSudahDiScan: 'Sudah Di Scan',
  remarkSudahDiAdjust: 'Sudah Di Adjust',
  tanggalInput: '2026-09-01',
  photoUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
  photoName: 'fsp_01.jpg',
  catatan: 'Selesai proses',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-01T10:30:00'
},
{
  id: 'fsp-002',
  remarkSudahDiScan: 'Sudah Di Scan',
  remarkSudahDiAdjust: 'Belum Di Adjust',
  tanggalInput: '2026-09-02',
  photoUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
  photoName: 'fsp_02.jpg',
  catatan: 'Menunggu adjust dari tim gudang',
  editedBy: 'supervisor.cc',
  editedAt: '2026-09-02T09:00:00'
},
{
  id: 'fsp-003',
  remarkSudahDiScan: 'Belum Di Scan',
  remarkSudahDiAdjust: 'Belum Di Adjust',
  tanggalInput: '2026-09-03',
  photoUrl: null,
  photoName: null,
  catatan: '',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-03T08:00:00'
},
{
  id: 'fsp-004',
  remarkSudahDiScan: 'Sudah Di Scan',
  remarkSudahDiAdjust: 'Sudah Di Adjust',
  tanggalInput: '2026-09-04',
  photoUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
  photoName: 'fsp_04.jpg',
  catatan: 'OK',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-04T12:00:00'
},
{
  id: 'fsp-005',
  remarkSudahDiScan: 'Belum Di Scan',
  remarkSudahDiAdjust: 'Belum Di Adjust',
  tanggalInput: '2026-09-05',
  photoUrl: null,
  photoName: null,
  catatan: 'Dokumen belum tiba',
  editedBy: 'supervisor.cc',
  editedAt: '2026-09-05T07:30:00'
},
{
  id: 'fsp-006',
  remarkSudahDiScan: 'Sudah Di Scan',
  remarkSudahDiAdjust: 'Belum Di Adjust',
  tanggalInput: '2026-09-08',
  photoUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
  photoName: 'fsp_06.jpg',
  catatan: 'Adjust masih pending',
  editedBy: 'admin.cyclecount',
  editedAt: '2026-09-08T08:45:00'
}];