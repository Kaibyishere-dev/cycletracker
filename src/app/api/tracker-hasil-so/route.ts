import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('tracker_hasil_so')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET tracker_hasil_so error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert snake_case to camelCase
    const entries = (data || []).map((row) => ({
      id: row.id,
      namaPT: row.nama_pt,
      remarkSudahDiScan: row.remark_sudah_di_scan,
      tanggalInput: row.tanggal_input,
      photoUrl: row.photo_url,
      photoName: row.photo_name,
      catatan: row.catatan,
      editedBy: row.edited_by,
      editedAt: row.edited_at,
    }));

    return NextResponse.json(entries);
  } catch (err: any) {
    console.error('GET tracker_hasil_so exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { namaPT, remarkSudahDiScan, tanggalInput, photoUrl, photoName, catatan, editedBy } = body;

    if (!namaPT || !remarkSudahDiScan || !tanggalInput) {
      return NextResponse.json({ error: 'Nama PT, remark scan, dan tanggal wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tracker_hasil_so')
      .insert({
        nama_pt: namaPT,
        remark_sudah_di_scan: remarkSudahDiScan,
        tanggal_input: tanggalInput,
        photo_url: photoUrl ?? null,
        photo_name: photoName ?? null,
        catatan: catatan ?? '',
        edited_by: editedBy ?? '',
        edited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('POST tracker_hasil_so error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      namaPT: data.nama_pt,
      remarkSudahDiScan: data.remark_sudah_di_scan,
      tanggalInput: data.tanggal_input,
      photoUrl: data.photo_url,
      photoName: data.photo_name,
      catatan: data.catatan,
      editedBy: data.edited_by,
      editedAt: data.edited_at,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST tracker_hasil_so exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
