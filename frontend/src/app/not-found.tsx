import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0b1f2e] px-4 text-center text-slate-100">
      <h1 className="text-4xl font-black text-amber-300">404</h1>
      <p className="mt-2 text-sm text-slate-300">This quest realm could not be found.</p>
      <Link
        href="/"
        className="mt-5 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950"
      >
        Return to Lobby
      </Link>
    </div>
  );
}
