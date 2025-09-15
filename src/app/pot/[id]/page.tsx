"use client";

import { useEffect, useState, use } from "react";
import { Pot, getPotById, updatePotCategory, addPhotoToPot } from "../../lib/db";
import { categories } from "../../data/categories";
import Header from "../../components/Header";

export default function PotDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const potId = Number(unwrappedParams.id);

    const [pot, setPot] = useState<Pot | null>(null);
    const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(0);
    const [photoURLs, setPhotoURLs] = useState<string[]>([]);

    async function loadPot() {
        const found = await getPotById(potId);
        if (!found) {
            setPot(null);
            setPhotoURLs([]);
            return;
        }

        setPot(found);
        setMainPhotoIndex(found.photos.length > 0 ? found.photos.length - 1 : 0);

        photoURLs.forEach(url => URL.revokeObjectURL(url));

        const urls = found.photos.map(p => URL.createObjectURL(new Blob([p.photo])));

        setPhotoURLs(urls);
    }

    useEffect(() => {
        loadPot();
        return () => {
            photoURLs.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    if (!pot) return <p className="p-4">Pot not found</p>;

    const category = categories.find(c => c.id === pot.categoryId);
    const nextCategory = category ? categories.find(c => c.id === category.id + 1) : null;
    const prevCategory = category ? categories.find(c => c.id === category.id - 1) : null;

    const canUpgrade = category && category.name !== "Sold" && category.name !== "Broken";
    const canDowngrade = category && category.name !== "Thrown" && category.name !== "Broken";
    const isBroken = category && category.name === "Broken";

    const handleUpgrade = async () => {
        if (!category || !nextCategory || !pot) return;

        await updatePotCategory(pot.id, nextCategory.id);
        setPot(prev => prev ? { ...prev, categoryId: nextCategory.id } : prev);
    };

    const handleDowngrade = async () => {
        if (!category || !prevCategory || !pot) return;

        await updatePotCategory(pot.id, prevCategory.id);
        setPot(prev => prev ? { ...prev, categoryId: prevCategory.id } : prev);
    };

    const handleMarkBroken = async () => {
        const brokenCat = categories.find(c => c.name === "Broken");
        if (!brokenCat || !pot) return;

        await updatePotCategory(pot.id, brokenCat.id);
        setPot(prev => prev ? { ...prev, categoryId: brokenCat.id } : prev);
    };

    const handleUndoBroken = async () => {
        const thrownCat = categories.find(c => c.name === "Thrown");
        if (!thrownCat || !pot) return;

        await updatePotCategory(pot.id, thrownCat.id);
        setPot(prev => prev ? { ...prev, categoryId: thrownCat.id } : prev);
    };

    const handleAttachPhoto = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const buffer = await file.arrayBuffer();
                const blob = new Blob([buffer], { type: file.type });
                await addPhotoToPot(pot.id, blob);
                await loadPot();
            }
        };
        input.click();
    };

    const currentPhotoURL =
        photoURLs.length > 0 ? photoURLs[mainPhotoIndex] : "/placeholder.jpg";

    return (
        <div>
            <Header title={pot.title} />

            <div className="p-4">
                <h1 className="text-2xl font-bold mb-2">
                    {category ? `Stage: ${category.icon} ${category.name}` : ""}
                </h1>

                <div className="mb-4 w-full h-64 border rounded-lg flex items-center justify-center">
                    <img
                        src={currentPhotoURL}
                        alt={pot.title}
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                </div>

                <div className="flex justify-between mb-4 gap-2">
                    <div className="flex gap-2 w-1/2">
                        {isBroken && (
                            <button
                                onClick={handleUndoBroken}
                                className="w-1/2 h-20 bg-yellow-400 text-white px-4 py-2 rounded text-sm items-center"
                            >
                                <span>↩️</span>
                                <span>Undo Discard</span>
                            </button>
                        )}
                        {!isBroken && canDowngrade && prevCategory && (
                            <button
                                onClick={handleDowngrade}
                                className="w-1/2 h-20 bg-blue-400 text-white px-4 py-2 rounded text-sm items-center"
                            >
                                <span>↓</span><br />
                                <span>{prevCategory.name}</span>
                            </button>
                        )}
                        {!isBroken && (
                            <button
                                onClick={handleMarkBroken}
                                className="w-1/2 h-20 bg-purple-500 text-white px-4 py-2 rounded text-sm items-center"
                            >
                                <span>💔</span>
                                <span>Broken</span>
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 w-1/2">
                        {!isBroken && canUpgrade && (
                            <button
                                onClick={handleAttachPhoto}
                                className="w-1/2 h-20 bg-green-500 text-white px-4 py-2 rounded text-sm items-center"
                            >
                                <span>📸</span>
                                <span>Add Photo</span>
                            </button>
                        )}
                        {!isBroken && canUpgrade && nextCategory && (
                            <button
                                onClick={handleUpgrade}
                                className="w-1/2 h-20 bg-purple-500 text-white px-4 py-2 rounded text-sm items-center"
                            >
                                <span>↑</span><br />
                                <span>{nextCategory.name}</span>
                            </button>
                        )}
                    </div>
                </div>

                {photoURLs.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {photoURLs.map((url, index) => (
                            <div
                                key={index}
                                className={`w-full h-24 border-2 rounded cursor-pointer overflow-hidden flex items-center justify-center ${index === mainPhotoIndex ? "border-red-500" : "border-transparent"
                                    }`}
                                onClick={() => setMainPhotoIndex(index)}
                            >
                                <img
                                    src={url}
                                    alt={`${pot.title} - ${index + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
