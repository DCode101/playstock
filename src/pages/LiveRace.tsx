import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Flag, Clock, Zap, TrendingUp, TrendingDown, X, Calendar, Gauge, Thermometer, Wind, Battery, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useAppStore } from '../store/appStore';
import { doc, updateDoc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { INITIAL_DRIVERS } from '../services/dataService';

// ─── Constants ────────────────────────────────────────────────────────────────
const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const PRICE_CHANGE_BY_POSITION: Record<number, number> = {
  1: 15, 2: 10, 3: 8, 4: 6, 5: 4, 6: 3, 7: 2, 8: 1, 9: 0.5, 10: 0,
  11: -1, 12: -2, 13: -2, 14: -3, 15: -3, 16: -4, 17: -4, 18: -5, 19: -5, 20: -6,
};
const MAX_TELEMETRY_HISTORY = 30;
const RACE_DOC_ID      = 'current_race_state';
const SEASON_START     = new Date('2026-02-18T17:00:00+05:30').getTime();
const SEASON_END       = new Date('2026-03-15T19:00:00+05:30').getTime();
const RACE_DURATION_MS = 2 * 60 * 60 * 1000;   // 2 hours
const POST_RACE_MS     = 30 * 60 * 1000;        // 30 min leaderboard
const TOTAL_LAPS       = 57;
const IST_OFFSET_MS    = 5.5 * 3_600_000;

// ─── Pure time helpers (no side-effects, safe to call anywhere) ───────────────
function getISTMidnight(nowMs: number): number {
  const d = new Date(nowMs + IST_OFFSET_MS);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() - IST_OFFSET_MS;
}
function getTodayRaceStart(nowMs = Date.now()): number {
  return getISTMidnight(nowMs) + 17 * 3_600_000; // 5 PM IST
}
// Returns the next upcoming race-start timestamp from now
function getNextRaceStartMs(nowMs = Date.now()): number {
  const todayStart = getTodayRaceStart(nowMs);
  return nowMs < todayStart ? todayStart : todayStart + 86_400_000;
}
function isRaceWindow(nowMs = Date.now()): boolean {
  const s = getTodayRaceStart(nowMs);
  return nowMs >= SEASON_START && nowMs <= SEASON_END
      && nowMs >= s && nowMs < s + RACE_DURATION_MS;
}
function secsToHMS(secs: number): string {
  if (secs <= 0) return '00:00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

// ─── Component ────────────────────────────────────────────────────────────────
interface LiveRaceProps {
  forceTestLive?: boolean;
}

const LiveRace: React.FC<LiveRaceProps> = ({ forceTestLive = false }) => {
  const { drivers, updateDriverPrice, user, setUser, raceState, setRaceState } = useAppStore();

  // UI state
  const [positions,      setPositions]      = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeMode,      setTradeMode]      = useState<'buy' | 'sell'>('buy');
  const [shares,         setShares]         = useState(1);
  const [loading,        setLoading]        = useState(false);
  const [raceUpdates,    setRaceUpdates]    = useState<string[]>([]);
  const [finalStandings, setFinalStandings] = useState<any[]>([]);
  const [nextRaceName,   setNextRaceName]   = useState('');
  const [activeTab,      setActiveTab]      = useState<'telemetry' | 'graphs'>('telemetry');

  // Timer display strings
  const [countdown,    setCountdown]    = useState(''); // before race OR next-race after finish
  const [postRaceLeft, setPostRaceLeft] = useState(''); // 30-min window remaining
  const [raceTime, setRaceTime] = useState('00:00');

  // raceStatus drives which screen renders
  const [raceStatus, setRaceStatus] = useState<'before' | 'live' | 'finished' | 'after'>(() => {
    if (forceTestLive) return 'live';
    const now = Date.now();
    if (now > SEASON_END)    return 'after';
    if (isRaceWindow(now))   return 'live';
    return 'before';
  });

  // Refs — mutable values that don't trigger re-renders
  const telemetryRef     = useRef<Record<string, any[]>>({});
  const driversRef       = useRef<any[]>(drivers);
  const raceStartedRef   = useRef(false);
  const raceFinalizedRef = useRef(false);
  const raceEndMsRef     = useRef(0);   // when race was finalized
  const nextRaceMsRef    = useRef(getNextRaceStartMs()); // always has a valid fallback
  const localLapRef      = useRef(0);

  useEffect(() => { driversRef.current = drivers; }, [drivers]);

  // ─── Fetch next race from Firestore schedule ──────────────────────────────
  const loadNextRace = useCallback(async () => {
    try {
      const nowMs = Date.now();
      const snap  = await getDocs(collection(db, 'race_schedule'));
      const all   = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const upcoming = all
        .filter((r: any) => r.scheduledTime > nowMs)
        .sort((a: any, b: any) => a.scheduledTime - b.scheduledTime);
      if (upcoming.length > 0) {
        setNextRaceName(upcoming[0].raceName || '');
        nextRaceMsRef.current = upcoming[0].scheduledTime;
      } else {
        nextRaceMsRef.current = getNextRaceStartMs(nowMs);
      }
    } catch {
      nextRaceMsRef.current = getNextRaceStartMs();
    }
  }, [forceTestLive]);

  // ─── Init race doc ────────────────────────────────────────────────────────
  const initRaceDoc = async () => {
    const now  = Date.now();
    const init = {
      isOngoing: false, raceFinished: false, currentLap: 0,
      positions: [], results: [], lastUpdated: now,
      nextRaceTime: getNextRaceStartMs(now),
      seasonStart: SEASON_START, seasonEnd: SEASON_END,
    };
    try { await setDoc(doc(db, 'race', RACE_DOC_ID), init); setRaceState(init); }
    catch (e) { console.error('initRaceDoc error:', e); }
  };

  // ─── Start race ───────────────────────────────────────────────────────────
  const startRace = async () => {
    if (raceStartedRef.current) return;
    const currentDrivers = driversRef.current.length > 0 ? driversRef.current : INITIAL_DRIVERS;
    if (!currentDrivers.length) {
      console.warn('⚠️ startRace: drivers not loaded yet');
      return;
    }
    raceStartedRef.current = true;
    telemetryRef.current   = {};
    console.log('🏁 startRace()', new Date().toISOString());

    const grid = [...currentDrivers]
      .sort((a, b) => (a.rank || 99) - (b.rank || 99))
      .slice(0, 20)
      .map((d, i) => ({
        id: d.id, name: d.name, team: d.team, teamColor: d.teamColor,
        photo: d.photo, price: d.price, rank: d.rank, points: d.points || 0,
        position: i + 1,
        gap: i === 0 ? 'Leader' : `+${(i * 2.3).toFixed(3)}s`,
        pitstops: 0,
        speed: 320 + Math.random() * 20, rpm: 11000 + Math.random() * 2000,
        throttle: 85 + Math.random() * 15, brake: Math.random() * 100,
        gear: Math.floor(Math.random() * 8) + 1,
        tyreWear: 100, fuel: 100,
        tyreTemp: 95 + Math.random() * 10, engineTemp: 105 + Math.random() * 10,
        acceleration: 4.5 + Math.random() * 1.5,
      }));

    setRaceState({
      isOngoing: true,
      currentLap: 1,
      positions: grid,
      results: [],
      lastUpdated: Date.now(),
    });
    setPositions(grid);
    setSelectedDriver(grid[0] || null);

    await updateDoc(doc(db, 'race', RACE_DOC_ID), {
      isOngoing: true, raceFinished: false, currentLap: 1,
      positions: grid, results: [], lastUpdated: Date.now(),
    });
    setRaceUpdates(['🏁 RACE STARTED! Lights out and away we go!']);
  };

  // ─── Finalize race ────────────────────────────────────────────────────────
  const finalizeRace = async (st: any, ref: any) => {
    if (raceFinalizedRef.current) return;
    const pos = st.positions || [];
    if (!pos.length) return;
    raceFinalizedRef.current = true;
    const nowMs = Date.now();
    console.log('🏆 finalizeRace()', new Date().toISOString());

    // Score drivers based on current position + historical performance
    const ordered = pos
      .map((d: any) => ({
        d,
        score:
          (21 - Math.min(d.position || 20, 20)) * 3 +
          (d.rank   ? 21 - Math.min(d.rank, 20)   : 10) +
          (d.points ? Math.min(d.points / 10, 15)  :  0) +
          Math.random() * 2,
      }))
      .sort((a: any, b: any) => b.score - a.score)
      .map((x: any) => x.d);

    const results = ordered.map((d: any, i: number) => {
      const position       = i + 1;
      const priceChangePct = PRICE_CHANGE_BY_POSITION[position] ?? -5;
      const finalPrice     = Math.max(100, Math.round(d.price * (1 + priceChangePct / 100)));
      return {
        driverId: d.id, driverName: d.name, team: d.team,
        teamColor: d.teamColor || '#E10600', photo: d.photo || '',
        position, points: POINTS_SYSTEM[i] || 0,
        timeGap: position === 1 ? 'WINNER' : `+${((position - 1) * 1.5 + Math.random()).toFixed(3)}s`,
        priceChange: priceChangePct, finalPrice, previousPrice: d.price,
      };
    });

    // 1. Mark race finished in race doc
    await updateDoc(ref, { isOngoing: false, raceFinished: true, results, lastUpdated: nowMs });

    setFinalStandings(results);
    setRaceStatus('finished');
    raceEndMsRef.current = nowMs; // timer will now count down from this

    // 2. Update every driver's price in Firestore
    for (const r of results) {
      try {
        const storeDriver = driversRef.current.find((d: any) => d.id === r.driverId);
        const prevPoints  = storeDriver?.points || 0;
        await updateDoc(doc(db, 'drivers', r.driverId), {
          price: r.finalPrice,
          changePercent: r.priceChange,
          lastRacePosition: r.position,
          points: prevPoints + r.points,
          lastUpdated: nowMs,
        });
        // Update local store immediately
        updateDriverPrice(r.driverId, r.finalPrice, r.priceChange);
      } catch (e) { console.error('driver update error:', e); }
    }

    // 3. Write results to race_schedule for Schedule page
    try {
      const schedSnap  = await getDocs(collection(db, 'race_schedule'));
      const todayStart = getTodayRaceStart(nowMs);
      const match      = schedSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .find((r: any) =>
          r.scheduledTime >= todayStart - 3_600_000 &&
          r.scheduledTime <= todayStart + 3_600_000
        );
      if (match) {
        await updateDoc(doc(db, 'race_schedule', match.id), {
          status: 'completed', results,
          winner: results[0]?.driverName || '',
          lastUpdated: nowMs,
        });
        console.log('✅ race_schedule updated:', match.id);
      } else {
        console.warn('⚠️ No matching race_schedule doc found for today');
      }
    } catch (e) { console.error('race_schedule update error:', e); }

    // 4. Load next race info so countdown shows immediately
    await loadNextRace();
  };

  // ─── Firestore snapshot ───────────────────────────────────────────────────
  useEffect(() => {
    const ref   = doc(db, 'race', RACE_DOC_ID);
    const unsub = onSnapshot(ref, async (snap) => {
      const nowMs = Date.now();
      if (!snap.exists()) { await initRaceDoc(); return; }

      const data = snap.data();
      setRaceState({
        isOngoing: data.isOngoing, currentLap: data.currentLap || 0,
        positions: data.positions || [], results: data.results || [],
        lastUpdated: data.lastUpdated, nextRaceTime: data.nextRaceTime,
        seasonStart: SEASON_START, seasonEnd: SEASON_END,
      });
      setPositions(data.positions || []);

      // Reset guard refs when doc is cleared for a new day
      if (!data.isOngoing && !data.raceFinished) {
        raceStartedRef.current   = false;
        raceFinalizedRef.current = false;
      }
      // Restore telemetry from Firestore for users who join mid-race
      if (data.isOngoing && data.telemetryHistory) {
        telemetryRef.current = data.telemetryHistory;
      }

      // ── Authoritative status logic ──
      if (forceTestLive) {
        setRaceStatus('live');
      } else if (nowMs > SEASON_END) {
        setRaceStatus('after');
      } else if (data.isOngoing) {
        setRaceStatus('live');
        setFinalStandings([]);
      } else if (data.raceFinished) {
        const res = data.results || [];
        setFinalStandings(res);
        if (data.lastUpdated && raceEndMsRef.current === 0) {
          raceEndMsRef.current = data.lastUpdated;
        }
        setRaceStatus('finished');
        await loadNextRace();
      } else if (isRaceWindow(nowMs)) {
        setRaceStatus('live'); // wall clock says race time but doc not started yet
      } else {
        setRaceStatus('before');
        await loadNextRace();
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedDriver && raceState.positions.length > 0) {
      setSelectedDriver(raceState.positions[0]);
    }
  }, [raceState.positions, selectedDriver]);

  useEffect(() => {
    if (!forceTestLive || raceStatus !== 'live' || positions.length > 0) return;

    const source = driversRef.current.length > 0 ? driversRef.current : INITIAL_DRIVERS;
    if (!source.length) return;

    const grid = [...source]
      .sort((a, b) => (a.rank || 99) - (b.rank || 99))
      .slice(0, 20)
      .map((d, i) => ({
        id: d.id, name: d.name, team: d.team, teamColor: d.teamColor,
        photo: d.photo, price: d.price, rank: d.rank, points: d.points || 0,
        position: i + 1,
        gap: i === 0 ? 'Leader' : `+${(i * 2.3).toFixed(3)}s`,
        pitstops: 0,
        speed: 320 + Math.random() * 20, rpm: 11000 + Math.random() * 2000,
        throttle: 85 + Math.random() * 15, brake: Math.random() * 100,
        gear: Math.floor(Math.random() * 8) + 1,
        tyreWear: 100, fuel: 100,
        tyreTemp: 95 + Math.random() * 10, engineTemp: 105 + Math.random() * 10,
        acceleration: 4.5 + Math.random() * 1.5,
      }));

    localLapRef.current = 1;
    setRaceState({
      isOngoing: true,
      currentLap: 1,
      positions: grid,
      results: [],
      lastUpdated: Date.now(),
    });
    setPositions(grid);
    setSelectedDriver(grid[0] || null);
    setRaceUpdates(['TEST MODE: Local simulation started']);
  }, [forceTestLive, raceStatus, positions.length, setRaceState]);

  // ─── Master controller ────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const nowMs  = Date.now();
      const dayEnd = getTodayRaceStart(nowMs) + RACE_DURATION_MS;

      // Check Firestore schedule for manually triggered live status
      let scheduleLive = false;
      try {
        const s = await getDocs(collection(db, 'race_schedule'));
        scheduleLive = s.docs.some(d => (d.data() as any).status === 'live');
      } catch {}

      const shouldBeLive = forceTestLive || isRaceWindow(nowMs) || scheduleLive;

      const ref  = doc(db, 'race', RACE_DOC_ID);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const st = snap.data();

      // If an admin/manual schedule marks a race as live, allow immediate restart for testing.
      if (st.raceFinished) {
        if (scheduleLive) {
          raceStartedRef.current = false;
          raceFinalizedRef.current = false;
          await updateDoc(ref, {
            raceFinished: false,
            isOngoing: false,
            currentLap: 0,
            positions: [],
            results: [],
            lastUpdated: nowMs,
          }).catch(() => {});
        }

        // Clear stale raceFinished from previous day or after 30-min post-race window
        const lastDay  = getISTMidnight(st.lastUpdated ?? 0);
        const todayDay = getISTMidnight(nowMs);
        if (todayDay > lastDay || nowMs >= dayEnd + POST_RACE_MS) {
          raceStartedRef.current   = false;
          raceFinalizedRef.current = false;
          await updateDoc(ref, { raceFinished: false, isOngoing: false, lastUpdated: nowMs }).catch(() => {});
        }
        if (!scheduleLive) {
          return; // Keep normal cooldown behavior when not explicitly forced live.
        }
      }

      const hasGrid = Array.isArray(st.positions) && st.positions.length > 0;
      if (shouldBeLive && st.isOngoing && !hasGrid) {
        raceStartedRef.current = false;
        await updateDoc(ref, { isOngoing: false, currentLap: 0, positions: [], lastUpdated: nowMs }).catch(() => {});
      }

      if      (shouldBeLive  && !st.isOngoing && !st.raceFinished) await startRace();
      else if (!shouldBeLive &&  st.isOngoing)                     await finalizeRace(st, ref);
      else if (!shouldBeLive && !st.isOngoing && !st.raceFinished) {
        const next = getNextRaceStartMs(nowMs);
        if ((st.nextRaceTime ?? 0) !== next)
          await updateDoc(ref, { nextRaceTime: next, lastUpdated: nowMs }).catch(() => {});
      }
    };

    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  // ─── Lap simulation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (raceStatus !== 'live' || !positions.length) return;

    if (forceTestLive) {
      const interval = setInterval(() => {
        setPositions(prev => {
          if (!prev.length) return prev;

          let newPos = [...prev];
          const swaps = Math.floor(Math.random() * 3);
          for (let k = 0; k < swaps; k++) {
            if (newPos.length < 2) break;
            const a = Math.floor(Math.random() * (newPos.length - 1));
            const b = a + 1;
            const tmp = { ...newPos[a] }; newPos[a] = { ...newPos[b] }; newPos[b] = tmp;
          }

          let nextLap = localLapRef.current + 1;
          if (nextLap > TOTAL_LAPS) nextLap = 1;
          localLapRef.current = nextLap;

          newPos = newPos.map((d: any, i: number) => {
            const p = i + 1;
            const bon = Math.max(0, (20 - p) * 0.5);
            const speed = Math.round(300 + Math.random() * 50 + bon);
            const throttle = Math.round(70 + Math.random() * 30);
            const brake = Math.round(Math.random() * 80);
            const rpm = Math.round(10000 + Math.random() * 3000);
            const gear = Math.min(8, Math.max(1, Math.round(speed / 50)));
            const tyreWear = Math.max(0, (d.tyreWear || 100) - (0.5 + Math.random()));
            const fuel = Math.max(0, (d.fuel || 100) - (1.2 + Math.random() * 0.3));
            const tyreTemp = +(95 + Math.random() * 15 - p * 0.2).toFixed(1);
            const engineTemp = +(105 + Math.random() * 15 - p * 0.1).toFixed(1);
            const acceleration = +(Math.max(2, 6 - p * 0.05 + Math.random() * 2)).toFixed(2);

            const hist = telemetryRef.current[d.id] || [];
            hist.push({
              lap: nextLap, speed, throttle, brake, gear, rpm,
              tyreTemp, engineTemp, fuel, acceleration,
            });
            if (hist.length > MAX_TELEMETRY_HISTORY) hist.shift();
            telemetryRef.current[d.id] = hist;

            return {
              ...d,
              position: p,
              gap: p === 1 ? 'Leader' : `+${((p - 1) * 1.5 + Math.random() * 0.5).toFixed(3)}s`,
              speed, throttle, brake, rpm, gear, tyreWear, fuel, tyreTemp, engineTemp, acceleration,
            };
          });

          setRaceState({
            isOngoing: true,
            currentLap: nextLap,
            positions: newPos,
            lastUpdated: Date.now(),
          });
          setSelectedDriver((prev: any) => prev ? (newPos.find((p: any) => p.id === prev.id) || newPos[0]) : newPos[0]);

          return newPos;
        });
      }, 2000);

      return () => clearInterval(interval);
    }

    const simulateLap = async () => {
      const ref  = doc(db, 'race', RACE_DOC_ID);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const st = snap.data();
      if (!st.isOngoing) return;

      let newPos   = [...st.positions];
      const newLap = st.currentLap + 1;

      // Overtakes
      const numOvertakes = Math.floor(Math.random() * 3);
      for (let k = 0; k < numOvertakes; k++) {
        if (newPos.length < 2) break;
        const a = Math.floor(Math.random() * (newPos.length - 1));
        const b = a + 1;
        const aScore = (newPos[a].points || 0) + (21 - (newPos[a].rank || 20)) * 2;
        const bScore = (newPos[b].points || 0) + (21 - (newPos[b].rank || 20)) * 2;
        if (Math.random() < (bScore > aScore ? 0.55 : 0.25)) {
          const tmp = { ...newPos[a] }; newPos[a] = { ...newPos[b] }; newPos[b] = tmp;
          setRaceUpdates(p => [`⚡ ${newPos[a].name} overtakes ${newPos[b].name} for P${a + 1}!`, ...p.slice(0, 9)]);
        }
      }

      // Pitstops
      newPos.forEach((d: any) => {
        if (newLap > 15 && newLap < 45 && Math.random() < 0.03) {
          d.pitstops = (d.pitstops || 0) + 1;
          d.tyreWear = 100;
          setRaceUpdates(p => [`🔧 ${d.name} pits! Stop ${d.pitstops}`, ...p.slice(0, 9)]);
        }
      });

      // Telemetry
      newPos.forEach((d: any, i: number) => {
        const p   = i + 1;
        const bon = Math.max(0, (20 - p) * 0.5);
        d.position   = p;
        d.gap        = p === 1 ? 'Leader' : `+${((p - 1) * 1.5 + Math.random() * 0.5).toFixed(3)}s`;
        d.speed      = Math.round(300 + Math.random() * 50 + bon);
        d.rpm        = Math.round(10000 + Math.random() * 3000);
        d.throttle   = Math.round(70 + Math.random() * 30);
        d.brake      = Math.round(Math.random() * 80);
        d.gear       = Math.min(8, Math.max(1, Math.round(d.speed / 50)));
        d.tyreWear   = Math.max(0, (d.tyreWear || 100) - (0.5 + Math.random()));
        d.fuel       = Math.max(0, (d.fuel || 100) - (1.2 + Math.random() * 0.3));
        d.tyreTemp   = +(95  + Math.random() * 15 - p * 0.2).toFixed(1);
        d.engineTemp = +(105 + Math.random() * 15 - p * 0.1).toFixed(1);
        d.acceleration = +(Math.max(2, 6 - p * 0.05 + Math.random() * 2)).toFixed(2);

        const hist = telemetryRef.current[d.id] || [];
        hist.push({
          lap: newLap, speed: d.speed, throttle: d.throttle,
          brake: d.brake, gear: d.gear, rpm: d.rpm,
          tyreTemp: d.tyreTemp, engineTemp: d.engineTemp,
          fuel: d.fuel, acceleration: d.acceleration,
        });
        if (hist.length > MAX_TELEMETRY_HISTORY) hist.shift();
        telemetryRef.current[d.id] = hist;
      });

      const raceComplete = newLap >= TOTAL_LAPS;
      const fsTelemetry: Record<string, any[]> = {};
      newPos.forEach((d: any) => { fsTelemetry[d.id] = telemetryRef.current[d.id] || []; });

      await updateDoc(ref, {
        positions: newPos, currentLap: newLap,
        telemetryHistory: fsTelemetry,
        isOngoing: !raceComplete,
        lastUpdated: Date.now(),
      });
      setSelectedDriver((prev: any) => prev ? (newPos.find((p: any) => p.id === prev.id) || prev) : null);

      // Micro price updates visible in Market during race
      if (!raceComplete) {
        newPos.forEach((d: any, i: number) => {
          const oldPos = (st.positions as any[]).find((p: any) => p.id === d.id)?.position || i + 1;
          if (i + 1 < oldPos)      updateDriverPrice(d.id, d.price * 1.02,  2);
          else if (i + 1 > oldPos) updateDriverPrice(d.id, d.price * 0.99, -1);
        });
      }
    };

    const interval = setInterval(simulateLap, 5000);
    return () => clearInterval(interval);
  }, [raceStatus, positions.length]);

  // ─── 1-second tick ────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const nowMs = Date.now();

      // Update race time during live race
      if (raceStatus === 'live' && raceState.currentLap) {
        const minutes = Math.floor(raceState.currentLap * 1.8);
        const seconds = Math.floor((raceState.currentLap * 1.8 * 60) % 60);
        setRaceTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }

      // Auto-transition 'before' → 'live' at exactly 5 PM
      if (raceStatus === 'before' && isRaceWindow(nowMs)) {
        setRaceStatus('live');
        return;
      }

      if (raceStatus === 'before') {
        const target = nextRaceMsRef.current > nowMs ? nextRaceMsRef.current : getNextRaceStartMs(nowMs);
        setCountdown(secsToHMS(Math.max(0, Math.floor((target - nowMs) / 1000))));
        return;
      }

      if (raceStatus === 'finished') {
        // Post-race 30-min availability countdown
        if (raceEndMsRef.current > 0) {
          const elapsedSecs   = Math.floor((nowMs - raceEndMsRef.current) / 1000);
          const remainingSecs = Math.max(0, POST_RACE_MS / 1000 - elapsedSecs);
          setPostRaceLeft(secsToHMS(remainingSecs));

          // Auto-transition to 'before' after 30 minutes
          if (remainingSecs <= 0) {
            setRaceStatus('before');
            raceEndMsRef.current = 0;
          }
        }
        // Next race countdown
        const nextTarget = nextRaceMsRef.current > nowMs ? nextRaceMsRef.current : getNextRaceStartMs(nowMs);
        setCountdown(secsToHMS(Math.max(0, Math.floor((nextTarget - nowMs) / 1000))));
      }
    };

    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [raceStatus, raceState.currentLap]);

  // ─── Trade handlers ───────────────────────────────────────────────────────
  const handleBuy = async () => {
    if (!selectedDriver || !user || loading) return;
    const cost = selectedDriver.price * shares;
    if (user.balance < cost) { alert('Insufficient balance!'); return; }
    setLoading(true);
    try {
      const ex = user.portfolio.find((p: any) => p.driverId === selectedDriver.id);
      const portfolio = ex
        ? user.portfolio.map((p: any) => p.driverId === selectedDriver.id
            ? { ...p, shares: p.shares + shares, avgBuyPrice: ((p.avgBuyPrice * p.shares) + cost) / (p.shares + shares) }
            : p)
        : [...user.portfolio, {
            driverId: selectedDriver.id, shares,
            avgBuyPrice: selectedDriver.price, currentPrice: selectedDriver.price,
            totalValue: cost, totalReturn: 0, totalReturnPercent: 0, purchaseDate: Date.now(),
          }];
      const upd = { ...user, balance: user.balance - cost, portfolio };
      await updateDoc(doc(db, 'users', user.uid), { balance: upd.balance, portfolio: upd.portfolio });
      setUser(upd); setShowTradeModal(false); setShares(1);
    } catch { alert('Purchase failed.'); } finally { setLoading(false); }
  };

  const handleSell = async () => {
    if (!selectedDriver || !user || loading) return;
    const pos = user.portfolio.find((p: any) => p.driverId === selectedDriver.id);
    if (!pos || pos.shares < shares) { alert('Insufficient shares!'); return; }
    setLoading(true);
    try {
      const val       = selectedDriver.price * shares;
      const newShares = pos.shares - shares;
      const portfolio = newShares > 0
        ? user.portfolio.map((p: any) => p.driverId === selectedDriver.id ? { ...p, shares: newShares } : p)
        : user.portfolio.filter((p: any) => p.driverId !== selectedDriver.id);
      const upd = { ...user, balance: user.balance + val, portfolio };
      await updateDoc(doc(db, 'users', user.uid), { balance: upd.balance, portfolio: upd.portfolio });
      setUser(upd); setShowTradeModal(false); setShares(1);
    } catch { alert('Sale failed.'); } finally { setLoading(false); }
  };

  // ─── Chart helpers ────────────────────────────────────────────────────────
  const getHistory = (key: string) =>
    selectedDriver
      ? (telemetryRef.current[selectedDriver.id] || []).map((h: any) => ({ lap: `L${h.lap}`, value: h[key] }))
      : [];

  const ttStyle = { backgroundColor: '#0F172A', border: '1px solid #E10600', borderRadius: 6, fontSize: 11 };
  const axStyle = { fontSize: 10, fill: '#6B7280' };

  const TelChart = ({
    dataKey, color, label, unit, Icon, iconColor, chartType = 'area',
  }: {
    dataKey: string; color: string; label: string; unit: string;
    Icon: React.ElementType; iconColor: string; chartType?: 'area' | 'bar';
  }) => (
    <div className="card">
      <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <span>{label}</span>
        <span className="ml-auto text-xs font-normal text-gray-600">{unit}</span>
      </h4>
      <ResponsiveContainer width="100%" height={130}>
        {chartType === 'bar' ? (
          <BarChart data={getHistory(dataKey)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="lap" tick={axStyle} interval="preserveStartEnd" />
            <YAxis tick={axStyle} />
            <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`${v} ${unit}`, label]} />
            <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        ) : (
          <AreaChart data={getHistory(dataKey)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="lap" tick={axStyle} interval="preserveStartEnd" />
            <YAxis tick={axStyle} />
            <Tooltip contentStyle={ttStyle} formatter={(v: any) => [`${v} ${unit}`, label]} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
              fill={`url(#g-${dataKey})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );

  // BEFORE RACE
  if (raceStatus === 'before') {
    const targetMs = nextRaceMsRef.current > Date.now() ? nextRaceMsRef.current : getNextRaceStartMs();
    return (
      <div className="min-h-screen bg-dark-950 p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-12">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-racing-red to-red-600 flex items-center justify-center">
              <Calendar className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">NEXT RACE</h1>
            {nextRaceName && <p className="text-xl text-racing-red font-bold mb-4">{nextRaceName}</p>}
            <p className="text-lg text-gray-400 mb-4">Starts in:</p>
            <div className="text-6xl font-black text-racing-red mb-6 font-mono tracking-wider">
              {countdown || '00:00:00'}
            </div>
            <p className="text-gray-400">
              {new Date(targetMs).toLocaleDateString('en-IN', {
                weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata',
              })} at 5:00 PM IST
            </p>
            <p className="mt-6 text-sm text-gray-500">
              Race starts automatically • Same for all users simultaneously
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // RACE FINISHED
  if (raceStatus === 'finished') {
    const nextMs   = nextRaceMsRef.current > Date.now() ? nextRaceMsRef.current : getNextRaceStartMs();
    const nextDate = new Date(nextMs);
    return (
      <div className="min-h-screen bg-dark-950 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Flag className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-black text-white">RACE FINISHED</h1>
              <Flag className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
              {/* 30-min results window */}
              {postRaceLeft && postRaceLeft !== '00:00:00' && (
                <div className="card inline-block px-6 py-3 bg-yellow-500/10 border-yellow-500/30">
                  <p className="text-yellow-400 text-xs font-bold mb-1">⏱ RESULTS AVAILABLE FOR</p>
                  <div className="text-3xl font-black text-yellow-400 font-mono">{postRaceLeft}</div>
                </div>
              )}
              {/* Next race countdown */}
              <div className="card inline-block px-6 py-3">
                <p className="text-gray-400 text-xs mb-1">Next Race in:</p>
                <div className="text-3xl font-black text-racing-red font-mono">
                  {countdown || '00:00:00'}
                </div>
                {nextRaceName && (
                  <p className="text-gray-400 text-xs mt-1">
                    {nextRaceName} •{' '}
                    {nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} at 5:00 PM IST
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {finalStandings.length > 0 && (
            <>
              {/* Podium */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[finalStandings[1], finalStandings[0], finalStandings[2]].map((r, idx) => {
                  if (!r) return <div key={idx} />;
                  const medals = ['🥈', '🏆', '🥉'];
                  const isW    = idx === 1;
                  return (
                    <motion.div key={r.driverId}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.15 }}
                      className={`card text-center ${isW ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/40' : 'mt-8'}`}
                    >
                      <div className={`text-${isW ? '5' : '4'}xl mb-2`}>{medals[idx]}</div>
                      {r.photo && <img src={r.photo} alt={r.driverName} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-racing-red" />}
                      <p className={`font-black ${isW ? 'text-yellow-400 text-xl' : 'text-white'}`}>{r.driverName}</p>
                      <p className="text-gray-400 text-sm">{r.team}</p>
                      {isW && <p className="text-yellow-400 text-xs font-bold mt-1">WINNER</p>}
                      <p className="text-gray-400 text-xs mt-1">{r.timeGap}</p>
                      <p className={`text-sm font-bold mt-2 ${r.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {r.priceChange >= 0 ? '+' : ''}{r.priceChange}% → ${r.finalPrice?.toLocaleString()}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Full leaderboard */}
              <div className="card">
                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Final Race Standings & Price Changes
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {['Pos', 'Driver', 'Team', 'Gap', 'Pts', 'Price Δ', 'New Price'].map(h => (
                          <th key={h} className={`py-2 px-3 text-gray-400 ${['Pos','Driver','Team'].includes(h) ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {finalStandings.map((r: any) => (
                        <tr key={r.driverId} className={`border-b border-gray-800/50 ${r.position <= 3 ? 'bg-yellow-500/5' : ''}`}>
                          <td className="py-2 px-3">
                            <span className={`font-black ${r.position===1?'text-yellow-400':r.position===2?'text-gray-300':r.position===3?'text-amber-600':'text-white'}`}>
                              P{r.position}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              {r.photo && <img src={r.photo} alt={r.driverName} className="w-6 h-6 rounded-full object-cover" />}
                              <span className="text-white font-semibold">{r.driverName}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-gray-400 text-xs">{r.team}</td>
                          <td className="py-2 px-3 text-right text-gray-400 font-mono text-xs">{r.timeGap}</td>
                          <td className="py-2 px-3 text-right">
                            {r.points > 0 ? <span className="text-blue-400 font-bold">+{r.points}</span> : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className={`font-bold ${r.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {r.priceChange >= 0 ? '+' : ''}{r.priceChange}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-white font-bold">${r.finalPrice?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // AFTER SEASON
  if (raceStatus === 'after') {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-12 text-center max-w-2xl w-full">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <Flag className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4">SEASON COMPLETE</h1>
          <p className="text-xl text-gray-400">The 2026 season has ended. All 26 races completed!</p>
        </motion.div>
      </div>
    );
  }

  // LIVE RACE
  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-6 lg:p-8">
      {/* Live ticker */}
      <div className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md border-b border-racing-red/30 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-4 overflow-hidden">
          <div className="flex items-center gap-2 text-red-500 font-bold shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>LIVE</span>
          </div>
          <div className="flex gap-6 overflow-x-auto whitespace-nowrap">
            {raceUpdates.map((u, i) => <span key={i} className="text-white font-medium text-sm">{u} •</span>)}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-white"><span className="text-red-500">LIVE</span> Race</h1>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-full animate-pulse">
            <Radio className="w-5 h-5 text-white" />
            <span className="text-white font-bold">LIVE</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-gradient-to-br from-red-600 to-red-800 text-white">
            <div className="flex items-center gap-3">
              <Flag className="w-8 h-8" />
              <div><p className="text-sm">Current Lap</p><p className="text-2xl font-bold">Lap {raceState.currentLap} / {TOTAL_LAPS}</p></div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-red-500" />
              <div><p className="text-sm text-gray-400">Race Time</p><p className="text-xl font-bold text-white">{raceTime}</p></div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-500" />
              <div><p className="text-sm text-gray-400">Leader</p><p className="text-xl font-bold text-white">{raceState.positions[0]?.name || '—'}</p></div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div><p className="text-sm text-gray-400">Fastest Lap</p><p className="text-xl font-bold text-white">1:32.456</p></div>
            </div>
          </div>
        </div>

        {/* Driver telemetry panel */}
        {selectedDriver ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card lg:col-span-1">
              <div className="flex items-center gap-4 mb-4">
                <img src={selectedDriver.photo} alt={selectedDriver.name} className="w-16 h-16 rounded-full object-cover border-2 border-racing-red" />
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedDriver.name}</h3>
                  <p className="text-gray-400 text-sm">{selectedDriver.team}</p>
                  <p className="text-sm text-yellow-400 font-bold">P{selectedDriver.position}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {([
                  ['Speed',      `${selectedDriver.speed} km/h`,                '#3B82F6'],
                  ['RPM',        `${(selectedDriver.rpm||0).toLocaleString()}`,  '#F59E0B'],
                  ['Throttle',   `${selectedDriver.throttle}%`,                 '#10B981'],
                  ['Brake',      `${selectedDriver.brake}%`,                    '#EF4444'],
                  ['Gear',       `${selectedDriver.gear}`,                      '#8B5CF6'],
                  ['Tyre Wear',  `${Math.round(selectedDriver.tyreWear||0)}%`,  '#F97316'],
                  ['Fuel',       `${Math.round(selectedDriver.fuel||0)} kg`,    '#06B6D4'],
                  ['Tyre Temp',  `${selectedDriver.tyreTemp}°C`,                '#F97316'],
                  ['Engine Tmp', `${selectedDriver.engineTemp}°C`,              '#EC4899'],
                  ['Accel',      `${selectedDriver.acceleration} m/s²`,         '#A78BFA'],
                ] as [string,string,string][]).map(([l, v, c]) => (
                  <div key={l} className="bg-dark-800/60 p-2 rounded-lg border border-gray-800">
                    <p className="text-gray-500 text-xs">{l}</p>
                    <p className="font-bold text-sm" style={{ color: c }}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setTradeMode('buy'); setShowTradeModal(true); }} className="btn-primary flex-1 text-sm py-2">Buy</button>
                <button onClick={() => { setTradeMode('sell'); setShowTradeModal(true); }} className="btn-secondary flex-1 text-sm py-2">Sell</button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex gap-2 mb-4">
                {(['telemetry', 'graphs'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition ${activeTab === tab ? 'bg-racing-red text-white' : 'bg-dark-800 text-gray-400 hover:text-white'}`}>
                    {tab === 'telemetry' ? '📊 Speed / Throttle / Fuel' : '📈 Accel / Brake / Gear'}
                  </button>
                ))}
              </div>
              {activeTab === 'telemetry' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TelChart dataKey="speed"      color="#3B82F6" label="Speed"       unit="km/h" Icon={Gauge}       iconColor="#3B82F6" />
                  <TelChart dataKey="throttle"   color="#10B981" label="Throttle"    unit="%"    Icon={TrendingUp}  iconColor="#10B981" />
                  <TelChart dataKey="fuel"       color="#06B6D4" label="Fuel"        unit="kg"   Icon={Battery}     iconColor="#06B6D4" />
                  <TelChart dataKey="tyreTemp"   color="#F97316" label="Tyre Temp"   unit="°C"   Icon={Thermometer} iconColor="#F97316" />
                  <TelChart dataKey="engineTemp" color="#EC4899" label="Engine Temp" unit="°C"   Icon={Wind}        iconColor="#EC4899" />
                  <TelChart dataKey="rpm"        color="#F59E0B" label="RPM"         unit="rpm"  Icon={Zap}         iconColor="#F59E0B" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TelChart dataKey="acceleration" color="#A78BFA" label="Acceleration" unit="m/s²" Icon={Gauge}        iconColor="#A78BFA" />
                  <TelChart dataKey="brake"        color="#EF4444" label="Braking"      unit="%"    Icon={TrendingDown} iconColor="#EF4444" />
                  <TelChart dataKey="gear"         color="#F59E0B" label="Gear Shifts"  unit="gear" Icon={Zap}         iconColor="#F59E0B" chartType="bar" />
                  <TelChart dataKey="throttle"     color="#10B981" label="Throttle"     unit="%"    Icon={TrendingUp}  iconColor="#10B981" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card mb-6 text-center py-5 border-dashed border-gray-700">
            <p className="text-gray-400 text-sm">👇 Click any driver below to see live telemetry & graphs</p>
          </div>
        )}

        {/* Live standings */}
        <div className="card overflow-x-auto mb-8">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-racing-red" /> Live Standings
          </h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-800">
                {['Pos', 'Driver', 'Gap', 'Speed', 'Tyre', 'Fuel', 'Stops', 'Price'].map(h => (
                  <th key={h} className="p-3 text-gray-400 text-sm text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {raceState.positions.map((d: any, i: number) => (
                <motion.tr key={d.id} layout animate={{ opacity: 1 }}
                  className={`border-b border-dark-800 cursor-pointer hover:bg-dark-800/50 transition-all ${selectedDriver?.id === d.id ? 'bg-racing-red/20' : ''}`}
                  onClick={() => setSelectedDriver(d)}
                >
                  <td className="p-3">
                    <span className={`font-black text-lg ${i===0?'text-yellow-400':i===1?'text-gray-300':i===2?'text-amber-600':'text-white'}`}>P{d.position}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {d.photo && <img src={d.photo} alt={d.name} className="w-8 h-8 rounded-full object-cover border border-gray-700" />}
                      <div><p className="text-white font-semibold text-sm">{d.name}</p><p className="text-gray-500 text-xs">{d.team}</p></div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-300 font-mono text-sm">{d.gap}</td>
                  <td className="p-3 text-white text-sm">{Math.round(d.speed || 0)} km/h</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-gray-800 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{
                          width: `${Math.round(d.tyreWear || 0)}%`,
                          backgroundColor: d.tyreWear > 50 ? '#10B981' : d.tyreWear > 25 ? '#F59E0B' : '#EF4444',
                        }} />
                      </div>
                      <span className="text-xs text-gray-400">{Math.round(d.tyreWear || 0)}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-white text-sm">{Math.round(d.fuel || 0)} kg</td>
                  <td className="p-3 text-center">
                    {(d.pitstops || 0) > 0
                      ? <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">{d.pitstops}×</span>
                      : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="p-3 text-white font-bold">${Math.round(d.price || 0)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trade modal */}
        <AnimatePresence>
          {showTradeModal && selectedDriver && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => !loading && setShowTradeModal(false)}
            >
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="card max-w-md w-full" onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img src={selectedDriver.photo} alt={selectedDriver.name} className="w-16 h-16 rounded-full object-cover border-4 border-racing-red" />
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase">{selectedDriver.name}</h2>
                      <p className="text-gray-400">{selectedDriver.team}</p>
                    </div>
                  </div>
                  <button onClick={() => !loading && setShowTradeModal(false)} className="text-gray-400"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex mb-6 bg-dark-800 rounded-lg p-1">
                  {(['buy', 'sell'] as const).map(m => (
                    <button key={m} onClick={() => setTradeMode(m)}
                      className={`flex-1 py-2 px-4 rounded-md font-bold uppercase text-sm ${tradeMode===m?(m==='buy'?'bg-green-500':'bg-red-500')+' text-white':'text-gray-400'}`}>
                      {m === 'buy' ? 'Buy' : 'Sell'}
                    </button>
                  ))}
                </div>
                <div className="mb-6">
                  <div className="flex justify-between mb-4 p-4 bg-dark-800/50 rounded-lg">
                    <div><p className="text-gray-400 text-sm">Price per share</p><p className="text-3xl font-black text-white">${Math.round(selectedDriver.price || 0)}</p></div>
                    <div className="text-right"><p className="text-gray-400 text-sm">Balance</p><p className="text-xl font-bold text-green-400">${(user?.balance || 0).toLocaleString()}</p></div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-3">Shares</label>
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => setShares(p => Math.max(1, p - 1))} className="w-12 h-12 rounded-xl bg-red-600 text-white text-2xl font-black">−</button>
                      <div className="w-20 h-12 flex items-center justify-center bg-black/60 border border-red-600/40 rounded-xl text-2xl font-bold text-white">{shares}</div>
                      <button onClick={() => setShares(p => p + 1)} className="w-12 h-12 rounded-xl bg-red-600 text-white text-2xl font-black">+</button>
                    </div>
                  </div>
                  <div className="bg-racing-red/10 border border-racing-red/30 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total {tradeMode === 'buy' ? 'Cost' : 'Value'}</span>
                      <span className="text-white font-black text-lg">${((selectedDriver.price || 0) * shares).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowTradeModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={tradeMode === 'buy' ? handleBuy : handleSell}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold ${tradeMode === 'buy' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                    {tradeMode === 'buy' ? 'Buy Now' : 'Sell Now'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-4 right-4">
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Synced • All users see same data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveRace;
