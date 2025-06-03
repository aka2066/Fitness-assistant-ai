/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getMealLog = /* GraphQL */ `query GetMealLog($id: ID!) {
  getMealLog(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetMealLogQueryVariables,
  APITypes.GetMealLogQuery
>;
export const getUserProfile = /* GraphQL */ `query GetUserProfile($id: ID!) {
  getUserProfile(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetUserProfileQueryVariables,
  APITypes.GetUserProfileQuery
>;
export const getWorkoutLog = /* GraphQL */ `query GetWorkoutLog($id: ID!) {
  getWorkoutLog(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetWorkoutLogQueryVariables,
  APITypes.GetWorkoutLogQuery
>;
export const listMealLogs = /* GraphQL */ `query ListMealLogs(
  $filter: ModelMealLogFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listMealLogs(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListMealLogsQueryVariables,
  APITypes.ListMealLogsQuery
>;
export const listUserProfiles = /* GraphQL */ `query ListUserProfiles(
  $filter: ModelUserProfileFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listUserProfiles(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListUserProfilesQueryVariables,
  APITypes.ListUserProfilesQuery
>;
export const listWorkoutLogs = /* GraphQL */ `query ListWorkoutLogs(
  $filter: ModelWorkoutLogFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listWorkoutLogs(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListWorkoutLogsQueryVariables,
  APITypes.ListWorkoutLogsQuery
>;
