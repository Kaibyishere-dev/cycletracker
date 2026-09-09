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
    const { remarkSudahDiScan, remarkSudahDiAdjust, tanggalInput, photoUrl, photoName, catatan, editedBy } = body;

    if (!remarkSudahDiScan || !remarkSudahDiAdjust || !tanggalInput) {
      return NextResponse.json({ error: 'Remark scan, remark adjust, dan tanggal wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tracker_form_scan_pickup')
      .update({
        remark_sudah_di_scan: remarkSudahDiScan,
        remark_sudah_di_adjust: remarkSudahDiAdjust,
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
      console.error('PUT tracker_form_scan_pickup error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      remarkSudahDiScan: data.remark_sudah_di_scan,
      remarkSudahDiAdjust: data.remark_sudah_di_adjust,
      tanggalInput: data.tanggal_input,
      photoUrl: data.photo_url,
      photoName: data.photo_name,
      catatan: data.catatan,
      editedBy: data.edited_by,
      editedAt: data.edited_at,
    });
  } catch (err: any) {
    console.error('PUT tracker_form_scan_pickup exception:', err);
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
      .from('tracker_form_scan_pickup')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DELETE tracker_form_scan_pickup error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE tracker_form_scan_pickup exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
