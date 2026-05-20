import { SNSEvent } from "aws-lambda";

const webhookUrl = process.env.WEBHOOK_URL!;

export async function handler(event: SNSEvent) {
  for (const record of event.Records) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: JSON.stringify({
        text: `We have a problem in Space Finder: ${record.Sns.Message}`,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Slack webhook failed: ${response.status} ${response.statusText}`,
      );
    }
  }
}
