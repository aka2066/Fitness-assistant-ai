/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createMealLog = /* GraphQL */ `mutation CreateMealLog(
  $condition: ModelMealLogConditionInput
  $input: CreateMealLogInput!
) {
  createMealLog(condition: $condition, input: $input) {
    calories
    createdAt
    date
    foods
    id
    notes
    owner
    type
    updatedAt
    userId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateMealLogMutationVariables,
  APITypes.CreateMealLogMutation
>;
export const createUserProfile = /* GraphQL */ `mutation CreateUserProfile(
  $condition: ModelUserProfileConditionInput
  $input: CreateUserProfileInput!
) {
  createUserProfile(condition: $condition, input: $input) {
    activityLevel
    age
    createdAt
    dietaryRestrictions
    fitnessGoals
    heightFeet
    heightInches
    id
    name
    owner
    updatedAt
    userId
    weight
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUserProfileMutationVariables,
  APITypes.CreateUserProfileMutation
>;
export const createWorkoutLog = /* GraphQL */ `mutation CreateWorkoutLog(
  $condition: ModelWorkoutLogConditionInput
  $input: CreateWorkoutLogInput!
) {
  createWorkoutLog(condition: $condition, input: $input) {
    calories
    createdAt
    date
    duration
    exercises
    id
    notes
    owner
    type
    updatedAt
    userId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateWorkoutLogMutationVariables,
  APITypes.CreateWorkoutLogMutation
>;
export const deleteMealLog = /* GraphQL */ `mutation DeleteMealLog(
  $condition: ModelMealLogConditionInput
  $input: DeleteMealLogInput!
) {
  deleteMealLog(condition: $condition, input: $input) {
    calories
    createdAt
    date
    foods
    id
    notes
    owner
    type
    updatedAt
    userId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteMealLogMutationVariables,
  APITypes.DeleteMealLogMutation
>;
export const deleteUserProfile = /* GraphQL */ `mutation DeleteUserProfile(
  $condition: ModelUserProfileConditionInput
  $input: DeleteUserProfileInput!
) {
  deleteUserProfile(condition: $condition, input: $input) {
    activityLevel
    age
    createdAt
    dietaryRestrictions
    fitnessGoals
    heightFeet
    heightInches
    id
    name
    owner
    updatedAt
    userId
    weight
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUserProfileMutationVariables,
  APITypes.DeleteUserProfileMutation
>;
export const deleteWorkoutLog = /* GraphQL */ `mutation DeleteWorkoutLog(
  $condition: ModelWorkoutLogConditionInput
  $input: DeleteWorkoutLogInput!
) {
  deleteWorkoutLog(condition: $condition, input: $input) {
    calories
    createdAt
    date
    duration
    exercises
    id
    notes
    owner
    type
    updatedAt
    userId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteWorkoutLogMutationVariables,
  APITypes.DeleteWorkoutLogMutation
>;
export const updateMealLog = /* GraphQL */ `mutation UpdateMealLog(
  $condition: ModelMealLogConditionInput
  $input: UpdateMealLogInput!
) {
  updateMealLog(condition: $condition, input: $input) {
    calories
    createdAt
    date
    foods
    id
    notes
    owner
    type
    updatedAt
    userId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateMealLogMutationVariables,
  APITypes.UpdateMealLogMutation
>;
export const updateUserProfile = /* GraphQL */ `mutation UpdateUserProfile(
  $condition: ModelUserProfileConditionInput
  $input: UpdateUserProfileInput!
) {
  updateUserProfile(condition: $condition, input: $input) {
    activityLevel
    age
    createdAt
    dietaryRestrictions
    fitnessGoals
    heightFeet
    heightInches
    id
    name
    owner
    updatedAt
    userId
    weight
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUserProfileMutationVariables,
  APITypes.UpdateUserProfileMutation
>;
export const updateWorkoutLog = /* GraphQL */ `mutation UpdateWorkoutLog(
  $condition: ModelWorkoutLogConditionInput
  $input: UpdateWorkoutLogInput!
) {
  updateWorkoutLog(condition: $condition, input: $input) {
    calories
    createdAt
    date
    duration
    exercises
    id
    notes
    owner
    type
    updatedAt
    userId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateWorkoutLogMutationVariables,
  APITypes.UpdateWorkoutLogMutation
>;
