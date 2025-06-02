import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  UserProfile: a
    .model({
      id: a.id(),
      userId: a.string().required(),
      name: a.string(), // User's full name
      age: a.integer(),
      heightFeet: a.integer(), // Height in feet (5 for 5'11")
      heightInches: a.integer(), // Height in inches (11 for 5'11")
      weight: a.float(), // Weight in pounds
      fitnessGoals: a.string(), // Primary fitness goal
      activityLevel: a.string(), // Activity level description
      dietaryRestrictions: a.string(), // Dietary restrictions or allergies
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      owner: a.string(), // Required for owner-based authorization
    })
    .authorization(allow => [allow.owner()]),

  WorkoutLog: a
    .model({
      id: a.id(),
      userId: a.string().required(),
      type: a.string().required(), // e.g., "Cardio", "Strength", "Yoga"
      duration: a.integer(), // in minutes
      calories: a.integer(),
      notes: a.string(),
      exercises: a.string(), // JSON string of exercise details
      date: a.datetime().required(),
      createdAt: a.datetime(),
      owner: a.string(), // Required for owner-based authorization
    })
    .authorization(allow => [allow.owner()]),

  MealLog: a
    .model({
      id: a.id(),
      userId: a.string().required(),
      type: a.string().required(), // e.g., "Breakfast", "Lunch", "Dinner", "Snack"
      calories: a.integer(),
      notes: a.string(),
      foods: a.string(), // JSON string of food details
      date: a.datetime().required(),
      createdAt: a.datetime(),
      owner: a.string(), // Required for owner-based authorization
    })
    .authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
}); 