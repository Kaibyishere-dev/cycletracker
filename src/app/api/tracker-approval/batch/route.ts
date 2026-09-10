import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromCookie } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();
    const { tanggal, weekApproval, tasks, editedBy } = body;

    if (!tanggal || !weekApproval || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'Tanggal, week approval, dan minimal 1 task wajib diisi' }, { status: 400 });
    }

    const rows = tasks.map((task: any) => ({
      tanggal,
      week_approval: weekApproval,
      remark_sudah_di_scan: task.remarkSudahDiScan ?? 'Belum Di Scan',
      cycle_count: task.cycleCount ?? '',
      pdf_url: task.pdfUrl ?? null,
      pdf_name: task.pdfName ?? null,
      catatan: task.catatan ?? '',
      edited_by: editedBy ?? '',
      edited_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('tracker_approval')
      .insert(rows)
      .select();

    if (error) {
      console.error('POST batch tracker_approval error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const entries = (data || []).map((row: any) => ({
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

    return NextResponse.json(entries, { status: 201 });
  } catch (err: any) {
    console.error('POST batch tracker_approval exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
