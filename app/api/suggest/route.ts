// Search autocomplete for the header search bar.
import { NextResponse } from 'next/server';
import { getSuggestions } from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  const data = await getSuggestions(q.slice(0, 60));
  return NextResponse.json(data);
}
