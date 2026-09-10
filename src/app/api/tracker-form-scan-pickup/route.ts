import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromCookie } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('tracker_form_scan_pickup')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET tracker_form_scan_pickup error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const entries = (data || []).map((row) => ({
      id: row.id,
      namaPt: row.nama_pt ?? '',
      remarkSudahDiScan: row.remark_sudah_di_scan,
      remarkSudahDiAdjust: row.remark_sudah_di_adjust,
      tanggalInput: row.tanggal_input,
      photoUrl: row.photo_url,
      photoName: row.photo_name,
      pdfUrl: row.pdf_url ?? null,
      pdfName: row.pdf_name ?? null,
      catatan: row.catatan,
      editedBy: row.edited_by,
      editedAt: row.edited_at,
    }));

    return NextResponse.json(entries);
  } catch (err: any) {
    console.error('GET tracker_form_scan_pickup exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();
    const { namaPt, remarkSudahDiScan, remarkSudahDiAdjust, tanggalInput, photoUrl, photoName, pdfUrl, pdfName, catatan, editedBy } = body;

    if (!namaPt || !namaPt.trim()) {
      return NextResponse.json({ error: 'Nama PT wajib diisi' }, { status: 400 });
    }
    if (!remarkSudahDiScan || !remarkSudahDiAdjust || !tanggalInput) {
      return NextResponse.json({ error: 'Remark scan, remark adjust, dan tanggal wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tracker_form_scan_pickup')
      .insert({
        nama_pt: namaPt.trim(),
        remark_sudah_di_scan: remarkSudahDiScan,
        remark_sudah_di_adjust: remarkSudahDiAdjust,
        tanggal_input: tanggalInput,
        photo_url: photoUrl ?? null,
        photo_name: photoName ?? null,
        pdf_url: pdfUrl ?? null,
        pdf_name: pdfName ?? null,
        catatan: catatan ?? '',
        edited_by: editedBy ?? '',
        edited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('POST tracker_form_scan_pickup error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      namaPt: data.nama_pt ?? '',
      remarkSudahDiScan: data.remark_sudah_di_scan,
      remarkSudahDiAdjust: data.remark_sudah_di_adjust,
      tanggalInput: data.tanggal_input,
      photoUrl: data.photo_url,
      photoName: data.photo_name,
      pdfUrl: data.pdf_url ?? null,
      pdfName: data.pdf_name ?? null,
      catatan: data.catatan,
      editedBy: data.edited_by,
      editedAt: data.edited_at,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST tracker_form_scan_pickup exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
