"use client";

import Image from "next/image";
import { use, useCallback, useEffect, useState } from "react";
import Header from "../../components/Header";
import PotActionButtons from "../../components/PotActionButtons";
import { categories } from "../../data/categories";
import { Pot, getPotById } from "../../lib/db";

export default function PotDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);
  const potId = Number(unwrappedParams.id);
  const returnPath = sanitizeReturnPath(unwrappedSearchParams.returnTo);

  const [pot, setPot] = useState<Pot | null>(null);
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(0);

  const loadPot = useCallback(async () => {
    const found = await getPotById(potId);
    if (!found) {
      setPot(null);
      return;
    }

    setPot(found);
    setMainPhotoIndex(found.photos.length > 0 ? found.photos.length - 1 : 0);
  }, [potId]);

  useEffect(() => {
    let isMounted = true;

    void getPotById(potId).then((found) => {
      if (!isMounted) return;

      if (!found) {
        setPot(null);
        return;
      }

      setPot(found);
      setMainPhotoIndex(found.photos.length > 0 ? found.photos.length - 1 : 0);
    });

    return () => {
      isMounted = false;
    };
  }, [potId]);

  if (!pot) return <p className="p-4">Pot not found</p>;

  const category = categories.find((candidate) => candidate.id === pot.categoryId);
  const photoURLs = pot.photos.map((photo) => photo.photoDataUrl);
  const currentPhotoURL = photoURLs.length > 0 ? photoURLs[mainPhotoIndex] : "/placeholder.jpg";

  return (
    <div>
      <Header key={pot.id} title={pot.title} potId={potId} />

      <main className="p-4 sm:mx-auto sm:max-w-6xl sm:px-8 sm:py-6">
        <h1 className="mb-2 text-2xl font-bold text-stone-900 sm:mb-4">
          {category ? `Stage: ${category.icon} ${category.name}` : ""}
        </h1>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
          <div>
            <div className="relative mb-4 flex h-64 w-full items-center justify-center rounded-lg border bg-white sm:h-[28rem]">
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

            {photoURLs.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photoURLs.map((url, index) => (
                  <button
                    type="button"
                    key={`${pot.id}-${index}`}
                    className={`relative flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded border-2 bg-white sm:h-28 ${
                      index === mainPhotoIndex ? "border-red-500" : "border-transparent"
                    }`}
                    onClick={() => setMainPhotoIndex(index)}
                    aria-label={`Show photo ${index + 1}`}
                  >
                    <Image
                      src={url}
                      alt={`${pot.title} - ${index + 1}`}
                      fill
                      style={{ objectFit: "contain" }}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="mt-4 lg:mt-0">
            <PotActionButtons pot={pot} setPot={setPot} reloadPot={loadPot} returnPath={returnPath} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function sanitizeReturnPath(returnTo: string | undefined) {
  if (!returnTo) return undefined;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return undefined;

  return returnTo;
}
