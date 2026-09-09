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
      .from('tracker_email_supplier')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET tracker_email_supplier error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const entries = (data || []).map((row) => ({
      id: row.id,
      namaPT: row.nama_pt,
      namaBarang: row.nama_barang,
      kodeBarang: row.kode_barang,
      letterStatus: row.letter_status,
      tanggalLetter1: row.tanggal_letter1,
      tanggalLetterTerakhir: row.tanggal_letter_terakhir,
      replyStatus: row.reply_status,
      catatan: row.catatan,
      editedBy: row.edited_by,
      editedAt: row.edited_at,
    }));

    return NextResponse.json(entries);
  } catch (err: any) {
    console.error('GET tracker_email_supplier exception:', err);
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
    const { namaPT, namaBarang, kodeBarang, letterStatus, tanggalLetter1, tanggalLetterTerakhir, replyStatus, catatan, editedBy } = body;

    if (!namaPT || !namaBarang || !kodeBarang || !letterStatus || !tanggalLetter1 || !tanggalLetterTerakhir) {
      return NextResponse.json({ error: 'Semua field wajib wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tracker_email_supplier')
      .insert({
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
      .select()
      .single();

    if (error) {
      console.error('POST tracker_email_supplier error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST tracker_email_supplier exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
