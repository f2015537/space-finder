import { Amplify } from "aws-amplify";
import { fetchAuthSession, signIn, SignInOutput } from "@aws-amplify/auth";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { join } from "path";

process.loadEnvFile(join(__dirname, "..", ".env"));

const awsRegion = process.env.AWS_REGION!;
const userPoolId = process.env.USER_POOL_ID!;
const identityPoolId = process.env.IDENTITY_POOL_ID!;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId: process.env.USER_POOL_CLIENT_ID!,
      identityPoolId,
    },
  },
});

export class AuthService {
  public async login(username: string, password: string) {
    const signInResult: SignInOutput = await signIn({
      username,
      password,
      options: {
        authFlowType: "USER_PASSWORD_AUTH",
      },
    });
    return signInResult;
  }

  public async getIdToken() {
    const authSession = await fetchAuthSession();
    return authSession.tokens?.idToken?.toString() ?? "";
  }

  public async generateCredentials() {
    const idToken = await this.getIdToken();
    const cognitoIdentityPool = `cognito-idp.${awsRegion}.amazonaws.com/${userPoolId}`;
    const cognitoIdentity = new CognitoIdentityClient({
      credentials: fromCognitoIdentityPool({
        identityPoolId,
        logins: {
          [cognitoIdentityPool]: idToken,
        },
      }),
    });
    const credentials = await cognitoIdentity.config.credentials();
    return credentials;
  }
}
