import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Verify Vercel Cron Secret if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    const budgets = store.getBudgets();
    const transactions = store.getTransactions();

    const alerts: Array<{ budgetId: string; budgetName: string; percentSpent: number }> = [];

    for (const b of budgets) {
      const spent = transactions
        .filter((t) => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = (spent / b.amount_limit) * 100;
      if (percent >= b.notify_threshold * 100) {
        alerts.push({
          budgetId: b.id,
          budgetName: b.name,
          percentSpent: Math.round(percent),
        });
      }
    }

    return NextResponse.json({
      success: true,
      evaluated_at: new Date().toISOString(),
      budgets_checked: budgets.length,
      alerts_generated: alerts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Cron execution failed' }, { status: 500 });
  }
}
