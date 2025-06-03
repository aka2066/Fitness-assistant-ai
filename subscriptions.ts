/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateMealLog = /* GraphQL */ `subscription OnCreateMealLog(
  $filter: ModelSubscriptionMealLogFilterInput
  $owner: String
) {
  onCreateMealLog(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateMealLogSubscriptionVariables,
  APITypes.OnCreateMealLogSubscription
>;
export const onCreateUserProfile = /* GraphQL */ `subscription OnCreateUserProfile(
  $filter: ModelSubscriptionUserProfileFilterInput
  $owner: String
) {
  onCreateUserProfile(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserProfileSubscriptionVariables,
  APITypes.OnCreateUserProfileSubscription
>;
export const onCreateWorkoutLog = /* GraphQL */ `subscription OnCreateWorkoutLog(
  $filter: ModelSubscriptionWorkoutLogFilterInput
  $owner: String
) {
  onCreateWorkoutLog(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateWorkoutLogSubscriptionVariables,
  APITypes.OnCreateWorkoutLogSubscription
>;
export const onDeleteMealLog = /* GraphQL */ `subscription OnDeleteMealLog(
  $filter: ModelSubscriptionMealLogFilterInput
  $owner: String
) {
  onDeleteMealLog(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteMealLogSubscriptionVariables,
  APITypes.OnDeleteMealLogSubscription
>;
export const onDeleteUserProfile = /* GraphQL */ `subscription OnDeleteUserProfile(
  $filter: ModelSubscriptionUserProfileFilterInput
  $owner: String
) {
  onDeleteUserProfile(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserProfileSubscriptionVariables,
  APITypes.OnDeleteUserProfileSubscription
>;
export const onDeleteWorkoutLog = /* GraphQL */ `subscription OnDeleteWorkoutLog(
  $filter: ModelSubscriptionWorkoutLogFilterInput
  $owner: String
) {
  onDeleteWorkoutLog(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteWorkoutLogSubscriptionVariables,
  APITypes.OnDeleteWorkoutLogSubscription
>;
export const onUpdateMealLog = /* GraphQL */ `subscription OnUpdateMealLog(
  $filter: ModelSubscriptionMealLogFilterInput
  $owner: String
) {
  onUpdateMealLog(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateMealLogSubscriptionVariables,
  APITypes.OnUpdateMealLogSubscription
>;
export const onUpdateUserProfile = /* GraphQL */ `subscription OnUpdateUserProfile(
  $filter: ModelSubscriptionUserProfileFilterInput
  $owner: String
) {
  onUpdateUserProfile(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserProfileSubscriptionVariables,
  APITypes.OnUpdateUserProfileSubscription
>;
export const onUpdateWorkoutLog = /* GraphQL */ `subscription OnUpdateWorkoutLog(
  $filter: ModelSubscriptionWorkoutLogFilterInput
  $owner: String
) {
  onUpdateWorkoutLog(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateWorkoutLogSubscriptionVariables,
  APITypes.OnUpdateWorkoutLogSubscription
>;
