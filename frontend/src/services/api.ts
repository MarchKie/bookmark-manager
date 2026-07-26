import axios from 'axios';
import type {
  Collection,
  Bookmark,
  ShareToken,
  SharedCollectionResponse,
  UserProfile,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let getTokenFn: (() => Promise<string | undefined>) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | undefined>) => {
  getTokenFn = getter;
};

// Request interceptor to attach Bearer Access Token
apiClient.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to retrieve Auth0 access token for API request:', error);
    }
  }
  return config;
});

// API Services
export const api = {
  // Me / Profile
  me: {
    getProfile: () => apiClient.get<UserProfile>('/me').then((res) => res.data),
  },

  // Collections
  collections: {
    getAll: () => apiClient.get<Collection[]>('/collections').then((res) => res.data),
    getById: (id: string) => apiClient.get<Collection>(`/collections/${id}`).then((res) => res.data),
    create: (data: { name: string }) =>
      apiClient.post<Collection>('/collections', data).then((res) => res.data),
    update: (id: string, data: { name: string }) =>
      apiClient.put<Collection>(`/collections/${id}`, data).then((res) => res.data),
    patch: (id: string, data: { name?: string }) =>
      apiClient.patch<Collection>(`/collections/${id}`, data).then((res) => res.data),
    delete: (id: string) => apiClient.delete(`/collections/${id}`).then((res) => res.data),
    getBookmarks: (id: string) =>
      apiClient.get<Bookmark[]>(`/collections/${id}/bookmarks`).then((res) => res.data),
  },

  // Bookmarks
  bookmarks: {
    getAll: (collectionId?: string) =>
      apiClient
        .get<Bookmark[]>('/bookmarks', { params: collectionId ? { collectionId } : {} })
        .then((res) => res.data),
    getById: (id: string) => apiClient.get<Bookmark>(`/bookmarks/${id}`).then((res) => res.data),
    create: (data: { url: string; title: string; notes?: string; collectionId?: string }) =>
      apiClient.post<Bookmark>('/bookmarks', data).then((res) => res.data),
    update: (
      id: string,
      data: { url: string; title: string; notes?: string; collectionId?: string },
    ) => apiClient.put<Bookmark>(`/bookmarks/${id}`, data).then((res) => res.data),
    patch: (
      id: string,
      data: { url?: string; title?: string; notes?: string; collectionId?: string },
    ) => apiClient.patch<Bookmark>(`/bookmarks/${id}`, data).then((res) => res.data),
    delete: (id: string) => apiClient.delete(`/bookmarks/${id}`).then((res) => res.data),
  },

  // Collection Share (ADR-05)
  share: {
    generate: (collectionId: string, expiresInHours?: number) =>
      apiClient
        .post<ShareToken>('/collections/share', { collectionId, expiresInHours })
        .then((res) => res.data),
    getPublic: (token: string) =>
      apiClient
        .get<SharedCollectionResponse>(`/collections/share/${token}`)
        .then((res) => res.data),
    revoke: (token: string) => apiClient.delete(`/collections/share/${token}`).then((res) => res.data),
  },
};
