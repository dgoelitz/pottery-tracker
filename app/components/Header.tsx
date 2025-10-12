"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { useState } from "react";
import { updatePotTitle } from "../lib/db";

type HeaderProps = {
  title: string;
  potId?: number;
  showHome?: boolean;
};

export default function Header({ title, potId, showHome = true }: HeaderProps) {
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);

  const handleBlurOrEnter = async () => {
    setIsEditing(false);
    if (potId && currentTitle !== title) {
      await updatePotTitle(potId, currentTitle);
    }
  };

  return (
    <header className="flex items-center p-4 bg-gray-400 shadow-md">
      {showHome && pathname !== "/" && (
        <Link href="/" className="mr-3 text-gray-700 hover:text-black">
          <Home className="w-6 h-6" />
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
            className="text-lg font-bold text-gray-700 border-b border-gray-700 focus:outline-none"
          />
        ) : (
          <h1
            className="text-lg text-gray-700 font-bold cursor-text"
            onClick={() => setIsEditing(true)}
          >
            {currentTitle}
          </h1>
        )
      ) : (
        <h1 className="text-lg text-gray-700 font-bold">{title}</h1>
      )}
    </header>
  );
}
