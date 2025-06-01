// Utility functions for generating and storing embeddings

interface EmbeddingData {
  userId: string;
  type: 'profile' | 'workout' | 'meal';
  content: string;
  metadata: Record<string, any>;
}

// Generate embedding content for workouts
export const generateWorkoutEmbeddingContent = (workout: {
  type: string;
  duration?: number;
  calories?: number;
  exercises?: string;
  notes?: string;
  date: string;
}): string => {
  let content = `${workout.type} workout`;
  
  if (workout.duration) {
    content += ` for ${workout.duration} minutes`;
  }
  
  if (workout.calories) {
    content += `, burned ${workout.calories} calories`;
  }
  
  if (workout.exercises) {
    try {
      const exercisesList = JSON.parse(workout.exercises);
      if (Array.isArray(exercisesList) && exercisesList.length > 0) {
        const exerciseDescriptions = exercisesList.map((ex: any) => 
          `${ex.name || ex.exercise}: ${ex.sets || '?'} sets x ${ex.reps || '?'} reps${ex.weight ? ` @ ${ex.weight}lbs` : ''}`
        ).join(', ');
        content += `. Exercises: ${exerciseDescriptions}`;
      }
    } catch (e) {
      // If exercises is not valid JSON, just include it as text
      content += `. Exercises: ${workout.exercises}`;
    }
  }
  
  if (workout.notes) {
    content += `. Notes: ${workout.notes}`;
  }
  
  content += ` on ${workout.date}`;
  
  return content;
};

// Generate embedding content for meals
export const generateMealEmbeddingContent = (meal: {
  type: string;
  foods?: string;
  calories?: number;
  notes?: string;
  date: string;
}): string => {
  let content = `${meal.type} meal`;
  
  if (meal.calories) {
    content += ` with ${meal.calories} calories`;
  }
  
  if (meal.foods) {
    try {
      const foodsList = JSON.parse(meal.foods);
      if (Array.isArray(foodsList) && foodsList.length > 0) {
        const foodDescriptions = foodsList.map((food: any) => 
          `${food.name || food.food}: ${food.quantity || '?'} ${food.unit || 'serving'}${food.calories ? ` (${food.calories} cal)` : ''}`
        ).join(', ');
        content += `. Foods: ${foodDescriptions}`;
      }
    } catch (e) {
      // If foods is not valid JSON, just include it as text
      content += `. Foods: ${meal.foods}`;
    }
  }
  
  if (meal.notes) {
    content += `. Notes: ${meal.notes}`;
  }
  
  content += ` on ${meal.date}`;
  
  return content;
};

// Generate embedding content for user profile
export const generateProfileEmbeddingContent = (profile: {
  age?: number;
  height?: number;
  weight?: number;
  fitnessGoals?: string;
  activityLevel?: string;
  dietaryRestrictions?: string;
}): string => {
  let content = 'User profile: ';
  
  const details = [];
  
  if (profile.age) details.push(`${profile.age} years old`);
  if (profile.height) details.push(`${profile.height}cm tall`);
  if (profile.weight) details.push(`${profile.weight}kg`);
  if (profile.activityLevel) details.push(`${profile.activityLevel} activity level`);
  if (profile.fitnessGoals) details.push(`goals: ${profile.fitnessGoals}`);
  if (profile.dietaryRestrictions) details.push(`dietary restrictions: ${profile.dietaryRestrictions}`);
  
  content += details.join(', ');
  
  return content;
};

// Send data to embeddings function
export const generateAndStoreEmbedding = async (data: EmbeddingData): Promise<void> => {
  try {
    const embeddingsEndpoint = process.env.NEXT_PUBLIC_EMBEDDINGS_API_URL || 
      'https://jhf4qmbb7ff5ll5ctyujclivrm.appsync-api.us-east-1.amazonaws.com/embeddings';
    
    const response = await fetch(embeddingsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Embedding generated and stored successfully:', result);
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Don't fail the main operation if embedding fails
  }
}; 