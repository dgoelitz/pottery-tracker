"use client";

import { use, useCallback, useEffect, useState } from "react";
import Header from "../../components/Header";
import PotActionButtons from "../../components/PotActionButtons";
import { categories } from "../../data/categories";
import { Pot, getCachedPotById, getPotById, getPotByIdWithPhotos } from "../../lib/db";

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

  const [pot, setPot] = useState<Pot | null>(() => getCachedPotById(potId) || null);
  const [isLoading, setIsLoading] = useState(!pot);
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(0);

  const loadPot = useCallback(async () => {
    setIsLoading(true);
    const found = await getPotById(potId);
    if (!found) {
      setPot(null);
      setIsLoading(false);
      return;
    }

    setPot(found);
    setMainPhotoIndex(found.photos.length > 0 ? found.photos.length - 1 : 0);
    setIsLoading(false);
  }, [potId]);

  useEffect(() => {
    let isMounted = true;

    void getPotByIdWithPhotos(potId, "latest").then((found) => {
      if (!isMounted) return;

      if (!found) {
        setPot(null);
        setIsLoading(false);
        return;
      }

      setPot(found);
      setMainPhotoIndex(found.photos.length > 0 ? found.photos.length - 1 : 0);
      setIsLoading(false);

      void getPotByIdWithPhotos(potId, "all").then((fullPot) => {
        if (!isMounted || !fullPot) return;
        setPot(fullPot);
        setMainPhotoIndex(fullPot.photos.length > 0 ? fullPot.photos.length - 1 : 0);
      });
    }).catch((error) => {
      console.error("Could not load pot.", error);
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [potId]);

  if (!pot && isLoading) return <p className="p-4">Loading pot...</p>;
  if (!pot) return <p className="p-4">Pot not found</p>;

  const category = categories.find((candidate) => candidate.id === pot.categoryId);
  const photoURLs = pot.photos.map((photo) => photo.photoDataUrl);
  const currentPhotoURL = photoURLs.length > 0 ? photoURLs[mainPhotoIndex] : pot.thumbnailDataUrl || "/placeholder.jpg";

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
              {/* eslint-disable-next-line @next/next/no-img-element -- Data URL images do not benefit from Next image optimization. */}
              <img
                src={currentPhotoURL}
                alt={pot.title}
                className="h-full w-full rounded-lg object-contain"
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
                    {/* eslint-disable-next-line @next/next/no-img-element -- Data URL images do not benefit from Next image optimization. */}
                    <img
                      src={url}
                      alt={`${pot.title} - ${index + 1}`}
                      className="h-full w-full object-contain"
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
