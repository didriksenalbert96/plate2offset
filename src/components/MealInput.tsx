interface MealInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MealInput({ value, onChange }: MealInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="meal-description" className="block text-sm font-medium text-stone-700">
        Describe what you ate
      </label>
      <textarea
        id="meal-description"
        rows={3}
        placeholder='e.g. "Chicken burrito with cheese" or "this week I had pasta, two burgers, and a tuna sandwich"'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  );
}
