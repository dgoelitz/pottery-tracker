"use client";

import { useState } from "react";
import { addPot, Pot } from "../lib/db";
import { categories } from "../data/categories";

type AddPotButtonProps = {
  onPotAdded?: (pot: Pot) => void;
};

export default function AddPotButton({ onPotAdded }: AddPotButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleAddPot = async () => {
    const title = prompt("Enter a name for the new pot:");
    if (!title) return;

    setLoading(true);

    const newPot: Pot = {
      id: Date.now(),
      title,
      categoryId: categories[0].id,
      photos: [],
      createdAt: Date.now(),
    };

    await addPot(newPot);

    if (onPotAdded) onPotAdded(newPot);

    setLoading(false);
    alert(`Pot "${title}" added!`);
  };

  return (
    <button
      onClick={handleAddPot}
      disabled={loading}
      className="fixed bottom-6 right-6 bg-red-500 text-white p-4 rounded-full shadow-lg text-2xl hover:bg-red-600"
    >
      +
    </button>
  );
}
