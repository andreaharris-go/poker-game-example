"use client";

import { useState } from "react";
import PlayingCard from "@/components/PlayingCard";
import {
  GameState,
  initialGameState,
  dealInitialHands,
  playerHit,
  dealerPlay,
  collectWinnings,
} from "@/lib/poker";

const BET_OPTIONS = [10, 25, 50, 100, 200];

export default function PokerGame() {
  const [game, setGame] = useState<GameState>(initialGameState());
  const [bet, setBet] = useState(25);

  function handleDeal() {
    if (bet <= 0 || bet > game.playerChips) return;
    setGame((prev) => dealInitialHands(prev, bet));
  }

  function handleHit() {
    setGame((prev) => playerHit(prev));
  }

  function handleStand() {
    setGame((prev) => dealerPlay(prev));
  }

  function handleNewRound() {
    setGame((prev) => {
      const settled = collectWinnings(prev);
      return { ...settled, status: "idle", playerHand: [], dealerHand: [], deck: [] };
    });
  }

  const isPlaying = game.status === "playing";
  const isOver =
    game.status === "player-wins" ||
    game.status === "dealer-wins" ||
    game.status === "tie";

  const statusMessage: Record<string, string> = {
    "player-wins": "🎉 You win!",
    "dealer-wins": "😔 Dealer wins!",
    tie: "🤝 It's a tie!",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 flex flex-col items-center justify-center p-6 gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-yellow-400 drop-shadow-lg tracking-wide">
          ♠ Blackjack ♥
        </h1>
        <p className="text-green-300 text-sm mt-1">
          Next.js 16 &middot; TypeScript &middot; Tailwind CSS v4
        </p>
      </div>

      {/* Chips display */}
      <div className="flex gap-6 text-white text-lg font-semibold">
        <span>
          💰 Chips:{" "}
          <span className="text-yellow-300">${game.playerChips}</span>
        </span>
        {game.pot > 0 && (
          <span>
            🎰 Pot: <span className="text-yellow-300">${game.pot}</span>
          </span>
        )}
      </div>

      {/* Table */}
      <div className="w-full max-w-2xl bg-green-700/60 rounded-3xl border-4 border-yellow-600/50 shadow-2xl p-6 flex flex-col gap-6">
        {/* Dealer hand */}
        <div>
          <p className="text-green-300 text-sm font-medium mb-2 uppercase tracking-wider">
            Dealer{game.dealerHand.length > 0 ? ` — ${isPlaying ? "?" : game.dealerScore}` : ""}
          </p>
          <div className="flex gap-2 min-h-[6rem] items-center flex-wrap">
            {game.dealerHand.map((card, i) => (
              <PlayingCard
                key={`dealer-${i}`}
                card={card}
                faceDown={isPlaying && i === 1}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-green-600/50" />

        {/* Player hand */}
        <div>
          <p className="text-green-300 text-sm font-medium mb-2 uppercase tracking-wider">
            You{game.playerHand.length > 0 ? ` — ${game.playerScore}` : ""}
          </p>
          <div className="flex gap-2 min-h-[6rem] items-center flex-wrap">
            {game.playerHand.map((card, i) => (
              <PlayingCard key={`player-${i}`} card={card} />
            ))}
          </div>
        </div>
      </div>

      {/* Status message */}
      {isOver && (
        <div className="text-3xl font-bold text-yellow-300 drop-shadow animate-bounce">
          {statusMessage[game.status]}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        {game.status === "idle" && (
          <>
            <div className="flex gap-2 items-center flex-wrap justify-center">
              <span className="text-green-300 font-medium">Bet:</span>
              {BET_OPTIONS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBet(amount)}
                  disabled={amount > game.playerChips}
                  className={`px-4 py-2 rounded-full font-bold text-sm transition-all cursor-pointer ${
                    bet === amount
                      ? "bg-yellow-400 text-gray-900 scale-110 shadow-lg"
                      : "bg-green-600 text-white hover:bg-green-500"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <button
              onClick={handleDeal}
              disabled={bet > game.playerChips}
              className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-lg rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Deal
            </button>
          </>
        )}

        {isPlaying && (
          <div className="flex gap-4">
            <button
              onClick={handleHit}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-lg rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Hit
            </button>
            <button
              onClick={handleStand}
              className="px-8 py-3 bg-red-500 hover:bg-red-400 text-white font-bold text-lg rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Stand
            </button>
          </div>
        )}

        {isOver && (
          <button
            onClick={handleNewRound}
            className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-lg rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {game.playerChips <= 0 ? "Restart Game" : "New Round"}
          </button>
        )}

        {game.playerChips <= 0 && game.status === "idle" && (
          <button
            onClick={() => setGame(initialGameState())}
            className="px-8 py-3 bg-red-500 hover:bg-red-400 text-white font-bold text-lg rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            🔄 Restart Game
          </button>
        )}
      </div>

      {/* Footer */}
      <p className="text-green-500 text-xs">
        Built with Next.js 16 · TypeScript · App Router · Tailwind CSS v4
      </p>
    </div>
  );
}
