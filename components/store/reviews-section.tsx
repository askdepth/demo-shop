'use client';

import { useState, useTransition } from 'react';
import { Check, ThumbsUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/store/rating-stars';
import { formatDate } from '@/lib/utils';
import {
  askQuestion,
  markReviewHelpful,
  submitReview,
  voteQuestion,
} from '@/server/actions/reviews';

export interface ReviewItem {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  answer: string | null;
  answeredBy: string | null;
  askerName: string;
  votes: number;
}

interface Props {
  productId: string;
  avgRating: number;
  reviewCount: number;
  histogram: { star: number; count: number }[];
  reviews: ReviewItem[];
  questions: QuestionItem[];
  signedInName?: string | null;
}

export function ReviewsSection({
  productId,
  avgRating,
  reviewCount,
  histogram,
  reviews,
  questions,
  signedInName,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [rating, setRating] = useState(5);
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<number | null>(null);
  const [shown, setShown] = useState(5);

  const filtered = filter ? reviews.filter(r => r.rating === filter) : reviews;

  const onReview = (fd: FormData) =>
    start(async () => {
      fd.set('productId', productId);
      fd.set('rating', String(rating));
      const res = await submitReview(fd);
      if (res.success) {
        toast.success('Thanks! Your review was posted.');
        setShowForm(false);
      } else toast.error(res.error ?? 'Could not post review');
    });

  const onAsk = (fd: FormData) =>
    start(async () => {
      fd.set('productId', productId);
      const res = await askQuestion(fd);
      if (res.success) {
        toast.success('Question posted. A seller will answer soon.');
        setShowAsk(false);
      } else toast.error(res.error ?? 'Could not post question');
    });

  return (
    <div className="space-y-12">
      {/* Q&A */}
      <section id="questions" data-testid="qa-section">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Customer questions &amp; answers</h2>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAsk(v => !v)}>
            Ask a question
          </Button>
        </div>
        {showAsk && (
          <form action={onAsk} className="mb-6 space-y-2 rounded-md border p-4">
            <label className="block text-sm font-medium" htmlFor="q-text">Your question</label>
            <textarea id="q-text" name="question" required minLength={8} maxLength={300} rows={2} className="w-full rounded border p-2 text-sm" />
            {!signedInName && (
              <input name="name" placeholder="Your name (optional)" className="w-full rounded border p-2 text-sm sm:w-64" />
            )}
            <div>
              <Button type="submit" size="sm" disabled={pending} className="rounded-full bg-amber-400 text-black hover:bg-amber-500">
                Post question
              </Button>
            </div>
          </form>
        )}
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No questions yet. Be the first to ask.</p>
        ) : (
          <ul className="space-y-5">
            {questions.map(q => (
              <li key={q.id} className="grid gap-1 text-sm" data-testid="question-item">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="flex w-12 shrink-0 flex-col items-center rounded border py-1 text-xs hover:bg-gray-50"
                    onClick={() => start(async () => { await voteQuestion(q.id); })}
                    aria-label="Vote question as useful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {q.votes}
                  </button>
                  <div>
                    <p className="font-semibold">Q: {q.question}</p>
                    {q.answer ? (
                      <p className="mt-1">
                        <span className="font-semibold">A:</span> {q.answer}{' '}
                        {q.answeredBy && <span className="text-xs text-muted-foreground">By {q.answeredBy}</span>}
                      </p>
                    ) : (
                      <p className="mt-1 text-muted-foreground">Waiting for an answer.</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reviews */}
      <section id="reviews" data-testid="reviews-section">
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <div>
            <h2 className="text-xl font-bold">Customer reviews</h2>
            <div className="mt-2 flex items-center gap-2">
              <RatingStars rating={avgRating} size="md" />
              <span className="text-lg font-medium">{avgRating.toFixed(1)} out of 5</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {reviewCount.toLocaleString()} global rating{reviewCount === 1 ? '' : 's'}
            </p>
            <div className="mt-4 space-y-1.5">
              {histogram.map(h => {
                const pct = reviewCount ? Math.round((h.count / reviewCount) * 100) : 0;
                return (
                  <button
                    key={h.star}
                    type="button"
                    onClick={() => setFilter(filter === h.star ? null : h.star)}
                    className="group flex w-full items-center gap-2 text-sm"
                    aria-pressed={filter === h.star}
                  >
                    <span className="w-12 text-sky-700 group-hover:underline">{h.star} star</span>
                    <span className="h-5 flex-1 overflow-hidden rounded bg-gray-200">
                      <span className="block h-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-9 text-right text-sky-700">{pct}%</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold">Review this product</h3>
              <p className="text-sm text-muted-foreground">Share your thoughts with other customers</p>
              <Button variant="outline" className="mt-2 w-full rounded-full" onClick={() => setShowForm(v => !v)}>
                Write a customer review
              </Button>
            </div>
          </div>

          <div>
            {showForm && (
              <form action={onReview} className="mb-8 space-y-3 rounded-md border p-4" data-testid="review-form">
                <h3 className="font-semibold">Create review</h3>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      onClick={() => setRating(n)}
                      className={`text-2xl ${n <= rating ? 'text-amber-500' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <input name="title" required minLength={3} maxLength={100} placeholder="Headline" className="w-full rounded border p-2 text-sm" />
                <textarea name="body" required minLength={10} maxLength={2000} rows={4} placeholder="What did you like or dislike?" className="w-full rounded border p-2 text-sm" />
                {!signedInName && (
                  <input name="name" placeholder="Your name (optional)" className="w-full rounded border p-2 text-sm sm:w-64" />
                )}
                <Button type="submit" disabled={pending} className="rounded-full bg-amber-400 text-black hover:bg-amber-500">
                  Submit
                </Button>
              </form>
            )}

            {filter && (
              <p className="mb-3 text-sm">
                Showing {filter}-star reviews.{' '}
                <button type="button" className="text-sky-700 hover:underline" onClick={() => setFilter(null)}>
                  Clear filter
                </button>
              </p>
            )}
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews to show.</p>
            ) : (
              <ul className="space-y-6">
                {filtered.slice(0, shown).map(r => (
                  <li key={r.id} data-testid="review-item">
                    <p className="text-sm font-medium">{r.authorName}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <RatingStars rating={r.rating} />
                      <span className="text-sm font-bold">{r.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Reviewed on {formatDate(r.createdAt)}
                      {r.verified && (
                        <span className="ml-2 inline-flex items-center gap-0.5 font-semibold text-orange-700">
                          <Check className="h-3 w-3" /> Verified Purchase
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-sm">{r.body}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {r.helpful > 0 && <span>{r.helpful} people found this helpful</span>}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-full px-3 text-xs"
                        onClick={() => start(async () => { await markReviewHelpful(r.id); })}
                      >
                        Helpful
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {filtered.length > shown && (
              <Button variant="outline" className="mt-6 rounded-full" onClick={() => setShown(s => s + 10)}>
                See more reviews
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
