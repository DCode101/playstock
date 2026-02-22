import axios from 'axios';
import { 
  Driver, 
  Race, 
  StandingsEntry, 
  OpenF1Session, 
  OpenF1Driver, 
  OpenF1Position,
  OpenF1Lap,
  RaceResult 
} from '../types';

const ERGAST_BASE_URL = 'https://ergast.com/api/f1';
const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCached = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Ergast API calls for historical data
export const fetchCurrentSeason = async (): Promise<number> => {
  const cacheKey = 'current-season';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${ERGAST_BASE_URL}/current.json`);
    const season = parseInt(response.data.MRData.RaceTable.season);
    setCache(cacheKey, season);
    return season;
  } catch (error) {
    console.error('Error fetching current season:', error);
    return new Date().getFullYear();
  }
};

export const fetchRaceSchedule = async (season: number = 2024): Promise<Race[]> => {
  const cacheKey = `schedule-${season}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${ERGAST_BASE_URL}/${season}.json`);
    const races: Race[] = response.data.MRData.RaceTable.Races.map((race: any, index: number) => ({
      round: parseInt(race.round),
      raceName: race.raceName,
      circuit: {
        circuitId: race.Circuit.circuitId,
        circuitName: race.Circuit.circuitName,
        location: race.Circuit.Location.locality,
        country: race.Circuit.Location.country,
        lat: race.Circuit.Location.lat,
        long: race.Circuit.Location.long,
      },
      date: race.date,
      time: race.time || '14:00:00Z',
      completed: new Date(`${race.date}T${race.time || '14:00:00Z'}`) < new Date(),
    }));
    
    setCache(cacheKey, races);
    return races;
  } catch (error) {
    console.error('Error fetching race schedule:', error);
    return [];
  }
};

export const fetchDriverStandings = async (season: number = 2024): Promise<StandingsEntry[]> => {
  const cacheKey = `standings-${season}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${ERGAST_BASE_URL}/${season}/driverStandings.json`);
    const standings = response.data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
    
    const result: StandingsEntry[] = standings.map((standing: any) => ({
      position: parseInt(standing.position),
      driverId: standing.Driver.driverId,
      driverNumber: parseInt(standing.Driver.permanentNumber || '0'),
      points: parseFloat(standing.points),
      wins: parseInt(standing.wins),
    }));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching driver standings:', error);
    return [];
  }
};

export const fetchRaceResults = async (season: number, round: number): Promise<RaceResult[]> => {
  const cacheKey = `results-${season}-${round}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${ERGAST_BASE_URL}/${season}/${round}/results.json`);
    const results = response.data.MRData.RaceTable.Races[0]?.Results || [];
    
    const raceResults: RaceResult[] = results.map((result: any) => ({
      position: parseInt(result.position),
      driverId: result.Driver.driverId,
      driverNumber: parseInt(result.Driver.permanentNumber || result.number),
      points: parseFloat(result.points),
      laps: parseInt(result.laps),
      time: result.Time?.time,
      status: result.status,
    }));

    setCache(cacheKey, raceResults);
    return raceResults;
  } catch (error) {
    console.error('Error fetching race results:', error);
    return [];
  }
};

// OpenF1 API calls for live data
export const fetchLatestSession = async (): Promise<OpenF1Session | null> => {
  const cacheKey = 'latest-session';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${OPENF1_BASE_URL}/sessions`, {
      params: {
        session_name: 'Race',
        year: new Date().getFullYear(),
      }
    });
    
    if (response.data && response.data.length > 0) {
      const sessions = response.data.sort((a: OpenF1Session, b: OpenF1Session) => 
        new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
      );
      setCache(cacheKey, sessions[0]);
      return sessions[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching latest session:', error);
    return null;
  }
};

export const fetchLivePositions = async (sessionKey: number): Promise<OpenF1Position[]> => {
  try {
    const response = await axios.get(`${OPENF1_BASE_URL}/position`, {
      params: {
        session_key: sessionKey,
      }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching live positions:', error);
    return [];
  }
};

export const fetchSessionLaps = async (sessionKey: number, driverNumber?: number): Promise<OpenF1Lap[]> => {
  try {
    const params: any = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    
    const response = await axios.get(`${OPENF1_BASE_URL}/laps`, { params });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching session laps:', error);
    return [];
  }
};

export const fetchDriverInfo = async (): Promise<OpenF1Driver[]> => {
  const cacheKey = 'driver-info';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const latestSession = await fetchLatestSession();
    if (!latestSession) return [];

    const response = await axios.get(`${OPENF1_BASE_URL}/drivers`, {
      params: {
        session_key: latestSession.session_key,
      }
    });
    
    setCache(cacheKey, response.data || []);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching driver info:', error);
    return [];
  }
};

// Utility function to map Ergast driver IDs to OpenF1 driver numbers
export const getDriverMapping = (): Record<string, number> => {
  return {
    'max_verstappen': 1,
    'perez': 11,
    'hamilton': 44,
    'russell': 63,
    'leclerc': 16,
    'sainz': 55,
    'norris': 4,
    'piastri': 81,
    'alonso': 14,
    'stroll': 18,
    'gasly': 10,
    'ocon': 31,
    'albon': 23,
    'sargeant': 2,
    'ricciardo': 3,
    'tsunoda': 22,
    'bottas': 77,
    'zhou': 24,
    'hulkenberg': 27,
    'magnussen': 20,
  };
};

export default {
  fetchCurrentSeason,
  fetchRaceSchedule,
  fetchDriverStandings,
  fetchRaceResults,
  fetchLatestSession,
  fetchLivePositions,
  fetchSessionLaps,
  fetchDriverInfo,
  getDriverMapping,
};
