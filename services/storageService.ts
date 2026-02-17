import { BodyMeasurement, WorkoutLog, MealLog, WaterLog, UserProfile } from '../types';

const KEYS = {
  MEASUREMENTS: 'fitveda_measurements',
  WORKOUTS: 'fitveda_workouts',
  MEALS: 'fitveda_meals',
  WATER: 'fitveda_water',
  PROFILE: 'fitveda_profile',
};

// Helper to simulate delay for "network" feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Profile ---
export const getProfile = (): UserProfile => {
  const data = localStorage.getItem(KEYS.PROFILE);
  // Default target calories set to 2000 (standard average)
  return data ? JSON.parse(data) : { name: 'User', dailyWaterGoal: 10, targetCalories: 2000 };
};

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
};

// --- Measurements ---
export const getMeasurements = (): BodyMeasurement[] => {
  const data = localStorage.getItem(KEYS.MEASUREMENTS);
  return data ? JSON.parse(data) : [];
};

export const addMeasurement = async (measurement: BodyMeasurement) => {
  await delay(300);
  const current = getMeasurements();
  // If ID exists, update it, otherwise add new
  const index = current.findIndex(m => m.id === measurement.id);
  let updated;
  if (index >= 0) {
      updated = [...current];
      updated[index] = measurement;
  } else {
      updated = [...current, measurement];
  }
  updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  localStorage.setItem(KEYS.MEASUREMENTS, JSON.stringify(updated));
  return updated;
};

export const deleteMeasurement = async (id: string) => {
    const current = getMeasurements();
    const updated = current.filter(m => m.id !== id);
    localStorage.setItem(KEYS.MEASUREMENTS, JSON.stringify(updated));
    return updated;
};

// --- Workouts ---
export const getWorkouts = (): WorkoutLog[] => {
  const data = localStorage.getItem(KEYS.WORKOUTS);
  return data ? JSON.parse(data) : [];
};

export const addWorkout = async (workout: WorkoutLog) => {
  await delay(300);
  const current = getWorkouts();
  const updated = [workout, ...current];
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(updated));
  return updated;
};

export const deleteWorkout = async (id: string) => {
    const current = getWorkouts();
    const updated = current.filter(w => w.id !== id);
    localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(updated));
    return updated;
};

// --- Meals ---
export const getMeals = (): MealLog[] => {
  const data = localStorage.getItem(KEYS.MEALS);
  return data ? JSON.parse(data) : [];
};

export const addMeal = async (meal: MealLog) => {
  await delay(500);
  const current = getMeals();
  const updated = [meal, ...current];
  localStorage.setItem(KEYS.MEALS, JSON.stringify(updated));
  return updated;
};

export const deleteMeal = async (id: string) => {
    const current = getMeals();
    const updated = current.filter(m => m.id !== id);
    localStorage.setItem(KEYS.MEALS, JSON.stringify(updated));
    return updated;
};

// --- Water ---
export const getWaterLogs = (): WaterLog[] => {
  const data = localStorage.getItem(KEYS.WATER);
  return data ? JSON.parse(data) : [];
};

export const saveWaterLog = (log: WaterLog) => {
  const current = getWaterLogs();
  const existingIndex = current.findIndex(w => w.date === log.date);
  let updated;
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = log;
  } else {
    updated = [...current, log];
  }
  localStorage.setItem(KEYS.WATER, JSON.stringify(updated));
  return updated;
};

export const getWaterForDate = (date: string): WaterLog => {
  const logs = getWaterLogs();
  const log = logs.find(l => l.date === date);
  const profile = getProfile();
  return log || { date, glasses: 0, goal: profile.dailyWaterGoal };
};