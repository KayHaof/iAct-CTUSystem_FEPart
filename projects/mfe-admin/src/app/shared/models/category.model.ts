export interface CategoryResponse {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  maxPoint: number;
  isActive?: boolean;
  children?: CategoryResponse[];
}

export interface CategoryRequest {
  parentId: number | null;
  code: string;
  name: string;
  maxPoint: number;
}
