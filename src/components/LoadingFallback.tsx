export function LoadingFallback() {
  return (
    <div
      className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="font-display text-lg font-bold tracking-tight text-[#111111] dark:text-white">
          MRM.
        </span>
        <span className="text-xs tracking-wide text-[#666666] dark:text-[#A1A1A1]">
          Loading page...
        </span>
      </div>
    </div>
  );
}
