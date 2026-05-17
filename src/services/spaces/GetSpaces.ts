import {
  DynamoDBClient,
  GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export default async function getSpaces(
  event: APIGatewayProxyEvent,
  dbClient: DynamoDBClient,
): Promise<APIGatewayProxyResult> {
  if (event.queryStringParameters && event.queryStringParameters.id) {
    const spaceId = event.queryStringParameters.id;
    const response = await dbClient.send(
      new GetItemCommand({
        TableName: process.env.SPACE_FINDER_TABLE_NAME,
        Key: {
          id: { S: spaceId },
        },
      }),
    );
    if (response.Item) {
      return {
        statusCode: 200,
        body: JSON.stringify(unmarshall(response.Item)),
      };
    }
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Space not found" }),
    };
  }

  const userId = event.requestContext.authorizer?.claims?.sub;
  const result = await dbClient.send(
    new ScanCommand({
      TableName: process.env.SPACE_FINDER_TABLE_NAME,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": { S: userId } },
    }),
  );
  const items = result.Items?.map((item) => unmarshall(item));
  return {
    statusCode: 200,
    body: JSON.stringify(items),
  };
}
