// @ts-ignore
/* eslint-disable */
import { v4 as uuidv4 } from 'uuid';

// Adapter function to transform UserListItem to BackendUserListItem (camelCase to snake_case)
export function adaptUserItemToBackend(item: API.UserListItem): API.BackendUserListItem {
  return {
    id: item.id,
    name: item.name,
    lastname: item.lastname,
    age: item.age,
    country: item.country,
    home_address: item.homeAddress,
  };
}

// Adapter function to transform BackendUserListItem to UserListItem (snake_case to camelCase)
export function adaptBackendUserItemToFrontend(item: API.BackendUserListItem): API.UserListItem {
  return {
    id: item.id,
    name: item.name,
    lastname: item.lastname,
    age: item.age,
    country: item.country,
    homeAddress: item.home_address,
  };
}

// Adapter function to transform backend response to UserList format
export function adaptUserResponse(backendResponse: API.BackendUserResponse): API.UserList {
  const adaptedItems: API.UserListItem[] = (backendResponse.data?.items || []).map((item) => ({
    id: item.id,
    name: item.name,
    lastname: item.lastname,
    age: item.age,
    country: item.country,
    homeAddress: item.home_address,
  }));

  return {
    data: adaptedItems,
    total: backendResponse.data?.total ?? undefined,
    success: backendResponse.code === 200,
  };
}

