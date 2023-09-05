export interface Result<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface IUser {
  account: string;
  password: string;
}
