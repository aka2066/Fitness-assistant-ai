/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type MealLog = {
  __typename: "MealLog",
  calories?: number | null,
  createdAt?: string | null,
  date: string,
  foods?: string | null,
  id: string,
  notes?: string | null,
  owner?: string | null,
  type: string,
  updatedAt: string,
  userId: string,
};

export type UserProfile = {
  __typename: "UserProfile",
  activityLevel?: string | null,
  age?: number | null,
  createdAt?: string | null,
  dietaryRestrictions?: string | null,
  fitnessGoals?: string | null,
  heightFeet?: number | null,
  heightInches?: number | null,
  id: string,
  name?: string | null,
  owner?: string | null,
  updatedAt?: string | null,
  userId: string,
  weight?: number | null,
};

export type WorkoutLog = {
  __typename: "WorkoutLog",
  calories?: number | null,
  createdAt?: string | null,
  date: string,
  duration?: number | null,
  exercises?: string | null,
  id: string,
  notes?: string | null,
  owner?: string | null,
  type: string,
  updatedAt: string,
  userId: string,
};

export type ModelMealLogFilterInput = {
  and?: Array< ModelMealLogFilterInput | null > | null,
  calories?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  date?: ModelStringInput | null,
  foods?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelMealLogFilterInput | null,
  notes?: ModelStringInput | null,
  or?: Array< ModelMealLogFilterInput | null > | null,
  owner?: ModelStringInput | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type ModelIntInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelMealLogConnection = {
  __typename: "ModelMealLogConnection",
  items:  Array<MealLog | null >,
  nextToken?: string | null,
};

export type ModelUserProfileFilterInput = {
  activityLevel?: ModelStringInput | null,
  age?: ModelIntInput | null,
  and?: Array< ModelUserProfileFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  dietaryRestrictions?: ModelStringInput | null,
  fitnessGoals?: ModelStringInput | null,
  heightFeet?: ModelIntInput | null,
  heightInches?: ModelIntInput | null,
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  not?: ModelUserProfileFilterInput | null,
  or?: Array< ModelUserProfileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
  weight?: ModelFloatInput | null,
};

export type ModelFloatInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelUserProfileConnection = {
  __typename: "ModelUserProfileConnection",
  items:  Array<UserProfile | null >,
  nextToken?: string | null,
};

export type ModelWorkoutLogFilterInput = {
  and?: Array< ModelWorkoutLogFilterInput | null > | null,
  calories?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  date?: ModelStringInput | null,
  duration?: ModelIntInput | null,
  exercises?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelWorkoutLogFilterInput | null,
  notes?: ModelStringInput | null,
  or?: Array< ModelWorkoutLogFilterInput | null > | null,
  owner?: ModelStringInput | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type ModelWorkoutLogConnection = {
  __typename: "ModelWorkoutLogConnection",
  items:  Array<WorkoutLog | null >,
  nextToken?: string | null,
};

export type ModelMealLogConditionInput = {
  and?: Array< ModelMealLogConditionInput | null > | null,
  calories?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  date?: ModelStringInput | null,
  foods?: ModelStringInput | null,
  not?: ModelMealLogConditionInput | null,
  notes?: ModelStringInput | null,
  or?: Array< ModelMealLogConditionInput | null > | null,
  owner?: ModelStringInput | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type CreateMealLogInput = {
  calories?: number | null,
  createdAt?: string | null,
  date: string,
  foods?: string | null,
  id?: string | null,
  notes?: string | null,
  owner?: string | null,
  type: string,
  userId: string,
};

export type ModelUserProfileConditionInput = {
  activityLevel?: ModelStringInput | null,
  age?: ModelIntInput | null,
  and?: Array< ModelUserProfileConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  dietaryRestrictions?: ModelStringInput | null,
  fitnessGoals?: ModelStringInput | null,
  heightFeet?: ModelIntInput | null,
  heightInches?: ModelIntInput | null,
  name?: ModelStringInput | null,
  not?: ModelUserProfileConditionInput | null,
  or?: Array< ModelUserProfileConditionInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
  weight?: ModelFloatInput | null,
};

export type CreateUserProfileInput = {
  activityLevel?: string | null,
  age?: number | null,
  createdAt?: string | null,
  dietaryRestrictions?: string | null,
  fitnessGoals?: string | null,
  heightFeet?: number | null,
  heightInches?: number | null,
  id?: string | null,
  name?: string | null,
  owner?: string | null,
  updatedAt?: string | null,
  userId: string,
  weight?: number | null,
};

export type ModelWorkoutLogConditionInput = {
  and?: Array< ModelWorkoutLogConditionInput | null > | null,
  calories?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  date?: ModelStringInput | null,
  duration?: ModelIntInput | null,
  exercises?: ModelStringInput | null,
  not?: ModelWorkoutLogConditionInput | null,
  notes?: ModelStringInput | null,
  or?: Array< ModelWorkoutLogConditionInput | null > | null,
  owner?: ModelStringInput | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
};

export type CreateWorkoutLogInput = {
  calories?: number | null,
  createdAt?: string | null,
  date: string,
  duration?: number | null,
  exercises?: string | null,
  id?: string | null,
  notes?: string | null,
  owner?: string | null,
  type: string,
  userId: string,
};

export type DeleteMealLogInput = {
  id: string,
};

export type DeleteUserProfileInput = {
  id: string,
};

export type DeleteWorkoutLogInput = {
  id: string,
};

export type UpdateMealLogInput = {
  calories?: number | null,
  createdAt?: string | null,
  date?: string | null,
  foods?: string | null,
  id: string,
  notes?: string | null,
  owner?: string | null,
  type?: string | null,
  userId?: string | null,
};

export type UpdateUserProfileInput = {
  activityLevel?: string | null,
  age?: number | null,
  createdAt?: string | null,
  dietaryRestrictions?: string | null,
  fitnessGoals?: string | null,
  heightFeet?: number | null,
  heightInches?: number | null,
  id: string,
  name?: string | null,
  owner?: string | null,
  updatedAt?: string | null,
  userId?: string | null,
  weight?: number | null,
};

export type UpdateWorkoutLogInput = {
  calories?: number | null,
  createdAt?: string | null,
  date?: string | null,
  duration?: number | null,
  exercises?: string | null,
  id: string,
  notes?: string | null,
  owner?: string | null,
  type?: string | null,
  userId?: string | null,
};

export type ModelSubscriptionMealLogFilterInput = {
  and?: Array< ModelSubscriptionMealLogFilterInput | null > | null,
  calories?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  date?: ModelSubscriptionStringInput | null,
  foods?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  notes?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionMealLogFilterInput | null > | null,
  owner?: ModelStringInput | null,
  type?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionIntInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionUserProfileFilterInput = {
  activityLevel?: ModelSubscriptionStringInput | null,
  age?: ModelSubscriptionIntInput | null,
  and?: Array< ModelSubscriptionUserProfileFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  dietaryRestrictions?: ModelSubscriptionStringInput | null,
  fitnessGoals?: ModelSubscriptionStringInput | null,
  heightFeet?: ModelSubscriptionIntInput | null,
  heightInches?: ModelSubscriptionIntInput | null,
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionUserProfileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
  weight?: ModelSubscriptionFloatInput | null,
};

export type ModelSubscriptionFloatInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionWorkoutLogFilterInput = {
  and?: Array< ModelSubscriptionWorkoutLogFilterInput | null > | null,
  calories?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  date?: ModelSubscriptionStringInput | null,
  duration?: ModelSubscriptionIntInput | null,
  exercises?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  notes?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionWorkoutLogFilterInput | null > | null,
  owner?: ModelStringInput | null,
  type?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
};

export type GetMealLogQueryVariables = {
  id: string,
};

export type GetMealLogQuery = {
  getMealLog?:  {
    __typename: "MealLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    foods?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type GetUserProfileQueryVariables = {
  id: string,
};

export type GetUserProfileQuery = {
  getUserProfile?:  {
    __typename: "UserProfile",
    activityLevel?: string | null,
    age?: number | null,
    createdAt?: string | null,
    dietaryRestrictions?: string | null,
    fitnessGoals?: string | null,
    heightFeet?: number | null,
    heightInches?: number | null,
    id: string,
    name?: string | null,
    owner?: string | null,
    updatedAt?: string | null,
    userId: string,
    weight?: number | null,
  } | null,
};

export type GetWorkoutLogQueryVariables = {
  id: string,
};

export type GetWorkoutLogQuery = {
  getWorkoutLog?:  {
    __typename: "WorkoutLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    duration?: number | null,
    exercises?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type ListMealLogsQueryVariables = {
  filter?: ModelMealLogFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListMealLogsQuery = {
  listMealLogs?:  {
    __typename: "ModelMealLogConnection",
    items:  Array< {
      __typename: "MealLog",
      calories?: number | null,
      createdAt?: string | null,
      date: string,
      foods?: string | null,
      id: string,
      notes?: string | null,
      owner?: string | null,
      type: string,
      updatedAt: string,
      userId: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListUserProfilesQueryVariables = {
  filter?: ModelUserProfileFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListUserProfilesQuery = {
  listUserProfiles?:  {
    __typename: "ModelUserProfileConnection",
    items:  Array< {
      __typename: "UserProfile",
      activityLevel?: string | null,
      age?: number | null,
      createdAt?: string | null,
      dietaryRestrictions?: string | null,
      fitnessGoals?: string | null,
      heightFeet?: number | null,
      heightInches?: number | null,
      id: string,
      name?: string | null,
      owner?: string | null,
      updatedAt?: string | null,
      userId: string,
      weight?: number | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListWorkoutLogsQueryVariables = {
  filter?: ModelWorkoutLogFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListWorkoutLogsQuery = {
  listWorkoutLogs?:  {
    __typename: "ModelWorkoutLogConnection",
    items:  Array< {
      __typename: "WorkoutLog",
      calories?: number | null,
      createdAt?: string | null,
      date: string,
      duration?: number | null,
      exercises?: string | null,
      id: string,
      notes?: string | null,
      owner?: string | null,
      type: string,
      updatedAt: string,
      userId: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type CreateMealLogMutationVariables = {
  condition?: ModelMealLogConditionInput | null,
  input: CreateMealLogInput,
};

export type CreateMealLogMutation = {
  createMealLog?:  {
    __typename: "MealLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    foods?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type CreateUserProfileMutationVariables = {
  condition?: ModelUserProfileConditionInput | null,
  input: CreateUserProfileInput,
};

export type CreateUserProfileMutation = {
  createUserProfile?:  {
    __typename: "UserProfile",
    activityLevel?: string | null,
    age?: number | null,
    createdAt?: string | null,
    dietaryRestrictions?: string | null,
    fitnessGoals?: string | null,
    heightFeet?: number | null,
    heightInches?: number | null,
    id: string,
    name?: string | null,
    owner?: string | null,
    updatedAt?: string | null,
    userId: string,
    weight?: number | null,
  } | null,
};

export type CreateWorkoutLogMutationVariables = {
  condition?: ModelWorkoutLogConditionInput | null,
  input: CreateWorkoutLogInput,
};

export type CreateWorkoutLogMutation = {
  createWorkoutLog?:  {
    __typename: "WorkoutLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    duration?: number | null,
    exercises?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type DeleteMealLogMutationVariables = {
  condition?: ModelMealLogConditionInput | null,
  input: DeleteMealLogInput,
};

export type DeleteMealLogMutation = {
  deleteMealLog?:  {
    __typename: "MealLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    foods?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type DeleteUserProfileMutationVariables = {
  condition?: ModelUserProfileConditionInput | null,
  input: DeleteUserProfileInput,
};

export type DeleteUserProfileMutation = {
  deleteUserProfile?:  {
    __typename: "UserProfile",
    activityLevel?: string | null,
    age?: number | null,
    createdAt?: string | null,
    dietaryRestrictions?: string | null,
    fitnessGoals?: string | null,
    heightFeet?: number | null,
    heightInches?: number | null,
    id: string,
    name?: string | null,
    owner?: string | null,
    updatedAt?: string | null,
    userId: string,
    weight?: number | null,
  } | null,
};

export type DeleteWorkoutLogMutationVariables = {
  condition?: ModelWorkoutLogConditionInput | null,
  input: DeleteWorkoutLogInput,
};

export type DeleteWorkoutLogMutation = {
  deleteWorkoutLog?:  {
    __typename: "WorkoutLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    duration?: number | null,
    exercises?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type UpdateMealLogMutationVariables = {
  condition?: ModelMealLogConditionInput | null,
  input: UpdateMealLogInput,
};

export type UpdateMealLogMutation = {
  updateMealLog?:  {
    __typename: "MealLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    foods?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type UpdateUserProfileMutationVariables = {
  condition?: ModelUserProfileConditionInput | null,
  input: UpdateUserProfileInput,
};

export type UpdateUserProfileMutation = {
  updateUserProfile?:  {
    __typename: "UserProfile",
    activityLevel?: string | null,
    age?: number | null,
    createdAt?: string | null,
    dietaryRestrictions?: string | null,
    fitnessGoals?: string | null,
    heightFeet?: number | null,
    heightInches?: number | null,
    id: string,
    name?: string | null,
    owner?: string | null,
    updatedAt?: string | null,
    userId: string,
    weight?: number | null,
  } | null,
};

export type UpdateWorkoutLogMutationVariables = {
  condition?: ModelWorkoutLogConditionInput | null,
  input: UpdateWorkoutLogInput,
};

export type UpdateWorkoutLogMutation = {
  updateWorkoutLog?:  {
    __typename: "WorkoutLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    duration?: number | null,
    exercises?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnCreateMealLogSubscriptionVariables = {
  filter?: ModelSubscriptionMealLogFilterInput | null,
  owner?: string | null,
};

export type OnCreateMealLogSubscription = {
  onCreateMealLog?:  {
    __typename: "MealLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    foods?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnCreateUserProfileSubscriptionVariables = {
  filter?: ModelSubscriptionUserProfileFilterInput | null,
  owner?: string | null,
};

export type OnCreateUserProfileSubscription = {
  onCreateUserProfile?:  {
    __typename: "UserProfile",
    activityLevel?: string | null,
    age?: number | null,
    createdAt?: string | null,
    dietaryRestrictions?: string | null,
    fitnessGoals?: string | null,
    heightFeet?: number | null,
    heightInches?: number | null,
    id: string,
    name?: string | null,
    owner?: string | null,
    updatedAt?: string | null,
    userId: string,
    weight?: number | null,
  } | null,
};

export type OnCreateWorkoutLogSubscriptionVariables = {
  filter?: ModelSubscriptionWorkoutLogFilterInput | null,
  owner?: string | null,
};

export type OnCreateWorkoutLogSubscription = {
  onCreateWorkoutLog?:  {
    __typename: "WorkoutLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    duration?: number | null,
    exercises?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnDeleteMealLogSubscriptionVariables = {
  filter?: ModelSubscriptionMealLogFilterInput | null,
  owner?: string | null,
};

export type OnDeleteMealLogSubscription = {
  onDeleteMealLog?:  {
    __typename: "MealLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    foods?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnDeleteUserProfileSubscriptionVariables = {
  filter?: ModelSubscriptionUserProfileFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUserProfileSubscription = {
  onDeleteUserProfile?:  {
    __typename: "UserProfile",
    activityLevel?: string | null,
    age?: number | null,
    createdAt?: string | null,
    dietaryRestrictions?: string | null,
    fitnessGoals?: string | null,
    heightFeet?: number | null,
    heightInches?: number | null,
    id: string,
    name?: string | null,
    owner?: string | null,
    updatedAt?: string | null,
    userId: string,
    weight?: number | null,
  } | null,
};

export type OnDeleteWorkoutLogSubscriptionVariables = {
  filter?: ModelSubscriptionWorkoutLogFilterInput | null,
  owner?: string | null,
};

export type OnDeleteWorkoutLogSubscription = {
  onDeleteWorkoutLog?:  {
    __typename: "WorkoutLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    duration?: number | null,
    exercises?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnUpdateMealLogSubscriptionVariables = {
  filter?: ModelSubscriptionMealLogFilterInput | null,
  owner?: string | null,
};

export type OnUpdateMealLogSubscription = {
  onUpdateMealLog?:  {
    __typename: "MealLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    foods?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};

export type OnUpdateUserProfileSubscriptionVariables = {
  filter?: ModelSubscriptionUserProfileFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUserProfileSubscription = {
  onUpdateUserProfile?:  {
    __typename: "UserProfile",
    activityLevel?: string | null,
    age?: number | null,
    createdAt?: string | null,
    dietaryRestrictions?: string | null,
    fitnessGoals?: string | null,
    heightFeet?: number | null,
    heightInches?: number | null,
    id: string,
    name?: string | null,
    owner?: string | null,
    updatedAt?: string | null,
    userId: string,
    weight?: number | null,
  } | null,
};

export type OnUpdateWorkoutLogSubscriptionVariables = {
  filter?: ModelSubscriptionWorkoutLogFilterInput | null,
  owner?: string | null,
};

export type OnUpdateWorkoutLogSubscription = {
  onUpdateWorkoutLog?:  {
    __typename: "WorkoutLog",
    calories?: number | null,
    createdAt?: string | null,
    date: string,
    duration?: number | null,
    exercises?: string | null,
    id: string,
    notes?: string | null,
    owner?: string | null,
    type: string,
    updatedAt: string,
    userId: string,
  } | null,
};
