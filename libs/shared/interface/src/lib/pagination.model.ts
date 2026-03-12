export interface PageDTO<T> {
  totalPage: number;
  totalRows: number;
  pageNumber: number;
  pageSize: number;
  data: T[];
  last?: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}
