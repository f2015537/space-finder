import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { idGenerator, parseJson } from "../shared/Utils";
import { validateAsSpaceEntry } from "../shared/Validator";

export default async function postSpaces(
  event: APIGatewayProxyEvent,
  dbClient: DynamoDBClient,
): Promise<APIGatewayProxyResult> {
  const randomId = idGenerator();
  const item = parseJson(event.body || "{}");
  item.id = randomId;
  item.userId = event.requestContext.authorizer?.claims?.sub;
  validateAsSpaceEntry(item);
  const marshalledItem = marshall(item);
  const result = await dbClient.send(
    new PutItemCommand({
      TableName: process.env.SPACE_FINDER_TABLE_NAME,
      Item: marshalledItem,
    }),
  );

  console.log("PutItem result:", result.$metadata.httpStatusCode);
  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Space created successfully",
      id: randomId,
    }),
  };
}
