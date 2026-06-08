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
  data?: T;
  timestamp?: number;
  /** @deprecated Use `data` instead. Kept for backward compatibility. */
  result?: T;
}

export function unwrapResponse<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as ApiResponse<T>).data ?? (res as ApiResponse<T>).result!;
  }
  return res as T;
}
