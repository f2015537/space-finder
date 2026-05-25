import { Amplify } from "aws-amplify";
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  signInWithRedirect,
  type SignInOutput,
  type SignUpOutput,
} from "@aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_OAUTH_DOMAIN || "localhost",
          scopes: ["email", "profile", "openid"],
          redirectSignIn: [import.meta.env.VITE_OAUTH_REDIRECT_SIGNIN || "http://localhost:5173/"],
          redirectSignOut: [import.meta.env.VITE_OAUTH_REDIRECT_SIGNOUT || "http://localhost:5173/"],
          responseType: "code",
        },
      },
    },
  },
});

export class AuthService {
  public async signup(
    username: string,
    email: string,
    password: string,
  ): Promise<SignUpOutput> {
    return signUp({
      username,
      password,
      options: { userAttributes: { email } },
    });
  }

  public async confirmSignup(username: string, code: string): Promise<void> {
    await confirmSignUp({ username, confirmationCode: code });
  }

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

  public async loginWithProvider(provider: "Google" | "GitHub") {
    if (provider === "Google") {
      await signInWithRedirect({ provider: "Google" });
    } else {
      await signInWithRedirect({ provider: { custom: "GitHub" } });
    }
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
