export interface ApiSuccessResponse<T> {
  status: 'ok';
  data: T;
}

export interface ApiMessageResponse {
  status: 'ok';
  message: string;
}
