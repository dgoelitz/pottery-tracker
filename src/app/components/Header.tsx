"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

type HeaderProps = {
  title: string;
  showHome?: boolean;
};

export default function Header({ title, showHome = true }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="flex items-center p-4 bg-gray-400 shadow-md">
      {showHome && pathname !== "/" && (
        <Link href="/" className="mr-3 text-gray-700 hover:text-black">
          <Home className="w-6 h-6" />
        </Link>
      )}
      <h1 className="text-lg text-gray-700 font-bold">{title}</h1>
    </header>
  );
}
