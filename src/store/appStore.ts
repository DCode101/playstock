import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Driver, User, MarketState, Race } from '../types';

// Define the RaceState interface for Firebase sync
interface RaceState {
  isOngoing: boolean;
  currentLap: number;
  positions: any[];
  results: any[];
  lastUpdated: number;
  nextRaceTime: number;
  seasonStart: number;
  seasonEnd: number;
}

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  updateBalance: (balance: number) => void;

  // Drivers state
  drivers: Driver[];
  setDrivers: (drivers: Driver[]) => void;
  updateDriverPrice: (driverId: string, price: number, change: number) => void;

  // Market state
  marketState: MarketState;
  setMarketState: (state: MarketState) => void;

  // Schedule state
  races: Race[];
  setRaces: (races: Race[]) => void;

  // Race state for persistence (legacy - will be synced with Firebase)
  isRaceOngoing: boolean;
  setIsRaceOngoing: (ongoing: boolean) => void;
  currentLap: number;
  setCurrentLap: (lap: number) => void;
  racePositions: any[];
  setRacePositions: (positions: any[]) => void;
  raceResults: any[];
  setRaceResults: (results: any[]) => void;

  // NEW: Firebase-synced race state
  raceState: RaceState;
  setRaceState: (state: Partial<RaceState>) => void;

  // UI state
  currentView: string;
  setCurrentView: (view: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Tutorial
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
}

// Initial race state
const initialRaceState: RaceState = {
  isOngoing: false,
  currentLap: 0,
  positions: [],
  results: [],
  lastUpdated: Date.now(),
  nextRaceTime: new Date('2026-02-18T20:00:00+05:30').getTime(), // First race: Feb 18, 2026 8PM IST
  seasonStart: new Date('2026-02-18T00:00:00+05:30').getTime(),
  seasonEnd: new Date('2026-02-28T23:59:59+05:30').getTime()
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      drivers: [],
      marketState: {
        vix: 45,
        sentiment: 'bullish',
        activeConnections: 0,
        globalVolume: 0,
        topMovers: {
          gainers: [],
          losers: [],
        },
      },
      races: [],
      
      // Legacy race state (kept for backward compatibility)
      isRaceOngoing: false,
      currentLap: 1,
      racePositions: [],
      raceResults: [],
      
      // NEW: Firebase-synced race state
      raceState: initialRaceState,
      
      currentView: 'landing',
      isLoading: false,
      showTutorial: false,

      // Actions
      setUser: (user) => set({ user }),

      updateBalance: (amount) =>
        set((state) => ({
          user: state.user ? { ...state.user, balance: state.user.balance + amount } : null,
        })),

      setDrivers: (drivers) => set({ drivers }),

      updateDriverPrice: (driverId, price, change) =>
        set((state) => ({
          drivers: state.drivers.map((driver) =>
            driver.id === driverId
              ? {
                  ...driver,
                  price: Math.round(price),
                  change: Math.round(change * 100) / 100,
                  changePercent: driver.basePrice > 0 ? (change / driver.basePrice) * 100 : 0,
                }
              : driver
          ),
        })),

      setMarketState: (marketState) => set({ marketState }),

      setRaces: (races) => set({ races }),

      // Legacy race actions - now also update the raceState
      setIsRaceOngoing: (ongoing) => 
        set((state) => ({ 
          isRaceOngoing: ongoing,
          raceState: { ...state.raceState, isOngoing: ongoing }
        })),

      setCurrentLap: (lap) => 
        set((state) => ({ 
          currentLap: lap,
          raceState: { ...state.raceState, currentLap: lap }
        })),

      setRacePositions: (positions) => 
        set((state) => ({ 
          racePositions: positions,
          raceState: { ...state.raceState, positions }
        })),

      setRaceResults: (results) => 
        set((state) => ({ 
          raceResults: results,
          raceState: { ...state.raceState, results }
        })),

      // NEW: Set race state (partial update)
      setRaceState: (newState) =>
        set((state) => ({
          raceState: { ...state.raceState, ...newState },
          // Also update legacy fields for backward compatibility
          isRaceOngoing: newState.isOngoing !== undefined ? newState.isOngoing : state.isRaceOngoing,
          currentLap: newState.currentLap !== undefined ? newState.currentLap : state.currentLap,
          racePositions: newState.positions !== undefined ? newState.positions : state.racePositions,
          raceResults: newState.results !== undefined ? newState.results : state.raceResults,
        })),

      setCurrentView: (currentView) => set({ currentView }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setShowTutorial: (showTutorial) => set({ showTutorial }),
    }),
    {
      name: 'f1-playstock-storage',
      partialize: (state) => ({
        showTutorial: state.showTutorial,
        // Don't persist race state as it comes from Firebase
        user: state.user, // Keep user persisted
      }),
    }
  )
);