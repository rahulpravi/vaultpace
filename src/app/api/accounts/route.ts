import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createAccountSchema } from '@/lib/validations';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const auth = await getAuthContext();
    const accounts = store.getAccounts();
    const totalNetWorthCents = accounts.reduce((acc, a) => acc + a.current_balance, 0);

    return NextResponse.json({
      accounts,
      net_worth_cents: totalNetWorthCents,
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
    const parsed = createAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const created = store.addAccount(parsed.data);
    return NextResponse.json({ account: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
