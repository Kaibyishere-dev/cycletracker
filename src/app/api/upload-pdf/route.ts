import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromCookie } from '@/lib/auth-server';

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Validate file type - PDF only
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File harus berformat PDF' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: 'Ukuran file terlalu besar (maksimal 10MB)' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.pdf`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await adminClient.storage
      .from('cycletracker-photos')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      console.error('PDF storage upload error:', error);
      return NextResponse.json({ error: `Upload PDF gagal: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = adminClient.storage
      .from('cycletracker-photos')
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
      name: file.name,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Upload PDF exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
