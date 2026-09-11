export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  position: number;
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryIds: string[];
}

export interface LibraryResponse {
  categories: Category[];
  topics: Topic[];
  instance: {
    id: string;
    createdAt: string;
  };
}
