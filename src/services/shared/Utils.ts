import { JSONValidationError } from "./Validator";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const parseJson = (arg: string) => {
  try {
    return JSON.parse(arg);
  } catch (error) {
    throw new JSONValidationError((error as Error).message);
  }
};

export const idGenerator = () => {
  return crypto.randomUUID();
};

export const belongsToAdminGroup = (event: APIGatewayProxyEvent) => {
  const cognitoUser = event.requestContext.authorizer?.claims;
  return cognitoUser?.["cognito:groups"]?.includes("SpaceAdmins");
};

export function addCorsHeaders(response: APIGatewayProxyResult) {
  if (!response.headers) {
    response.headers = {};
  }
  response.headers["Access-Control-Allow-Origin"] = "*";
  response.headers["Access-Control-Allow-Methods"] = "*";
  return response;
}
