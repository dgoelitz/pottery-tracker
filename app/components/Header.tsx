"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useState } from "react";
import { updatePotTitle } from "../lib/db";

type HeaderProps = {
  title: string;
  potId?: number;
  showHome?: boolean;
};

export default function Header({ title, potId, showHome = true }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);

  const handleBlurOrEnter = async () => {
    const trimmedTitle = currentTitle.trim() || title;
    setIsEditing(false);
    setCurrentTitle(trimmedTitle);

    if (potId && trimmedTitle !== title) {
      try {
        await updatePotTitle(potId, trimmedTitle);
      } catch (error) {
        console.error("Title update failed:", error);
        setCurrentTitle(title);
      }
    }
  };

  return (
    <header className="bg-gray-400 shadow-md sm:border-b sm:border-stone-200 sm:bg-stone-50 sm:shadow-sm">
      <div className="flex items-center gap-1 p-4 sm:mx-auto sm:max-w-6xl sm:gap-2 sm:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="grid h-9 w-9 place-items-center rounded-full text-gray-700 transition hover:bg-black/5"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => router.forward()}
          aria-label="Go forward"
          className="grid h-9 w-9 place-items-center rounded-full text-gray-700 transition hover:bg-black/5"
        >
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        </button>

        {showHome && pathname !== "/" && (
          <Link
            href="/"
            className="mr-2 grid h-9 w-9 place-items-center rounded-full text-gray-700 transition hover:bg-black/5 hover:text-black"
            aria-label="Home"
          >
            <Home className="h-6 w-6" aria-hidden="true" />
          </Link>
        )}

        {potId ? (
          isEditing ? (
            <input
              autoFocus
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              onBlur={handleBlurOrEnter}
              onKeyDown={(e) => e.key === "Enter" && handleBlurOrEnter()}
              className="min-w-0 flex-1 border-b border-gray-700 bg-transparent text-lg font-bold text-gray-700 focus:outline-none sm:text-xl"
            />
          ) : (
            <h1
              className="min-w-0 flex-1 cursor-text truncate text-lg font-bold text-gray-700 sm:text-xl"
              onClick={() => {
                setCurrentTitle(title);
                setIsEditing(true);
              }}
            >
              {currentTitle}
            </h1>
          )
        ) : (
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-gray-700 sm:text-xl">{title}</h1>
        )}
      </div>
    </header>
  );
}
