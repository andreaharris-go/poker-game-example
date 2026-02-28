export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface GameState {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  playerScore: number;
  dealerScore: number;
  status: "idle" | "playing" | "player-wins" | "dealer-wins" | "tie";
  pot: number;
  playerChips: number;
  currentBet: number;
}

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function cardValue(rank: Rank): number {
  if (["J", "Q", "K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank, 10);
}

export function handTotal(hand: Card[]): number {
  let total = hand.reduce((sum, card) => sum + cardValue(card.rank), 0);
  let aces = hand.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isRed(suit: Suit): boolean {
  return suit === "♥" || suit === "♦";
}

export function initialGameState(): GameState {
  return {
    deck: [],
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    status: "idle",
    pot: 0,
    playerChips: 1000,
    currentBet: 0,
  };
}

export function dealInitialHands(state: GameState, bet: number): GameState {
  const deck = shuffleDeck(createDeck());
  const playerHand = [deck[0], deck[2]];
  const dealerHand = [deck[1], deck[3]];
  const remainingDeck = deck.slice(4);

  const playerScore = handTotal(playerHand);
  const dealerScore = handTotal(dealerHand);

  let status: GameState["status"] = "playing";
  if (playerScore === 21) {
    status = "player-wins";
  }

  return {
    ...state,
    deck: remainingDeck,
    playerHand,
    dealerHand,
    playerScore,
    dealerScore,
    status,
    pot: bet * 2,
    playerChips: state.playerChips - bet,
    currentBet: bet,
  };
}

export function playerHit(state: GameState): GameState {
  const [card, ...remainingDeck] = state.deck;
  const playerHand = [...state.playerHand, card];
  const playerScore = handTotal(playerHand);
  const status: GameState["status"] =
    playerScore > 21 ? "dealer-wins" : "playing";
  return { ...state, deck: remainingDeck, playerHand, playerScore, status };
}

export function dealerPlay(state: GameState): GameState {
  let { deck, dealerHand } = state;
  let dealerScore = handTotal(dealerHand);

  while (dealerScore < 17) {
    const [card, ...rest] = deck;
    dealerHand = [...dealerHand, card];
    deck = rest;
    dealerScore = handTotal(dealerHand);
  }

  const playerScore = state.playerScore;
  let status: GameState["status"];
  if (dealerScore > 21 || playerScore > dealerScore) {
    status = "player-wins";
  } else if (dealerScore > playerScore) {
    status = "dealer-wins";
  } else {
    status = "tie";
  }

  return { ...state, deck, dealerHand, dealerScore, status };
}

export function collectWinnings(state: GameState): GameState {
  let playerChips = state.playerChips;
  if (state.status === "player-wins") {
    playerChips += state.pot;
  } else if (state.status === "tie") {
    playerChips += state.pot / 2;
  }
  return { ...state, playerChips, pot: 0, currentBet: 0 };
}
