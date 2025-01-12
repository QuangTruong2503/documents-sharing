// src/utils/tokenUtils.ts
import userApi from '../api/usersApi';

interface Token {
  success: boolean;
  message: string;
  data: string;
}

interface TokenData {
  userID: string;
  roleID: string;
}

export const verifyToken = async (token: string): Promise<TokenData | null> => {
  try {
    const response = await userApi.verifyToken(token);
    const tokenResponse: Token = response.data;

    if (!tokenResponse.success) {
      console.error(tokenResponse.message);
      return null;
    }
    const data: TokenData = JSON.parse(tokenResponse.data)
    return data;
  } catch (error: any) {
    console.error("Error verifying token:", error.message);
    return null;
  }
};
