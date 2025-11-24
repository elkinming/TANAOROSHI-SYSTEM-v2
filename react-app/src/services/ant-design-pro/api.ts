// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { adaptInventoryItemToBackend, adaptInventoryResponse } from './inventoryAdapters';

const URL = "/j0503015/batch/001"

/** 获取当前的用户 GET /api/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>('/api/currentUser', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 退出登录接口 POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/login/outLogin', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 登录接口 POST /api/login/account */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('/api/login/account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

// function for getting all the inventory
export async function getAllInventory(
  params: {
    previousFactoryCode?: string;
    productFactoryCode?: string;
    searchKeyword?: string;
  },
  options?: { [key: string]: any },
) {

  const backendParams = {
    previous_factory_code: params?.previousFactoryCode,
    product_factory_code: params?.productFactoryCode,
    search_keyword: params?.searchKeyword,
  }

  const response = await request<API.BackendInventoryResponse>(`/inventory/record-list`, {
    method: 'GET',
    params: backendParams,
    ...(options || {}),
  });

  return adaptInventoryResponse(response);
}

export async function addInventoryRecord(options?: API.InventoryListItem) {
  // return request<API.InventoryListItem>(`${URL}/inventory/record`, {
  const backendData = options ? adaptInventoryItemToBackend(options) : {};

  return request<API.InventoryListItem>(`/inventory/record`, {
    method: 'POST',
    data: {
      method: 'update',
      ...backendData,
    },
    requestType: 'json',
  });
}

export async function updateInventoryRecord(options?: API.InventoryListItem) {
  // return request<API.InventoryListItem>(`${URL}/inventory/record`, {
  const backendData = options ? adaptInventoryItemToBackend(options) : {};

  return request<API.InventoryListItem>(`/inventory/record`, {
    method: 'PUT',
    data: {
      method: 'update',
      ...backendData,
    },
    requestType: 'json',
  });
}

// Function for inserting a batch of records.
// Body: record[]
export async function addInventoryRecordBatch(options?: API.InventoryListItem[]) {
  // return request<API.InventoryListItem[]>(`${URL}/inventory/record-batch`, {
  const backendData = (options || []).map(item => adaptInventoryItemToBackend(item));

  return request<API.InventoryListItem[]>(`/inventory/record-batch`, {
    method: 'POST',
    data: backendData,
    requestType: 'json',
  });
}

// Function for updating a batch of records.
// Body: record[]
export async function updateInventoryRecordBatch(options?: API.InventoryListItem[]) {
  const backendData = (options || []).map(item => adaptInventoryItemToBackend(item));
  return request<API.InventoryListItem[]>(`/inventory/record/multiple`, {
    method: 'PUT',
    data: backendData,
    requestType: 'json',
  });
}

export async function insertInventoryRecordArray(options?: API.InventoryListItem[]) {
  const backendData = (options || []).map(item => adaptInventoryItemToBackend(item));
  return request<API.InventoryListItem[]>(`/inventory/record/multiple`, {
    method: 'POST',
    data: backendData,
    requestType: 'json',
  });
}

export async function deleteInventoryRecordArray(options?: API.InventoryListItem[]) {
  const backendData = (options || []).map(item => adaptInventoryItemToBackend(item));
  return request<string[]>(`/inventory/record/multiple`, {
    method: 'DELETE',
    data: backendData,
    requestType: 'json',
  });
}
