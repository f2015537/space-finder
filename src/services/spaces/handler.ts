import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import postSpaces from "./PostSpaces";
import getSpaces from "./GetSpaces";
import updateSpace from "./UpdateSpace";
import deleteSpace from "./DeleteSpace";
import { JSONValidationError, MissingFieldError } from "../shared/Validator";
import { addCorsHeaders } from "../shared/Utils";

const dbClient = new DynamoDBClient({});

async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult;
  try {
    switch (event.httpMethod) {
      case "GET":
        const getResponse = await getSpaces(event, dbClient);
        response = getResponse;
        break;
      case "POST":
        const postResponse = await postSpaces(event, dbClient);
        response = postResponse;
        break;
      case "PUT":
        const updateResponse = await updateSpace(event, dbClient);
        response = updateResponse;
        break;
      case "DELETE":
        const deleteResponse = await deleteSpace(event, dbClient);
        response = deleteResponse;
        break;
      default:
        return addCorsHeaders({
          statusCode: 400,
          body: JSON.stringify({
              message: "Invalid request method",
            }),
          });
    }
  } catch (error) {
    console.error(error);
    if (error instanceof MissingFieldError) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          message: error.message,
        }),
      });
    }
    if (error instanceof JSONValidationError) {
      return addCorsHeaders({
        statusCode: 400,
        body: JSON.stringify({
          message: error.message,
        }),
      });
    }
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({
        message: (error as Error).message,
      }),
    });
  }
  response = addCorsHeaders(response);
  return response;
}

export { handler };
