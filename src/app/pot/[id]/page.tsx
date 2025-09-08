"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Pot, getPotById, updatePotCategory, addPhotoToPot } from "../../lib/db";
import { categories } from "../../data/categories";
import Header from "../../components/Header";

export default function PotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const potId = Number(unwrappedParams.id);

  const [pot, setPot] = useState<Pot | null>(null);
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(0);

  async function loadPot() {
    const found = await getPotById(potId);
    setPot(found || null);
    setMainPhotoIndex(found && found.photos.length > 0 ? found.photos.length - 1 : 0);
  }

  useEffect(() => {
    loadPot();
  }, []);

  if (!pot) return <p className="p-4">Pot not found</p>;

  const currentPhoto = pot.photos.length > 0 ? pot.photos[mainPhotoIndex].photo : "/placeholder.jpg";
  const category = categories.find((c) => c.id === pot.categoryId);
  const nextCategory = category ? categories.find(c => c.id === category.id + 1) : null;
  const prevCategory = category ? categories.find(c => c.id === category.id - 1) : null;

  const canUpgrade = category && category.name !== "Sold" && category.name !== "Broken";
  const canDowngrade = category && category.name !== "Thrown" && category.name !== "Broken";
  const isBroken = category && category.name === "Broken";

  const handleUpgrade = async () => {
    if (!category) return;
    const nextCategory = categories.find(c => c.id === category.id + 1);
    if (nextCategory) {
      await updatePotCategory(pot.id, nextCategory.id);
      await loadPot();
    }
  };

  const handleDowngrade = async () => {
    if (!category) return;
    const prevCategory = categories.find(c => c.id === category.id - 1);
    if (prevCategory) {
      await updatePotCategory(pot.id, prevCategory.id);
      await loadPot();
    }
  };

  const handleMarkBroken = async () => {
    const brokenCategory = categories.find(c => c.name === "Broken");
    if (brokenCategory) {
      await updatePotCategory(pot.id, brokenCategory.id);
      await loadPot();
    }
  };

  const handleUndoBroken = async () => {
    const thrownCategory = categories.find(c => c.name === "Thrown");
    if (thrownCategory) {
      await updatePotCategory(pot.id, thrownCategory.id);
      await loadPot();
    }
  };

  const handleAttachPhoto = async () => {
    // Placeholder logic for file selection or camera
    const newPhoto = prompt("Enter photo URL or path:");
    if (newPhoto) {
      await addPhotoToPot(pot.id, newPhoto);
      await loadPot();
    }
  };

  return (
    <div>
      <Header title={pot.title} />

      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">
          {category ? `Stage: ${category.icon} ${category.name}` : ""}
        </h1>

        <div className="mb-4">
          <img
            src={currentPhoto}
            alt={pot.title}
            className="w-full max-h-[400px] object-cover rounded-lg"
          />
        </div>

        <div className="flex justify-between mb-4 space-x-2">
          <div className="flex space-x-2">
            {isBroken && (
                <button
                    onClick={handleUndoBroken}
                    className="bg-yellow-400 text-white px-4 py-2 rounded flex items-center space-x-1"
                >
                    <span>↩️</span>
                    <span>Undo Discard</span>
                </button>
            )}
            {!isBroken && canDowngrade && prevCategory && (
                <button
                    onClick={handleDowngrade}
                    className="bg-blue-400 text-white px-4 py-2 rounded flex items-center space-x-1"
                >
                    <span>↓</span>
                    <span>{prevCategory.name}</span>
                </button>
            )}
            {!isBroken && canDowngrade && (
                <button
                    onClick={handleMarkBroken}
                    className="bg-purple-500 text-white px-4 py-2 rounded flex items-center space-x-1"
                >
                    <span>💔</span>
                    <span>Broken</span>
                </button>
            )}
          </div>

          <div className="flex space-x-2">
            {!isBroken && canUpgrade && (
                <button
                    onClick={handleAttachPhoto}
                    className="bg-green-500 text-white px-4 py-2 rounded flex items-center space-x-1"
                >
                    <span>📸</span>
                    <span>Add Photo</span>
                </button>
            )}
            {!isBroken && canUpgrade && nextCategory && (
                <button
                onClick={handleUpgrade}
                className="bg-purple-500 text-white px-4 py-2 rounded flex items-center space-x-1"
                >
                <span>↑</span>
                <span>{nextCategory.name}</span>
                </button>
            )}
          </div>
        </div>

        {pot.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {pot.photos.map((photo, index) => (
              <img
                key={index}
                src={photo.photo}
                alt={`${pot.title} - ${index + 1}`}
                className={`w-full h-24 object-cover rounded cursor-pointer border-2 ${
                  index === mainPhotoIndex ? "border-red-500" : "border-transparent"
                }`}
                onClick={() => setMainPhotoIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
