export interface Result<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface IUser {
  account: string;
  password: string;
}

export interface OauthUser {
  email: string;
  name: string;
}

export interface RegisterUser {
  account: string;
  name: string;
  password: string;
}
