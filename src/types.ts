export interface Player {
  id: number;
  name: string;
  team: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  price: number;
  form: number;
  points: number;
  xG: number;
  xA: number;
  ictIndex: number;
  selectedByPercent: string;
  status: string;
  news: string;
  chanceOfPlaying: number | null;
  isInjured: boolean;
}

export interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  difficulty: number;
  date: string;
  kickoffTime?: string;
  predictedScore: string;
  predictionComment: string;
}

export interface AITacticsResponse {
  captainPicks: { name: string; reasoning: string }[];
  transfersIn: { name: string; reasoning: string }[];
  transfersOut: { name: string; reasoning: string }[];
  oddsInsights: string;
}

export interface MbahNews {
  id: string;
  title: string;
  source: string;
  sourceType: 'official' | 'transfer' | 'injury' | 'dressing_room';
  category: string;
  timeAgo: string;
  officialSummary: string;
  mbahCommentary: string;
  fplImpact: {
    affectedPlayers: string[];
    action: 'Beli Segera' | 'Lepas / Jual' | 'Waspada / Pantau' | 'Wajib Kapten';
    advice: string;
  };
}

export interface GuestbookEntry {
  id: string;
  name: string;
  type: 'cacian' | 'makian' | 'nasehat';
  message: string;
  timestamp: string;
  likes: number;
}
