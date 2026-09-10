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
}

export interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  difficulty: number;
  date: string;
  predictedScore: string;
  predictionComment: string;
}

export interface AITacticsResponse {
  captainPicks: { name: string; reasoning: string }[];
  transfersIn: { name: string; reasoning: string }[];
  transfersOut: { name: string; reasoning: string }[];
  oddsInsights: string;
}
