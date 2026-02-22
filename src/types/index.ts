// Core Types
export interface Driver {
  id: string;
  name: string;
  driverNumber: number;
  team: string;
  nationality: string;
  price: number;
  basePrice: number;
  change: number;
  changePercent: number;
  points: number;
  rank: number;
  wins: number;
  podiums: number;
  teamColor: string;
  helmetImg: string;
  photo: string;
  risk: 'low' | 'medium' | 'high';
  history: PriceHistory[];
  attributes: DriverAttributes;
  marketCap: number;
  volume24h: number;
  rsi: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell';
  recentTrades: Trade[];
  liveData?: LiveDriverData;
}

export interface DriverAttributes {
  speed: number;
  experience: number;
  aggression: number;
  consistency: number;
  fanbase: number;
}

export interface PriceHistory {
  timestamp: number;
  value: number;
}

export interface LiveDriverData {
  position: number;
  status: 'racing' | 'pit' | 'dnf' | 'finished';
  lap: number;
  totalLaps: number;
  gapToLeader: string;
  interval: string;
  lastLapTime: string;
  bestLapTime: string;
  sector1Time?: string;
  sector2Time?: string;
  sector3Time?: string;
  tyreCompound?: string;
  tyreAge?: number;
  pitstops?: number;
}

export interface User {
  uid: string;
  username: string;
  email: string;
  balance: number;
  portfolio: PortfolioItem[];
  netWorth: number;
  totalReturn: number;
  totalReturnPercent: number;
  referralCode: string;
  redeemedReferrals: string[];
  netWorthHistory: NetWorthHistory[];
  hasCompletedTutorial: boolean;
  createdAt: number;
  rank?: number;
}

export interface PortfolioItem {
  driverId: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  purchaseDate: number;
}

export interface NetWorthHistory {
  timestamp: number;
  value: number;
}

export interface Trade {
  id: string;
  userId: string;
  username: string;
  driverId: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  timestamp: number;
}

export interface Race {
  round: number;
  raceName: string;
  circuit: Circuit;
  date: string;
  time: string;
  isLive?: boolean;
  completed?: boolean;
  results?: RaceResult[];
  sessionKey?: number;
  laps?: number;
  weather?: string;
  climate?: string;
  lastWinner?: string;
  lastWinnerYear?: number;
  tireTypes?: string[];
  conditions?: string;
}

export interface Circuit {
  circuitId: string;
  circuitName: string;
  location: string;
  country: string;
  lat: string;
  long: string;
}

export interface RaceResult {
  position: number;
  driverId: string;
  driverNumber: number;
  points: number;
  laps: number;
  time?: string;
  status: string;
}

export interface StandingsEntry {
  position: number;
  driverId: string;
  driverNumber: number;
  points: number;
  wins: number;
}

export interface MarketState {
  vix: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  activeConnections: number;
  globalVolume: number;
  topMovers: {
    gainers: string[];
    losers: string[];
  };
}

export interface NewsItem {
  id: string;
  headline: string;
  content: string;
  timestamp: number;
  type: 'positive' | 'negative' | 'neutral';
  driverId?: string;
  impactMultiplier?: number;
  source?: string;
}

export interface Leaderboard {
  rank: number;
  userId: string;
  username: string;
  netWorth: number;
  change: number;
  changePercent: number;
  avatar?: string;
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
export type ViewState = 'landing' | 'login' | 'signup' | 'dashboard' | 'market' | 'portfolio' | 'live' | 'schedule' | 'leaderboard' | 'analytics' | 'games';

// OpenF1 API Types
export interface OpenF1Session {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url?: string;
  country_code: string;
}

export interface OpenF1Position {
  date: string;
  driver_number: number;
  position: number;
  session_key: number;
}

export interface OpenF1Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number;
  duration_sector_2: number;
  duration_sector_3: number;
  lap_duration: number;
  lap_number: number;
  is_pit_out_lap: boolean;
  session_key: number;
}
