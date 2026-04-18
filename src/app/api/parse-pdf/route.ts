import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart form data' }, { status: 415 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const blob = file as File;

    if (blob.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    if (blob.type !== 'application/pdf' && !blob.name?.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 415 });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    // Dynamically require pdf-parse to avoid SSR issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer, {
      max: 0, // parse all pages
    });

    const text = (data.text as string)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();

    if (!text || text.length < 30) {
      return NextResponse.json(
        { error: 'Could not extract text — this PDF may be a scanned image. Please use the paste option.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: text.slice(0, 15000) });
  } catch (err: unknown) {
    console.error('[/api/parse-pdf]', err);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
