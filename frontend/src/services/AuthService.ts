import { Amplify } from "aws-amplify";
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  type SignInOutput,
} from "@aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
    },
  },
});

export class AuthService {
  public async login(username: string, password: string): Promise<SignInOutput> {
    await signOut();
    return signIn({
      username,
      password,
      options: {
        authFlowType: "USER_PASSWORD_AUTH",
      },
    });
  }

  public async getIdToken(): Promise<string> {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? "";
  }

  public async generateCredentials() {
    const session = await fetchAuthSession();
    if (!session.credentials) throw new Error("No AWS credentials available.");
    return session.credentials;
  }

  public async logout(): Promise<void> {
    await signOut();
  }

  public async getUsername(): Promise<string | undefined> {
    try {
      const { username } = await getCurrentUser();
      return username;
    } catch {
      return undefined;
    }
  }
}
