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
    const { namaPT, namaBarang, kodeBarang, letterStatus, tanggalLetter1, tanggalLetterTerakhir, replyStatus, catatan, editedBy } = body;

    if (!namaPT || !namaBarang || !kodeBarang || !letterStatus || !tanggalLetter1 || !tanggalLetterTerakhir) {
      return NextResponse.json({ error: 'Semua field wajib wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tracker_email_supplier')
      .update({
        nama_pt: namaPT,
        nama_barang: namaBarang,
        kode_barang: kodeBarang,
        letter_status: letterStatus,
        tanggal_letter1: tanggalLetter1,
        tanggal_letter_terakhir: tanggalLetterTerakhir,
        reply_status: replyStatus ?? 'Belum Ada Balasan',
        catatan: catatan ?? '',
        edited_by: editedBy ?? '',
        edited_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('PUT tracker_email_supplier error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      namaPT: data.nama_pt,
      namaBarang: data.nama_barang,
      kodeBarang: data.kode_barang,
      letterStatus: data.letter_status,
      tanggalLetter1: data.tanggal_letter1,
      tanggalLetterTerakhir: data.tanggal_letter_terakhir,
      replyStatus: data.reply_status,
      catatan: data.catatan,
      editedBy: data.edited_by,
      editedAt: data.edited_at,
    });
  } catch (err: any) {
    console.error('PUT tracker_email_supplier exception:', err);
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
      .from('tracker_email_supplier')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DELETE tracker_email_supplier error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE tracker_email_supplier exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
