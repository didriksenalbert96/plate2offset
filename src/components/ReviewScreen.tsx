"use client";

import { useState } from "react";
import type { MealItem, Category, Unit } from "@/lib/types";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "red-meat", label: "Red meat" },
  { value: "poultry", label: "Poultry" },
  { value: "pork", label: "Pork" },
  { value: "fish-seafood", label: "Fish / seafood" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "other", label: "Other / plant-based" },
];

const UNITS: Unit[] = ["g", "oz", "ml", "cups", "pieces", "servings"];

interface ReviewScreenProps {
  items: MealItem[];
  onItemsChange: (items: MealItem[]) => void;
  onConfirm: () => void;
  onStartOver: () => void;
}

export default function ReviewScreen({
  items,
  onItemsChange,
  onConfirm,
  onStartOver,
}: ReviewScreenProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editUnit, setEditUnit] = useState<Unit>("g");
  const [editCategory, setEditCategory] = useState<Category>("other");

  // Split items into animal products and plant-based
  const animalItems = items.filter((item) => item.category !== "other");
  const plantItems = items.filter((item) => item.category === "other");

  function startEditing(index: number) {
    const item = items[index];
    setEditName(item.name);
    setEditAmount(String(item.amount));
    setEditUnit(item.unit);
    setEditCategory(item.category);
    setEditingIndex(index);
    setAdding(false);
  }

  function saveEdit() {
    if (editingIndex === null) return;
    const updated = [...items];
    const parsed = parseFloat(editAmount);
    updated[editingIndex] = {
      ...updated[editingIndex],
      name: editName.trim() || updated[editingIndex].name,
      amount: parsed > 0 ? parsed : updated[editingIndex].amount,
      unit: editUnit,
      category: editCategory,
    };
    onItemsChange(updated);
    setEditingIndex(null);
  }

  function startAdding() {
    setEditName("");
    setEditAmount("");
    setEditUnit("g");
    setEditCategory("other");
    setAdding(true);
    setEditingIndex(null);
  }

  function saveAdd() {
    if (!editName.trim()) return;
    const parsed = parseFloat(editAmount);
    const newItem: MealItem = {
      name: editName.trim(),
      amount: parsed > 0 ? parsed : 1,
      unit: editUnit,
      category: editCategory,
      confidence: 1,
    };
    onItemsChange([...items, newItem]);
    setAdding(false);
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }

  function renderForm(onSave: () => void, onCancel: () => void) {
    return (
      <div className="space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
        <input
          type="text"
          placeholder="Ingredient name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Amount"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="w-24 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
          />
          <select
            value={editUnit}
            onChange={(e) => setEditUnit(e.target.value as Unit)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <select
          value={editCategory}
          onChange={(e) => setEditCategory(e.target.value as Category)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  function renderItem(item: MealItem, index: number, dimmed: boolean) {
    if (editingIndex === index) {
      return (
        <div key={index}>
          {renderForm(saveEdit, () => setEditingIndex(null))}
        </div>
      );
    }

    return (
      <div
        key={index}
        className={`flex items-center justify-between rounded-lg px-4 py-3 ${
          dimmed ? "bg-stone-50/50" : "bg-stone-50"
        }`}
      >
        <button
          onClick={() => startEditing(index)}
          className="text-left flex-1 group"
        >
          <div className="flex items-center gap-2">
            <p className={`font-medium ${dimmed ? "text-stone-400" : "text-stone-900"}`}>
              {item.name}
            </p>
            {/* Pencil icon hint */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5 text-stone-300 group-hover:text-emerald-500 transition-colors"
            >
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </div>
          <p className={`text-sm ${dimmed ? "text-stone-300" : "text-stone-500"}`}>
            {item.amount} {item.unit} · {item.category}
            {item.confidence < 0.5 && (
              <span className="ml-2 text-amber-600">uncertain</span>
            )}
          </p>
        </button>
        <button
          onClick={() => removeItem(index)}
          className="ml-3 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label={`Remove ${item.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
      <main className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900">
            Review ingredients
          </h2>
          <p className="mt-1 text-stone-600">
            Tap any item to edit it. Add or remove as needed.
          </p>
        </div>

        {/* Animal products section */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 space-y-3">
          {animalItems.length > 0 && (
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              Animal products (count toward donation)
            </p>
          )}

          {animalItems.length === 0 && plantItems.length > 0 && !adding && (
            <p className="text-center text-stone-500 py-2">
              No animal products detected. Add any that are missing.
            </p>
          )}

          {items.map((item, i) =>
            item.category !== "other" ? renderItem(item, i, false) : null
          )}

          {/* Plant-based section */}
          {plantItems.length > 0 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400 pt-2">
                Plant-based (no offset needed)
              </p>
              {items.map((item, i) =>
                item.category === "other" ? renderItem(item, i, true) : null
              )}
            </>
          )}

          {adding ? (
            renderForm(saveAdd, () => setAdding(false))
          ) : (
            <button
              onClick={startAdding}
              className="w-full rounded-lg border border-dashed border-stone-300 py-3 text-sm text-stone-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
            >
              + Add an ingredient
            </button>
          )}
        </div>

        <div className="space-y-3">
          {items.some((item) => item.category !== "other") && (
            <button
              onClick={onConfirm}
              className="w-full rounded-full bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Confirm & calculate donation
            </button>
          )}

          <button
            onClick={onStartOver}
            className="w-full rounded-full border border-stone-300 px-6 py-3 text-stone-700 transition-colors hover:bg-stone-100"
          >
            Start over
          </button>
        </div>
      </main>
    </div>
  );
}
