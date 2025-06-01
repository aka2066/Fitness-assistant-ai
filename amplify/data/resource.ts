import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  UserProfile: a
    .model({
      id: a.id(),
      userId: a.string().required(),
      age: a.integer(),
      height: a.float(), // in cm
      weight: a.float(), // in kg
      fitnessGoals: a.string(),
      activityLevel: a.string(),
      dietaryRestrictions: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization(allow => [allow.owner().to(['create', 'read', 'update', 'delete'])]),

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
    })
    .authorization(allow => [allow.owner().to(['create', 'read', 'update', 'delete'])]),

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
    })
    .authorization(allow => [allow.owner().to(['create', 'read', 'update', 'delete'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
}); 