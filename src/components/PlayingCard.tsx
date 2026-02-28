"use client";

import { Card, isRed } from "@/lib/poker";

interface CardProps {
  card: Card;
  faceDown?: boolean;
}

export default function PlayingCard({ card, faceDown = false }: CardProps) {
  if (faceDown) {
    return (
      <div className="w-16 h-24 rounded-xl border-2 border-white/30 bg-gradient-to-br from-blue-800 to-blue-950 shadow-lg flex items-center justify-center">
        <div className="w-12 h-20 rounded-lg border border-white/20 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_8px)]" />
      </div>
    );
  }

  const red = isRed(card.suit);
  return (
    <div
      className={`w-16 h-24 rounded-xl border-2 ${
        red ? "border-red-200" : "border-gray-200"
      } bg-white shadow-lg flex flex-col justify-between p-1.5 select-none`}
    >
      <div className={`text-sm font-bold leading-none ${red ? "text-red-600" : "text-gray-900"}`}>
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
      <div
        className={`text-2xl text-center leading-none ${red ? "text-red-600" : "text-gray-900"}`}
      >
        {card.suit}
      </div>
      <div
        className={`text-sm font-bold leading-none text-right rotate-180 ${red ? "text-red-600" : "text-gray-900"}`}
      >
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
    </div>
  );
}
