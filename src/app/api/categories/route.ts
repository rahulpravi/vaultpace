import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createCategorySchema } from '@/lib/validations';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    const type = new URL(req.url).searchParams.get('type');
    let cats = store.getCategories();
    if (type === 'expense' || type === 'income') {
      cats = cats.filter((c) => c.category_type === type);
    }
    return NextResponse.json({ categories: cats, user_id: auth.userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const created = store.addCategory(parsed.data);
    return NextResponse.json({ category: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
