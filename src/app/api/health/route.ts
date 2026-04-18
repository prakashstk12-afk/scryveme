import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'scryveme-resume-scorer',
    timestamp: new Date().toISOString(),
  });
}
