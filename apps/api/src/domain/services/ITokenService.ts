export interface TokenPayload {
  sub: string; // userId
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  issuePair(payload: TokenPayload): TokenPair;
  verifyAccess(token: string): TokenPayload;
  verifyRefresh(token: string): TokenPayload;
}
