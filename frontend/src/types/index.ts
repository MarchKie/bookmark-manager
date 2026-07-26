export interface Collection {
  id: string;
  name: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bookmarks: number;
  };
  bookmarks?: Bookmark[];
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  notes?: string | null;
  collectionId?: string | null;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  collection?: {
    id: string;
    name: string;
  } | null;
}

export interface ShareToken {
  id: string;
  collectionId: string;
  shareToken: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SharedCollectionResponse {
  shareToken: string;
  expiresAt?: string | null;
  collection: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    bookmarks: Bookmark[];
  };
}

export interface UserProfile {
  sub: string;
  email: string;
  name: string;
  picture: string;
}
