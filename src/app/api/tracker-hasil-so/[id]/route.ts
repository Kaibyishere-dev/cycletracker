import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromCookie } from '@/lib/auth-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { id } = await params;
    const body = await request.json();
    const { namaPT, remarkSudahDiScan, tanggalInput, photoUrl, photoName, catatan, editedBy } = body;

    if (!namaPT || !remarkSudahDiScan || !tanggalInput) {
      return NextResponse.json({ error: 'Nama PT, remark scan, dan tanggal wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tracker_hasil_so')
      .update({
        nama_pt: namaPT,
        remark_sudah_di_scan: remarkSudahDiScan,
        tanggal_input: tanggalInput,
        photo_url: photoUrl ?? null,
        photo_name: photoName ?? null,
        catatan: catatan ?? '',
        edited_by: editedBy ?? '',
        edited_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('PUT tracker_hasil_so error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
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
    });
  } catch (err: any) {
    console.error('PUT tracker_hasil_so exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { id } = await params;

    const { error } = await supabase
      .from('tracker_hasil_so')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DELETE tracker_hasil_so error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE tracker_hasil_so exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
