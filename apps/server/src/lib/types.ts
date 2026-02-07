// ============================================
// 统一返回类型
// ============================================
export interface ApiResponse<T = null> {
  success: boolean;
  data: T;
  errorDetail: string | null;
}

export function ok<T = null>(data: T = null as T): ApiResponse<T> {
  return { success: true, data, errorDetail: null };
}

export function fail(errorDetail: string): ApiResponse<null> {
  return { success: false, data: null, errorDetail };
}