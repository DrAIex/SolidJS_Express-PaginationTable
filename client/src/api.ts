import { Item, PaginatedResponse, Settings } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

export async function getItems(page: number = 1, limit: number = 20, search: string = ''): Promise<PaginatedResponse> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (search) {
    queryParams.append('search', search);
  }
  
  const response = await fetch(`${API_URL}/items?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Ошибка при загрузке данных');
  }
  
  return await response.json();
}

export async function saveSelection(selectedIds: number[]): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/selection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ selectedIds }),
  });
  
  if (!response.ok) {
    throw new Error('Ошибка при сохранении выбранных элементов');
  }
  
  return await response.json();
}

export async function saveOrder(
  order: number[], 
  options?: { fromId?: number; toId?: number }
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order,
      fromId: options?.fromId,
      toId: options?.toId
    }),
  });
  
  if (!response.ok) {
    throw new Error('Ошибка при сохранении порядка сортировки');
  }
  
  return await response.json();
}

export async function getSettings(): Promise<Settings> {
  const response = await fetch(`${API_URL}/settings`);
  
  if (!response.ok) {
    throw new Error('Ошибка при загрузке настроек');
  }
  
  return await response.json();
} 