export interface BodyMeasurement {
  id: string;
  date: string;
  weight: number;
  height: number;
  chest?: number;
  waist?: number;
  belly?: number;
  hips?: number;
  armsLeft?: number;
  armsRight?: number;
  thighsLeft?: number;
  thighsRight?: number;
  neck?: number;
}

export interface ExerciseSet {
  reps: number;
  weight?: number; // in kg
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  durationMinutes?: number;
}

export interface WorkoutLog {
  id: string;
  date: string;
  exercises: Exercise[];
  caloriesBurned?: number;
  durationMinutes?: number;
  notes?: string;
}

export interface FoodItem {
  name: string;
  quantity: string;
  protein: number;
  calories: number;
  carbs?: number;
  fats?: number;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: 'Morning' | 'Lunch' | 'Dinner' | 'Snack';
  items: FoodItem[];
  totalProtein: number;
  totalCalories: number;
}

export interface WaterLog {
  date: string;
  glasses: number;
  goal: number;
}

export interface UserProfile {
  name: string;
  targetWeight?: number;
  targetProtein?: number;
  targetCalories: number; // Maintenance calories (BMR + sedentary activity)
  dailyWaterGoal: number;
}