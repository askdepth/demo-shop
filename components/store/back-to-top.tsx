'use client';

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="block w-full bg-[#37475a] py-3 text-center text-sm text-white hover:bg-[#485769]"
    >
      Back to top
    </button>
  );
}
