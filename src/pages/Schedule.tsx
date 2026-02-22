import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Radio, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { INITIAL_DRIVERS } from '../services/dataService';
import { useAppStore } from '../store/appStore';
import ReactCountryFlag from 'react-country-flag';

// ---------- Types ----------
interface RaceResult {
  driverId: string;
  driverName: string;
  team: string;
  teamColor: string;
  photo?: string;
  position: number;
  points: number;
  timeGap: string;
  priceChange: number;
  finalPrice: number;
}

interface Race {
  id: string;
  round: number;
  raceName: string;
  circuit: {
    circuitId: string;
    circuitName: string;
    location: string;
    country: string;
    length: number;
  };
  date: string;
  scheduledTime: number;
  status: 'upcoming' | 'live' | 'completed';
  laps: number;
  results?: RaceResult[];
  winner?: string;
  lastUpdated: number;
}

// Predefined races (cleaned – removed duplicate Spanish GP)
const PREDEFINED_RACES: Race[] = [
  {
    id: 'race_1',
    round: 1,
    raceName: 'Bahrain Grand Prix',
    circuit: {
      circuitId: 'bahrain',
      circuitName: 'Bahrain International Circuit',
      location: 'Sakhir',
      country: 'Bahrain',
      length: 5.412
    },
    date: '2026-02-18T17:00:00+05:30',
    scheduledTime: new Date('2026-02-18T17:00:00+05:30').getTime(),
    status: 'completed',
    laps: 57,
    lastUpdated: Date.now()
  },
  {
    id: 'race_2',
    round: 2,
    raceName: 'Saudi Arabian Grand Prix',
    circuit: {
      circuitId: 'jeddah',
      circuitName: 'Jeddah Corniche Circuit',
      location: 'Jeddah',
      country: 'Saudi Arabia',
      length: 6.174
    },
    date: '2026-02-19T17:00:00+05:30',
    scheduledTime: new Date('2026-02-19T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 50,
    lastUpdated: Date.now()
  },
  {
    id: 'race_3',
    round: 3,
    raceName: 'Australian Grand Prix',
    circuit: {
      circuitId: 'albert_park',
      circuitName: 'Albert Park Circuit',
      location: 'Melbourne',
      country: 'Australia',
      length: 5.278
    },
    date: '2026-02-20T17:00:00+05:30',
    scheduledTime: new Date('2026-02-20T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 58,
    lastUpdated: Date.now()
  },
  {
    id: 'race_4',
    round: 4,
    raceName: 'Japanese Grand Prix',
    circuit: {
      circuitId: 'suzuka',
      circuitName: 'Suzuka International Racing Course',
      location: 'Suzuka',
      country: 'Japan',
      length: 5.807
    },
    date: '2026-02-21T17:00:00+05:30',
    scheduledTime: new Date('2026-02-21T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 53,
    lastUpdated: Date.now()
  },
  {
    id: 'race_5',
    round: 5,
    raceName: 'Chinese Grand Prix',
    circuit: {
      circuitId: 'shanghai',
      circuitName: 'Shanghai International Circuit',
      location: 'Shanghai',
      country: 'China',
      length: 5.451
    },
    date: '2026-02-22T17:00:00+05:30',
    scheduledTime: new Date('2026-02-22T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 56,
    lastUpdated: Date.now()
  },
  {
    id: 'race_6',
    round: 6,
    raceName: 'Miami Grand Prix',
    circuit: {
      circuitId: 'miami',
      circuitName: 'Miami International Autodrome',
      location: 'Miami',
      country: 'USA',
      length: 5.412
    },
    date: '2026-02-23T17:00:00+05:30',
    scheduledTime: new Date('2026-02-23T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 57,
    lastUpdated: Date.now()
  },
  {
    id: 'race_7',
    round: 7,
    raceName: 'Emilia Romagna Grand Prix',
    circuit: {
      circuitId: 'imola',
      circuitName: 'Autodromo Enzo e Dino Ferrari',
      location: 'Imola',
      country: 'Italy',
      length: 4.909
    },
    date: '2026-02-24T17:00:00+05:30',
    scheduledTime: new Date('2026-02-24T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 63,
    lastUpdated: Date.now()
  },
  {
    id: 'race_8',
    round: 8,
    raceName: 'Monaco Grand Prix',
    circuit: {
      circuitId: 'monaco',
      circuitName: 'Circuit de Monaco',
      location: 'Monte Carlo',
      country: 'Monaco',
      length: 3.337
    },
    date: '2026-02-25T17:00:00+05:30',
    scheduledTime: new Date('2026-02-25T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 78,
    lastUpdated: Date.now()
  },
  {
    id: 'race_9',
    round: 9,
    raceName: 'Canadian Grand Prix',
    circuit: {
      circuitId: 'villeneuve',
      circuitName: 'Circuit Gilles Villeneuve',
      location: 'Montreal',
      country: 'Canada',
      length: 4.361
    },
    date: '2026-02-26T17:00:00+05:30',
    scheduledTime: new Date('2026-02-26T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 70,
    lastUpdated: Date.now()
  },
  {
    id: 'race_10',
    round: 10,
    raceName: 'Spanish Grand Prix',
    circuit: {
      circuitId: 'catalunya',
      circuitName: 'Circuit de Barcelona-Catalunya',
      location: 'Montmeló',
      country: 'Spain',
      length: 4.675
    },
    date: '2026-02-27T17:00:00+05:30',
    scheduledTime: new Date('2026-02-27T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 66,
    lastUpdated: Date.now()
  },
  {
    id: 'race_11',
    round: 11,
    raceName: 'Austrian Grand Prix',
    circuit: {
      circuitId: 'red_bull_ring',
      circuitName: 'Red Bull Ring',
      location: 'Spielberg',
      country: 'Austria',
      length: 4.318
    },
    date: '2026-02-28T17:00:00+05:30',
    scheduledTime: new Date('2026-02-28T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 71,
    lastUpdated: Date.now()
  },
  {
    id: 'race_12',
    round: 12,
    raceName: 'British Grand Prix',
    circuit: {
      circuitId: 'silverstone',
      circuitName: 'Silverstone Circuit',
      location: 'Silverstone',
      country: 'UK',
      length: 5.891
    },
    date: '2026-03-01T17:00:00+05:30',
    scheduledTime: new Date('2026-03-01T17:00:00+05:30').getTime(),
    status: 'upcoming',
    laps: 52,
    lastUpdated: Date.now()
  }
];

// Feb 18 results with real driver photos + fallback
const FEB18_RESULTS: RaceResult[] = [
  {
    driverId: 'max_verstappen',
    driverName: 'Max Verstappen',
    team: 'Red Bull Racing',
    teamColor: '#3671C6',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/verstappen.jpg',
    position: 1,
    points: 25,
    timeGap: 'WINNER',
    priceChange: 15,
    finalPrice: 12500000
  },
  {
    driverId: 'sergio_perez',
    driverName: 'Sergio Perez',
    team: 'Red Bull Racing',
    teamColor: '#3671C6',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/perez.jpg',
    position: 2,
    points: 18,
    timeGap: '+12.456s',
    priceChange: 10,
    finalPrice: 9500000
  },
  {
    driverId: 'lewis_hamilton',
    driverName: 'Lewis Hamilton',
    team: 'Mercedes',
    teamColor: '#6CD3BF',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/hamilton.jpg',
    position: 3,
    points: 15,
    timeGap: '+23.789s',
    priceChange: 8,
    finalPrice: 11000000
  },
  {
    driverId: 'charles_leclerc',
    driverName: 'Charles Leclerc',
    team: 'Ferrari',
    teamColor: '#E8002D',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/leclerc.jpg',
    position: 4,
    points: 12,
    timeGap: '+35.123s',
    priceChange: 6,
    finalPrice: 10500000
  },
  {
    driverId: 'carlos_sainz',
    driverName: 'Carlos Sainz',
    team: 'Ferrari',
    teamColor: '#E8002D',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/sainz.jpg',
    position: 5,
    points: 10,
    timeGap: '+41.567s',
    priceChange: 4,
    finalPrice: 9800000
  },
  {
    driverId: 'lando_norris',
    driverName: 'Lando Norris',
    team: 'McLaren',
    teamColor: '#FF8700',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/norris.jpg',
    position: 6,
    points: 8,
    timeGap: '+48.901s',
    priceChange: 3,
    finalPrice: 8900000
  },
  {
    driverId: 'oscar_piastri',
    driverName: 'Oscar Piastri',
    team: 'McLaren',
    teamColor: '#FF8700',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/piastri.jpg',
    position: 7,
    points: 6,
    timeGap: '+52.345s',
    priceChange: 2,
    finalPrice: 8200000
  },
  {
    driverId: 'george_russell',
    driverName: 'George Russell',
    team: 'Mercedes',
    teamColor: '#6CD3BF',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/russell.jpg',
    position: 8,
    points: 4,
    timeGap: '+57.678s',
    priceChange: 1,
    finalPrice: 8800000
  },
  {
    driverId: 'fernando_alonso',
    driverName: 'Fernando Alonso',
    team: 'Aston Martin',
    teamColor: '#2D826D',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/alonso.jpg',
    position: 9,
    points: 2,
    timeGap: '+63.234s',
    priceChange: 0.5,
    finalPrice: 7500000
  },
  {
    driverId: 'lance_stroll',
    driverName: 'Lance Stroll',
    team: 'Aston Martin',
    teamColor: '#2D826D',
    photo: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/2024Drivers/stroll.jpg',
    position: 10,
    points: 1,
    timeGap: '+71.456s',
    priceChange: 0,
    finalPrice: 5200000
  }
];

const FALLBACK_PHOTO_BY_DRIVER_ID: Record<string, string> = INITIAL_DRIVERS.reduce((acc, driver) => {
  acc[driver.id] = driver.photo;
  return acc;
}, {} as Record<string, string>);

const FALLBACK_PRICE_BY_DRIVER_ID: Record<string, number> = INITIAL_DRIVERS.reduce((acc, driver) => {
  acc[driver.id] = driver.price;
  return acc;
}, {} as Record<string, number>);

// Country code helper for flags
const getCountryCode = (country: string): string => {
  const map: Record<string, string> = {
    'Bahrain': 'BH',
    'Saudi Arabia': 'SA',
    'Australia': 'AU',
    'Japan': 'JP',
    'China': 'CN',
    'USA': 'US',
    'Italy': 'IT',
    'Monaco': 'MC',
    'Canada': 'CA',
    'Spain': 'ES',
    'Austria': 'AT',
    'UK': 'GB',
    'Hungary': 'HU',
    'Belgium': 'BE',
    'Netherlands': 'NL',
    'Azerbaijan': 'AZ',
    'Singapore': 'SG',
    'Mexico': 'MX',
    'Brazil': 'BR',
    'Qatar': 'QA',
    'UAE': 'AE',
    'South Korea': 'KR',
    'India': 'IN'
  };
  return map[country] || 'XX';
};

// Improved race simulation: higher price/attributes = much better chance of top positions
const simulateRaceResults = (raceId: string, allDrivers: any[]): RaceResult[] => {
  if (!allDrivers.length) return [];

  // Calculate a performance score: price + attributes + small randomness
  const driversWithScore = allDrivers.map(d => {
    const baseScore = (d.price / 100) + (d.attributes?.speed || 50) + (d.attributes?.consistency || 50);
    // Add a random factor (±20%) to keep it realistic
    const randomFactor = 1 + (Math.random() * 0.4 - 0.2);
    return {
      ...d,
      score: baseScore * randomFactor
    };
  });

  // Sort by score descending (highest score = better performance)
  const sorted = driversWithScore.sort((a, b) => b.score - a.score);

  // Small chance of swapping adjacent drivers to add unpredictability (like safety car, etc.)
  for (let i = 0; i < sorted.length - 1; i++) {
    if (Math.random() < 0.15) { // 15% chance of swapping
      [sorted[i], sorted[i + 1]] = [sorted[i + 1], sorted[i]];
    }
  }

  return sorted.map((driver, index) => {
    const position = index + 1;
    const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0][index] || 0;
    let priceChange = 0;
    if (position === 1) priceChange = 15;
    else if (position === 2) priceChange = 10;
    else if (position === 3) priceChange = 8;
    else if (position <= 6) priceChange = 6 - position;
    else if (position <= 10) priceChange = 0;
    else priceChange = -Math.floor(Math.random() * 6) - 1;

    return {
      driverId: driver.id,
      driverName: driver.name,
      team: driver.team,
      teamColor: driver.teamColor,
      photo: driver.photo || FALLBACK_PHOTO_BY_DRIVER_ID[driver.id] || '',
      position,
      points,
      timeGap: position === 1 ? 'WINNER' : `+${(Math.random() * 30 + 5).toFixed(3)}s`,
      priceChange,
      finalPrice: Math.round(driver.price * (1 + priceChange / 100))
    };
  }).sort((a, b) => a.position - b.position);
};

const Schedule: React.FC = () => {
  const { drivers, user, setUser, updateDriverPrice } = useAppStore();
  const [races, setRaces] = useState<Race[]>([]);
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);
  const [completedRaces, setCompletedRaces] = useState<Race[]>([]);
  const [liveRace, setLiveRace] = useState<Race | null>(null);
  const [expandedRace, setExpandedRace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverTime, setServerTime] = useState(new Date());

  // Trade modal state
  const [selectedDriver, setSelectedDriver] = useState<RaceResult | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [shares, setShares] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);

  // FORCE COMPLETE any race that is in the past but still marked upcoming (runs once on mount)
  useEffect(() => {
    const forceCompletePastRaces = async () => {
      if (drivers.length === 0) return; // wait for drivers

      const now = Date.now();
      const pastRaces = races.filter(r => {
        const missingResults = !Array.isArray(r.results) || r.results.length === 0;
        return r.scheduledTime <= now && (r.status === 'upcoming' || (r.status === 'completed' && missingResults));
      });

      if (pastRaces.length === 0) return;

      console.log('Force‑completing past races:', pastRaces.map(r => r.raceName));

      for (const race of pastRaces) {
        const results = simulateRaceResults(race.id, drivers);
        const raceRef = doc(db, 'race_schedule', race.id);
        await updateDoc(raceRef, {
          status: 'completed',
          results: results,
          winner: results[0]?.driverName || '',
          lastUpdated: Date.now()
        });

        for (const result of results) {
          const driverRef = doc(db, 'drivers', result.driverId);
          const driver = drivers.find(d => d.id === result.driverId);
          if (driver) {
            const newPrice = Math.round(driver.price * (1 + result.priceChange / 100));
            await updateDoc(driverRef, {
              price: newPrice,
              change: result.priceChange
            });
            updateDriverPrice(result.driverId, newPrice, result.priceChange);
          }
        }
      }
    };

    forceCompletePastRaces();
  }, [races, drivers, updateDriverPrice]); // runs when races and drivers are loaded

  // Regular interval check (every minute) – also runs on mount and when upcomingRaces changes
  useEffect(() => {
    const checkAndCompleteRaces = async () => {
      if (drivers.length === 0) return;

      const now = Date.now();
      const racesToComplete = upcomingRaces.filter(race => race.scheduledTime <= now);

      if (racesToComplete.length === 0) return;

      console.log('Completing races via interval:', racesToComplete.map(r => r.raceName));

      for (const race of racesToComplete) {
        const results = simulateRaceResults(race.id, drivers);
        const raceRef = doc(db, 'race_schedule', race.id);
        await updateDoc(raceRef, {
          status: 'completed',
          results: results,
          winner: results[0]?.driverName || '',
          lastUpdated: Date.now()
        });

        for (const result of results) {
          const driverRef = doc(db, 'drivers', result.driverId);
          const driver = drivers.find(d => d.id === result.driverId);
          if (driver) {
            const newPrice = Math.round(driver.price * (1 + result.priceChange / 100));
            await updateDoc(driverRef, {
              price: newPrice,
              change: result.priceChange
            });
            updateDriverPrice(result.driverId, newPrice, result.priceChange);
          }
        }
      }
    };

    checkAndCompleteRaces();
    const interval = setInterval(checkAndCompleteRaces, 60000);
    return () => clearInterval(interval);
  }, [upcomingRaces, drivers, updateDriverPrice]);

  // Keep latest completed race result prices aligned with current market driver prices
  // (same latest-race rule as Market.tsx: completed + results, sorted by lastUpdated desc)
  useEffect(() => {
    const syncLatestCompletedRacePrices = async () => {
      if (drivers.length === 0 || races.length === 0) return;

      const latestCompleted = [...races]
        .filter(r => r.status === 'completed' && Array.isArray(r.results) && r.results.length > 0)
        .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))[0];

      if (!latestCompleted || !latestCompleted.results?.length) return;

      const priceByDriverId: Record<string, number> = {};
      drivers.forEach(d => {
        priceByDriverId[d.id] = d.price;
      });

      let changed = false;
      const syncedResults = latestCompleted.results.map((result) => {
        const marketPrice = priceByDriverId[result.driverId];
        if (typeof marketPrice !== 'number') return result;
        if (result.finalPrice === marketPrice) return result;
        changed = true;
        return {
          ...result,
          finalPrice: marketPrice
        };
      });

      if (!changed) return;

      await updateDoc(doc(db, 'race_schedule', latestCompleted.id), {
        results: syncedResults,
        lastUpdated: Date.now()
      });
    };

    syncLatestCompletedRacePrices();
  }, [races, drivers]);

  // Initialize Firestore with predefined races and Feb 18 results
  useEffect(() => {
    const initializeSchedule = async () => {
      try {
        const schedRef = collection(db, 'race_schedule');
        const snap = await getDocs(schedRef);
        const marketDriversSnap = await getDocs(collection(db, 'drivers'));
        const marketPriceByDriverId: Record<string, number> = {};
        marketDriversSnap.docs.forEach(d => {
          const data = d.data() as any;
          const price = typeof data?.price === 'number' ? data.price : FALLBACK_PRICE_BY_DRIVER_ID[d.id];
          if (typeof price === 'number') {
            marketPriceByDriverId[d.id] = Math.round(price);
          }
        });

        const feb18Race = PREDEFINED_RACES.find(r => r.id === 'race_1');
        if (feb18Race) {
          const existingFeb18 = snap.docs.find(d => d.id === 'race_1');
          const existingData = existingFeb18?.data() as Partial<Race> | undefined;
          const existingResults = Array.isArray(existingData?.results) ? existingData.results : [];
          const feb18ResultsWithMarketPrices = FEB18_RESULTS.map(result => ({
            ...result,
            finalPrice: marketPriceByDriverId[result.driverId] || FALLBACK_PRICE_BY_DRIVER_ID[result.driverId] || result.finalPrice
          }));
          const needsFeb18Repair =
            !existingFeb18 ||
            existingData?.status !== 'completed' ||
            existingResults.length === 0 ||
            existingResults.some((r: any) => !r?.photo || typeof r?.finalPrice !== 'number' || r.finalPrice > 100000);

          if (needsFeb18Repair) {
            await setDoc(doc(db, 'race_schedule', 'race_1'), {
              ...feb18Race,
              status: 'completed',
              results: feb18ResultsWithMarketPrices,
              winner: 'Max Verstappen',
              lastUpdated: Date.now()
            });
          }
        }

        for (const race of PREDEFINED_RACES.slice(1)) {
          const existing = snap.docs.find(d => d.id === race.id);
          if (!existing) {
            await setDoc(doc(db, 'race_schedule', race.id), {
              ...race,
              results: [],
              winner: '',
              lastUpdated: Date.now()
            });
          }
        }
      } catch (e) {
        console.error('Schedule initialization error:', e);
      }
    };

    initializeSchedule();
  }, []);

  // Real-time listener for schedule updates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'race_schedule'), (snap) => {
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Race))
        .sort((a, b) => a.round - b.round);

      setRaces(all);
      setLiveRace(all.find(r => r.status === 'live') || null);
      setUpcomingRaces(all.filter(r => r.status === 'upcoming'));
      setCompletedRaces(all.filter(r => r.status === 'completed'));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Server time tick
  useEffect(() => {
    const tick = () => setServerTime(new Date());
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const medal = (pos: number) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `P${pos}`;
  };

  // Buy handler (copied from Market.tsx)
  const handleBuy = async () => {
    if (!selectedDriver || !user || buyLoading) return;
    const fullDriver = drivers.find(d => d.id === selectedDriver.driverId);
    if (!fullDriver) return;

    const totalCost = fullDriver.price * shares;
    if (user.balance < totalCost) {
      alert('Insufficient balance!');
      return;
    }

    setBuyLoading(true);
    try {
      const existing = user.portfolio.find((p: any) => p.driverId === fullDriver.id);
      const newPortfolio = existing
        ? user.portfolio.map((p: any) =>
            p.driverId === fullDriver.id
              ? {
                  ...p,
                  shares: p.shares + shares,
                  avgBuyPrice: ((p.avgBuyPrice * p.shares) + totalCost) / (p.shares + shares)
                }
              : p
          )
        : [
            ...user.portfolio,
            {
              driverId: fullDriver.id,
              shares,
              avgBuyPrice: fullDriver.price,
              currentPrice: fullDriver.price,
              totalValue: totalCost,
              totalReturn: 0,
              totalReturnPercent: 0,
              purchaseDate: Date.now()
            }
          ];

      const updatedUser = {
        ...user,
        balance: user.balance - totalCost,
        portfolio: newPortfolio
      };

      await updateDoc(doc(db, 'users', user.uid), {
        balance: updatedUser.balance,
        portfolio: updatedUser.portfolio
      });

      setUser(updatedUser);
      setShowBuyModal(false);
      setShares(1);
      setSelectedDriver(null);
    } catch (e) {
      console.error('Buy error:', e);
      alert('Failed to complete purchase. Please try again.');
    } finally {
      setBuyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-racing-red border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-xl">Loading Schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8 relative">
      <div className="racing-stripes fixed inset-0 opacity-20 pointer-events-none" />
      <div className="max-w-5xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="racing-header mb-4">RACE SCHEDULE 2026</h1>
          <p className="text-gray-400">February 18 – March 15 • 5:00 PM IST Daily</p>
          <p className="text-sm text-gray-500 mt-2">
            Current Time: {serverTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </p>
        </motion.div>

        {/* Live banner */}
        {liveRace && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-6 bg-gradient-to-br from-red-600 to-red-800 text-white border-red-400"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Radio className="w-8 h-8 animate-pulse" />
                <div>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">LIVE NOW</span>
                  <h2 className="text-2xl font-bold">{liveRace.raceName}</h2>
                  <p>Round {liveRace.round} • In Progress</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = liveRace.id === 'test_gp' ? '/live-test' : '/live'}
                className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
              >
                Watch Live →
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="stat-card text-center">
            <p className="text-3xl font-black text-racing-red">{completedRaces.length}</p>
            <p className="text-gray-400 text-sm">Completed</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-3xl font-black text-yellow-400">{liveRace ? 1 : 0}</p>
            <p className="text-gray-400 text-sm">Live Now</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-3xl font-black text-blue-400">{upcomingRaces.length}</p>
            <p className="text-gray-400 text-sm">Upcoming</p>
          </div>
        </div>

        {/* Completed Races */}
        {completedRaces.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" /> Completed Races
            </h2>
            <div className="space-y-3">
              {completedRaces.map((race, idx) => {
                const raceDate = new Date(race.scheduledTime);
                const isExpanded = expandedRace === race.id;
                const totalDist = Math.round(race.laps * race.circuit.length);
                const results = race.results || [];
                const formattedDate = raceDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'Asia/Kolkata'
                });

                return (
                  <motion.div
                    key={race.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="card border-green-500/30 cursor-pointer hover:border-green-500/50 transition"
                    onClick={() => setExpandedRace(isExpanded ? null : race.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Flag */}
                        <div className="w-10 h-8 flex items-center justify-center">
                          <ReactCountryFlag
                            countryCode={getCountryCode(race.circuit.country)}
                            svg
                            style={{ width: '2.5rem', height: '2rem' }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">
                              COMPLETED
                            </span>
                            <span className="text-xs text-gray-500">Round {race.round}</span>
                          </div>
                          <h3 className="text-lg font-black text-white">{race.raceName}</h3>
                          <p className="text-gray-400 text-sm">
                            {race.circuit.location}, {race.circuit.country}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        {race.winner && (
                          <div>
                            <p className="text-xs text-gray-400">Winner</p>
                            <p className="text-yellow-400 font-bold text-sm">🏆 {race.winner}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-400">{formattedDate}</p>
                          <div className="text-gray-400">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 ml-auto" />
                            ) : (
                              <ChevronDown className="w-5 h-5 ml-auto" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="mt-4 pt-4 border-t border-gray-700/50">
                            {/* Circuit Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                                <p className="text-gray-400 text-xs">Circuit</p>
                                <p className="text-white text-xs font-bold truncate">
                                  {race.circuit.circuitName}
                                </p>
                              </div>
                              <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                                <p className="text-gray-400 text-xs">Laps</p>
                                <p className="text-white text-xl font-black">{race.laps}</p>
                              </div>
                              <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                                <p className="text-gray-400 text-xs">Circuit Length</p>
                                <p className="text-white text-xl font-black">{race.circuit.length}km</p>
                              </div>
                              <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                                <p className="text-gray-400 text-xs">Total Distance</p>
                                <p className="text-white text-xl font-black">{totalDist}km</p>
                              </div>
                            </div>

                            {/* Results */}
                            {results.length > 0 ? (
                              <div>
                                <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-yellow-400" /> Race Results & Price Changes
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-700">
                                        <th className="py-2 px-2 text-gray-400 text-xs text-left">Pos</th>
                                        <th className="py-2 px-2 text-gray-400 text-xs text-left">Driver</th>
                                        <th className="py-2 px-2 text-gray-400 text-xs text-left">Team</th>
                                        <th className="py-2 px-2 text-gray-400 text-xs text-right">Gap</th>
                                        <th className="py-2 px-2 text-gray-400 text-xs text-right">Pts</th>
                                        <th className="py-2 px-2 text-gray-400 text-xs text-right">Price Δ</th>
                                        <th className="py-2 px-2 text-gray-400 text-xs text-right">New Price</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {results.map((r: RaceResult) => (
                                        <tr
                                          key={r.driverId}
                                          className={`border-b border-gray-800/50 cursor-pointer hover:bg-white/5 transition ${
                                            r.position <= 3 ? 'bg-yellow-500/5' : ''
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDriver(r);
                                            setShowBuyModal(true);
                                          }}
                                        >
                                          <td className="py-1.5 px-2">
                                            <span className={`font-black text-xs ${
                                              r.position === 1 ? 'text-yellow-400' :
                                              r.position === 2 ? 'text-gray-300' :
                                              r.position === 3 ? 'text-amber-600' : 'text-white'
                                            }`}>
                                              {medal(r.position)}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-2">
                                            <div className="flex items-center gap-1.5">
                                              {r.photo ? (
                                                <img
                                                  src={r.photo}
                                                  alt={r.driverName}
                                                  className="w-5 h-5 rounded-full object-cover"
                                                  onError={(e) => {
                                                    // Fallback to avatar if image fails
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.driverName)}&background=E10600&color=fff&size=40&bold=true`;
                                                  }}
                                                />
                                              ) : (
                                                <div
                                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                                  style={{ backgroundColor: r.teamColor }}
                                                >
                                                  {r.driverName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                              )}
                                              <span className="text-white font-semibold text-xs">
                                                {r.driverName}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="py-1.5 px-2 text-gray-400 text-xs">{r.team}</td>
                                          <td className="py-1.5 px-2 text-right text-gray-400 font-mono text-xs">
                                            {r.timeGap}
                                          </td>
                                          <td className="py-1.5 px-2 text-right">
                                            {r.points > 0 ? (
                                              <span className="text-blue-400 font-bold text-xs">
                                                +{r.points}
                                              </span>
                                            ) : (
                                              <span className="text-gray-600 text-xs">—</span>
                                            )}
                                          </td>
                                          <td className="py-1.5 px-2 text-right">
                                            <span className={`font-bold text-xs ${
                                              r.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                              {r.priceChange >= 0 ? '+' : ''}{r.priceChange}%
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-2 text-right text-white font-bold text-xs">
                                            ${r.finalPrice?.toLocaleString()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm text-center py-4">
                                Results will appear after the race ends.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Races */}
        {upcomingRaces.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-400" /> Upcoming Races
            </h2>
            <div className="space-y-3">
              {upcomingRaces.map((race, idx) => {
                const raceDate = new Date(race.scheduledTime);
                const isExpanded = expandedRace === race.id;
                const totalDist = Math.round(race.laps * race.circuit.length);
                const formattedDate = raceDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'Asia/Kolkata'
                });

                return (
                  <motion.div
                    key={race.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="card cursor-pointer hover:border-racing-red/50 transition"
                    onClick={() => setExpandedRace(isExpanded ? null : race.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-8 flex items-center justify-center">
                          <ReactCountryFlag
                            countryCode={getCountryCode(race.circuit.country)}
                            svg
                            style={{ width: '2.5rem', height: '2rem' }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">
                              UPCOMING
                            </span>
                            <span className="text-xs text-gray-500">Round {race.round}</span>
                          </div>
                          <h3 className="text-lg font-black text-white">{race.raceName}</h3>
                          <p className="text-gray-400 text-sm">
                            {race.circuit.location}, {race.circuit.country}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-yellow-400 font-bold text-sm">{formattedDate}</p>
                          <p className="text-gray-400 text-xs">5:00 PM IST</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="mt-4 pt-4 border-t border-gray-700/50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                                <p className="text-gray-400 text-xs">Circuit</p>
                                <p className="text-white text-xs font-bold truncate">
                                  {race.circuit.circuitName}
                                </p>
                              </div>
                              <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                                <p className="text-gray-400 text-xs">Laps</p>
                                <p className="text-white text-xl font-black">{race.laps}</p>
                              </div>
                              <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                                <p className="text-gray-400 text-xs">Circuit Length</p>
                                <p className="text-white text-xl font-black">{race.circuit.length}km</p>
                              </div>
                              <div className="bg-dark-800/50 rounded-lg p-3 text-center">
                                <p className="text-gray-400 text-xs">Total Distance</p>
                                <p className="text-white text-xl font-black">{totalDist}km</p>
                              </div>
                            </div>

                            <div className="bg-dark-800/30 rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-racing-red shrink-0" />
                                <div>
                                  <p className="text-white text-sm font-semibold">
                                    {race.circuit.circuitName}
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {race.circuit.location}, {race.circuit.country}
                                  </p>
                                </div>
                                <div className="ml-auto text-right">
                                  <p className="text-gray-400 text-xs">Round {race.round} of 26</p>
                                  <p className="text-yellow-400 text-xs font-bold">
                                    {formattedDate} • 5:00 PM IST
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Price Impact Preview */}
                            <div className="bg-racing-red/5 border border-racing-red/20 rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-2">
                                Expected Price Impact After Race:
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                  P1: +15%
                                </span>
                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  P2: +10%
                                </span>
                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  P3: +8%
                                </span>
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                  P4–P6: +3–6%
                                </span>
                                <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                                  P11+: −1 to −6%
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {upcomingRaces.length === 0 && completedRaces.length > 0 && !liveRace && (
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-2">SEASON COMPLETE</h2>
            <p className="text-gray-400">All races of the 2026 season have been completed.</p>
          </div>
        )}
      </div>

      {/* Buy Modal (copied from Market.tsx) */}
      <AnimatePresence>
        {showBuyModal && selectedDriver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => !buyLoading && setShowBuyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-md w-full racing-border glow-effect"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                {selectedDriver.photo ? (
                  <img
                    src={selectedDriver.photo}
                    alt={selectedDriver.driverName}
                    className="w-20 h-20 rounded-full object-cover border-4 border-racing-red"
                    onError={e => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDriver.driverName)}&background=E10600&color=fff&size=200&bold=true`;
                    }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-racing-red"
                    style={{ backgroundColor: selectedDriver.teamColor }}
                  >
                    {selectedDriver.driverName.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-black text-white uppercase">{selectedDriver.driverName}</h2>
                  <p className="text-gray-400">{selectedDriver.team}</p>
                  {selectedDriver.position && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">Race Result:</span>
                      <span className="text-xs text-yellow-400 font-bold">P{selectedDriver.position}</span>
                      <span className={`text-xs font-bold ${selectedDriver.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedDriver.priceChange >= 0 ? '+' : ''}{selectedDriver.priceChange}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4 p-4 bg-racing-black/50 rounded-lg border border-racing-red/30">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Price per share</p>
                    <p className="text-3xl font-black text-white">${selectedDriver.finalPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm mb-1">Your balance</p>
                    <p className="text-xl font-bold text-green-400">${user?.balance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-bold mb-3 uppercase">Number of shares</label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setShares(p => Math.max(1, p - 1))}
                      disabled={buyLoading}
                      className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-2xl font-black flex items-center justify-center shadow-lg transition"
                    >
                      −
                    </button>
                    <div className="w-20 h-12 flex items-center justify-center bg-black/60 border border-red-600/40 rounded-xl text-2xl font-bold text-white">
                      {shares}
                    </div>
                    <button
                      onClick={() => setShares(p => Math.min(Math.floor((user?.balance || 0) / selectedDriver.finalPrice), p + 1))}
                      disabled={buyLoading}
                      className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-2xl font-black flex items-center justify-center shadow-lg transition"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="bg-racing-red/10 border border-racing-red/30 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 font-medium">Total Cost</span>
                    <span className="text-white font-black text-lg">${(selectedDriver.finalPrice * shares).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Remaining Balance</span>
                    <span className="text-white font-black text-lg">${((user?.balance || 0) - (selectedDriver.finalPrice * shares)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => !buyLoading && setShowBuyModal(false)}
                  className="btn-secondary flex-1 uppercase font-black"
                  disabled={buyLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuy}
                  className="btn-primary flex-1 uppercase font-black"
                  disabled={(user?.balance || 0) < selectedDriver.finalPrice * shares || buyLoading}
                >
                  {buyLoading ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Schedule;
