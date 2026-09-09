import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionFromCookie } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
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
      photoUrl: row.photo_url,
      photoName: row.photo_name,
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

    const supabase = await createClient();
    const body = await request.json();
    const { tanggal, weekApproval, remarkSudahDiScan, photoUrl, photoName, catatan, editedBy } = body;

    if (!tanggal || !weekApproval || !remarkSudahDiScan) {
      return NextResponse.json({ error: 'Tanggal, week approval, dan remark scan wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tracker_approval')
      .insert({
        tanggal,
        week_approval: weekApproval,
        remark_sudah_di_scan: remarkSudahDiScan,
        photo_url: photoUrl ?? null,
        photo_name: photoName ?? null,
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
      photoUrl: data.photo_url,
      photoName: data.photo_name,
      catatan: data.catatan,
      editedBy: data.edited_by,
      editedAt: data.edited_at,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST tracker_approval exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
