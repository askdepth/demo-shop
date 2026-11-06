// server/actions/reviews.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(3, 'Add a short headline').max(100),
  body: z.string().trim().min(10, 'Tell us a bit more (10+ characters)').max(2000),
  name: z.string().trim().max(60).optional(),
});

const questionSchema = z.object({
  productId: z.string().min(1),
  question: z.string().trim().min(8, 'Question is too short').max(300),
  name: z.string().trim().max(60).optional(),
});

async function displayName(provided?: string) {
  const session = await getCurrentSession();
  return session?.user?.name || provided || 'Anonymous';
}

export async function submitReview(formData: FormData) {
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid review' };
  }
  const { productId, rating, title, body, name } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  if (!product) return { success: false, error: 'Product not found' };

  const session = await getCurrentSession();
  await prisma.review.create({
    data: {
      productId,
      rating,
      title,
      body,
      authorName: await displayName(name),
      verified: !!session?.user,
    },
  });

  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count._all,
    },
  });

  revalidatePath(`/products/${product.slug}`);
  return { success: true };
}

export async function markReviewHelpful(reviewId: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { helpful: { increment: 1 } },
    select: { helpful: true, product: { select: { slug: true } } },
  });
  revalidatePath(`/products/${review.product.slug}`);
  return { success: true, helpful: review.helpful };
}

export async function askQuestion(formData: FormData) {
  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid question' };
  }
  const { productId, question, name } = parsed.data;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  if (!product) return { success: false, error: 'Product not found' };

  await prisma.question.create({
    data: { productId, question, askerName: await displayName(name) },
  });
  revalidatePath(`/products/${product.slug}`);
  return { success: true };
}

export async function voteQuestion(questionId: string) {
  const q = await prisma.question.update({
    where: { id: questionId },
    data: { votes: { increment: 1 } },
    select: { votes: true, product: { select: { slug: true } } },
  });
  revalidatePath(`/products/${q.product.slug}`);
  return { success: true, votes: q.votes };
}
