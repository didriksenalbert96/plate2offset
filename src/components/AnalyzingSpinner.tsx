export default function AnalyzingSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      {/* Simple animated spinner */}
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-emerald-600" />
      <p className="text-lg font-medium text-stone-700">Analyzing your meal…</p>
      <p className="text-sm text-stone-500">This usually takes a few seconds.</p>
    </div>
  );
}
