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
      .from('tracker_approval')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET tracker_approval error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const entries = (data || []).map((row) => ({
      id: row.id,
      tanggal: row.tanggal,
      weekApproval: row.week_approval,
      remarkSudahDiScan: row.remark_sudah_di_scan,
      cycleCount: row.cycle_count ?? '',
      pdfUrl: row.pdf_url ?? null,
      pdfName: row.pdf_name ?? null,
      photoUrl: row.photo_url ?? null,
      photoName: row.photo_name ?? null,
      catatan: row.catatan,
      editedBy: row.edited_by,
      editedAt: row.edited_at,
    }));

    return NextResponse.json(entries);
  } catch (err: any) {
    console.error('GET tracker_approval exception:', err);
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
    const { tanggal, weekApproval, remarkSudahDiScan, cycleCount, pdfUrl, pdfName, catatan, editedBy } = body;

    if (!tanggal || !weekApproval || !remarkSudahDiScan) {
      return NextResponse.json({ error: 'Tanggal, week approval, dan remark scan wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tracker_approval')
      .insert({
        tanggal,
        week_approval: weekApproval,
        remark_sudah_di_scan: remarkSudahDiScan,
        cycle_count: cycleCount ?? '',
        pdf_url: pdfUrl ?? null,
        pdf_name: pdfName ?? null,
        catatan: catatan ?? '',
        edited_by: editedBy ?? '',
        edited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('POST tracker_approval error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      tanggal: data.tanggal,
      weekApproval: data.week_approval,
      remarkSudahDiScan: data.remark_sudah_di_scan,
      cycleCount: data.cycle_count ?? '',
      pdfUrl: data.pdf_url ?? null,
      pdfName: data.pdf_name ?? null,
      photoUrl: data.photo_url ?? null,
      photoName: data.photo_name ?? null,
      catatan: data.catatan,
      editedBy: data.edited_by,
      editedAt: data.edited_at,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST tracker_approval exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
