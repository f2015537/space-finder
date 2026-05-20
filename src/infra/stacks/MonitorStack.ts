import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Alarm, Metric, Unit } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import { join } from "path";

interface MonitorStackProps extends StackProps {
  webhookUrl: string;
}

export class MonitorStack extends Stack {
  constructor(scope: Construct, id: string, props: MonitorStackProps) {
    super(scope, id, props);

    const webHookLambda = new NodejsFunction(this, "WebHookLambda", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname, "..", "..", "services", "monitor", "handler.ts"),
      environment: {
        WEBHOOK_URL: props.webhookUrl,
      },
    });

    const alarmTopic = new Topic(this, "AlarmTopic", {
      topicName: "AlarmTopic",
      displayName: "AlarmTopic",
    });

    alarmTopic.addSubscription(new LambdaSubscription(webHookLambda));

    const spacesApi4xxAlarm = new Alarm(this, "SpacesApi4xxAlarm", {
      alarmName: "SpacesApi4xxAlarm",
      metric: new Metric({
        namespace: "AWS/ApiGateway",
        metricName: "4XXError",
        period: Duration.minutes(1),
        statistic: "Sum",
        unit: Unit.COUNT,
        dimensionsMap: {
          ApiName: "SpaceFinderApi",
          Stage: "prod",
        },
      }),
      threshold: 10,
      evaluationPeriods: 1,
    });

    const alarmAction = new SnsAction(alarmTopic);
    spacesApi4xxAlarm.addAlarmAction(alarmAction);
    spacesApi4xxAlarm.addOkAction(alarmAction);
    spacesApi4xxAlarm.addInsufficientDataAction(alarmAction);
  }
}
