import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createTransactionSchema } from '@/lib/validations';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    const url = new URL(req.url);
    const accountId = url.searchParams.get('accountId');
    const categoryId = url.searchParams.get('categoryId');
    const query = url.searchParams.get('query')?.toLowerCase();

    let list = store.getTransactions();

    if (accountId) {
      list = list.filter((t) => t.account_id === accountId || t.to_account_id === accountId);
    }
    if (categoryId) {
      list = list.filter((t) => t.category_id === categoryId);
    }
    if (query) {
      list = list.filter((t) => t.notes?.toLowerCase().includes(query));
    }

    return NextResponse.json({
      transactions: list,
      total: list.length,
      user_id: auth.userId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    const body = await req.json();
    const parsed = createTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const created = store.addTransaction(parsed.data);
    return NextResponse.json({ transaction: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
