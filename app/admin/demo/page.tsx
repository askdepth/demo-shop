import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { ResetDemoButton } from '@/components/store/reset-demo-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Demo tools' };
export const dynamic = 'force-dynamic';

export default async function AdminDemoPage() {
  const [products, reviews, questions, orders, categories] = await Promise.all([
    prisma.product.count(),
    prisma.review.count(),
    prisma.question.count(),
    prisma.order.count(),
    prisma.category.count(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Demo tools</h1>
      <Card>
        <CardHeader>
          <CardTitle>Current data</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            {[
              ['Categories', categories],
              ['Products', products],
              ['Reviews', reviews],
              ['Questions', questions],
              ['Orders', orders],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded border p-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Reset to a clean demo state</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Deletes all products, categories, carts, orders, reviews and questions, then recreates the
            deterministic demo catalog (92 products, reviews, Q&amp;A, and one order in every status for{' '}
            <code>customer@example.com</code>). Users and admins are kept. Do this before a client demo.
          </p>
          <ResetDemoButton />
        </CardContent>
      </Card>
    </div>
  );
}
