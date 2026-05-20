import { SNSEvent } from "aws-lambda";
import { handler } from "../src/services/monitor/handler";

const event: SNSEvent = {
  Records: [
    {
      Sns: {
        Message: "Test message",
      },
    },
  ],
} as any;

handler(event);
