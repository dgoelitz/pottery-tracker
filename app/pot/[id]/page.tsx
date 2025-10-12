"use client";

import Image from "next/image";
import { use, useCallback, useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import PotActionButtons from "../../components/PotActionButtons";
import { categories } from "../../data/categories";
import { Pot, getPotById } from "../../lib/db";

export default function PotDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const potId = Number(unwrappedParams.id);

    const [pot, setPot] = useState<Pot | null>(null);
    const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(0);
    const [photoURLs, setPhotoURLs] = useState<string[]>([]);

    const photoURLsRef = useRef<string[]>([]);

const loadPot = useCallback(async () => {
    const found = await getPotById(potId);
    if (!found) {
        setPot(null);
        setPhotoURLs([]);
        return;
    }

    photoURLsRef.current.forEach(url => URL.revokeObjectURL(url));

    const urls = found.photos.map(p => URL.createObjectURL(p.photo));
    photoURLsRef.current = urls;

    setPot(found);
    setMainPhotoIndex(found.photos.length > 0 ? found.photos.length - 1 : 0);
    setPhotoURLs(urls);
}, [potId]);

useEffect(() => {
    loadPot();
    return () => {
        photoURLsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
}, [loadPot]);

    if (!pot) return <p className="p-4">Pot not found</p>;

    const category = categories.find(c => c.id === pot.categoryId);
    const currentPhotoURL =
        photoURLs.length > 0 ? photoURLs[mainPhotoIndex] : "/placeholder.jpg";

    return (
        <div>
            <Header title={pot.title} potId={potId} />

            <div className="p-4">
                <h1 className="text-2xl font-bold mb-2">
                    {category ? `Stage: ${category.icon} ${category.name}` : ""}
                </h1>

                <div className="mb-4 w-full h-64 border rounded-lg flex items-center justify-center relative">
                    <Image
                        src={currentPhotoURL}
                        alt={pot.title}
                        fill
                        style={{ objectFit: "contain" }}
                        className="rounded-lg"
                        unoptimized
                        priority
                    />
                </div>

                <PotActionButtons pot={pot} setPot={setPot} reloadPot={loadPot} />

                {photoURLs.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {photoURLs.map((url, index) => (
                            <div
                                key={index}
                                className={`w-full h-24 border-2 rounded cursor-pointer overflow-hidden relative flex items-center justify-center ${index === mainPhotoIndex ? "border-red-500" : "border-transparent"
                                    }`}
                                onClick={() => setMainPhotoIndex(index)}
                            >
                                <Image
                                    src={url}
                                    alt={`${pot.title} - ${index + 1}`}
                                    fill
                                    style={{ objectFit: "contain" }}
                                    unoptimized
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
