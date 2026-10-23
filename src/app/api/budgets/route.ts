import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createBudgetSchema } from '@/lib/validations';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const auth = await getAuthContext();
    const budgets = store.getBudgets();
    const transactions = store.getTransactions();

    // Compute live spent progress for each budget
    const enriched = budgets.map((b) => {
      const spent = transactions
        .filter((t) => {
          if (t.transaction_type !== 'expense') return false;
          if (b.start_date && t.transaction_date < b.start_date) return false;
          if (b.end_date && t.transaction_date > b.end_date) return false;
          if (b.category_ids && b.category_ids.length > 0) {
            if (!t.category_id || !b.category_ids.includes(t.category_id)) return false;
          }
          return true;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...b,
        spent_cents: spent,
        remaining_cents: b.amount_limit - spent,
        is_overspent: spent > b.amount_limit,
      };
    });

    return NextResponse.json({ budgets: enriched, user_id: auth.userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    const body = await req.json();
    const parsed = createBudgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const created = store.addBudget(parsed.data);
    return NextResponse.json({ budget: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
