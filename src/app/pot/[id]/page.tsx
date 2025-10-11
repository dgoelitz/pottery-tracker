"use client";

import { useEffect, useState, use } from "react";
import { Pot, getPotById } from "../../lib/db";
import { categories } from "../../data/categories";
import PotActionButtons from "../../components/PotActionButtons";
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

        const urls = found.photos.map(p => URL.createObjectURL(p.photo));

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

                <PotActionButtons pot={pot} setPot={setPot} reloadPot={loadPot} />

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
