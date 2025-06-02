// Simple local storage utility for development
// This will be replaced with real Amplify/DynamoDB calls once backend is deployed

export interface UserProfile {
  id?: string;
  userId: string;
  age?: number;
  height?: number;
  weight?: number;
  fitnessGoals?: string;
  activityLevel?: string;
  dietaryRestrictions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutLog {
  id?: string;
  userId: string;
  type: string;
  duration?: number;
  calories?: number;
  notes?: string;
  exercises?: string;
  date: string;
  createdAt?: string;
}

export interface MealLog {
  id?: string;
  userId: string;
  type: string;
  calories?: number;
  notes?: string;
  foods?: string;
  date: string;
  createdAt?: string;
}

// User Profile Operations
export const profileStorage = {
  get: (userId: string): UserProfile | null => {
    const profiles = JSON.parse(localStorage.getItem('fitness_profiles') || '{}');
    return profiles[userId] || null;
  },

  save: (profile: UserProfile): UserProfile => {
    const profiles = JSON.parse(localStorage.getItem('fitness_profiles') || '{}');
    const now = new Date().toISOString();
    
    const savedProfile = {
      ...profile,
      id: profile.id || `profile_${Date.now()}`,
      updatedAt: now,
      createdAt: profile.createdAt || now,
    };
    
    profiles[profile.userId] = savedProfile;
    localStorage.setItem('fitness_profiles', JSON.stringify(profiles));
    return savedProfile;
  },
};

// Workout Log Operations
export const workoutStorage = {
  getAll: (userId: string): WorkoutLog[] => {
    const workouts = JSON.parse(localStorage.getItem('fitness_workouts') || '[]');
    return workouts.filter((w: WorkoutLog) => w.userId === userId);
  },

  save: (workout: WorkoutLog): WorkoutLog => {
    const workouts = JSON.parse(localStorage.getItem('fitness_workouts') || '[]');
    const now = new Date().toISOString();
    
    const savedWorkout = {
      ...workout,
      id: workout.id || `workout_${Date.now()}`,
      createdAt: now,
    };
    
    workouts.push(savedWorkout);
    localStorage.setItem('fitness_workouts', JSON.stringify(workouts));
    return savedWorkout;
  },
};

// Meal Log Operations
export const mealStorage = {
  getAll: (userId: string): MealLog[] => {
    const meals = JSON.parse(localStorage.getItem('fitness_meals') || '[]');
    return meals.filter((m: MealLog) => m.userId === userId);
  },

  save: (meal: MealLog): MealLog => {
    const meals = JSON.parse(localStorage.getItem('fitness_meals') || '[]');
    const now = new Date().toISOString();
    
    const savedMeal = {
      ...meal,
      id: meal.id || `meal_${Date.now()}`,
      createdAt: now,
    };
    
    meals.push(savedMeal);
    localStorage.setItem('fitness_meals', JSON.stringify(meals));
    return savedMeal;
  },
}; 