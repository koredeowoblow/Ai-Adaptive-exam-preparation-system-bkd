export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  passwordHash: string;
}

export interface LoginDTO {
  email: string;
  passwordHash: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  tokens: AuthTokens;
}
