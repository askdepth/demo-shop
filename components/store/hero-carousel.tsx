'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Slide {
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  from: string;
  to: string;
  emoji: string;
}

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI(v => (v + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const go = (d: number) => setI(v => (v + d + slides.length) % slides.length);

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      data-testid="hero-carousel"
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {slides.map((s, idx) => (
          <div
            key={s.title}
            className="relative flex h-[300px] w-full shrink-0 items-center sm:h-[340px] lg:h-[400px]"
            style={{ background: `linear-gradient(120deg, ${s.from}, ${s.to})` }}
            aria-hidden={idx !== i}
          >
            <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-10 pb-28 sm:px-16 sm:pb-24">
              <div className="max-w-xl text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                  {s.eyebrow}
                </p>
                <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">{s.title}</h2>
                <p className="mt-3 hidden text-base text-white/90 sm:block">{s.text}</p>
                <Link
                  href={s.href}
                  tabIndex={idx === i ? 0 : -1}
                  className="mt-5 inline-block rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-black hover:bg-amber-500"
                >
                  {s.cta}
                </Link>
              </div>
              <div className="hidden text-[170px] leading-none drop-shadow-lg md:block">{s.emoji}</div>
            </div>
          </div>
        ))}
      </div>
      {/* fade into page background like the Amazon hero */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-100 to-transparent" />

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-2 top-[40%] rounded p-2 text-white/90 hover:bg-black/20"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-2 top-[40%] rounded p-2 text-white/90 hover:bg-black/20"
      >
        <ChevronRight className="h-8 w-8" />
      </button>
      <div className="absolute bottom-28 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((s, idx) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={cn('h-2 w-2 rounded-full bg-white/50', idx === i && 'bg-white')}
          />
        ))}
      </div>
    </section>
  );
}
