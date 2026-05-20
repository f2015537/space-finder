import { App } from "aws-cdk-lib";
import { join } from "path";

try {
  process.loadEnvFile(join(__dirname, "..", "..", ".env"));
} catch {
  // no .env file present — env vars must be set externally
}
import { DataStack } from "./stacks/DataStack";
import { LambdaStack } from "./stacks/LambdaStack";
import { ApiStack } from "./stacks/ApiStack";
import { AuthStack } from "./stacks/AuthStack";
import { UIDeploymentStack } from "./stacks/UIDeploymentStack";
import { MonitorStack } from "./stacks/MonitorStack";

const app = new App();

const dataStack = new DataStack(app, "DataStack");
const lambdaStack = new LambdaStack(app, "LambdaStack", {
  spaceFinderTable: dataStack.spaceFinderTable,
  photosBucket: dataStack.photosBucket,
});
const authStack = new AuthStack(app, "AuthStack");
authStack.addPhotoUploadPermission(dataStack.photosBucket);
new ApiStack(app, "ApiStack", {
  spacesLambdaIntegration: lambdaStack.spacesLambdaIntegration,
  userPool: authStack.userPool,
});
new UIDeploymentStack(app, "UIDeploymentStack");

new MonitorStack(app, "MonitorStack", {
  webhookUrl: process.env.MONITOR_WEBHOOK_URL!,
});
