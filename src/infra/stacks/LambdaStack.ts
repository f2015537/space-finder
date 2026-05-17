import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { join } from "path";

interface LambdaStackProps extends StackProps {
  spaceFinderTable: ITable;
  photosBucket: IBucket;
}

export class LambdaStack extends Stack {
  public readonly spacesLambdaIntegration: LambdaIntegration;
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const spacesLambda = new NodejsFunction(this, "SpacesLambda", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname, "..", "..", "services", "spaces", "handler.ts"),
      environment: {
        SPACE_FINDER_TABLE_NAME: props.spaceFinderTable.tableName,
        SPACE_FINDER_PHOTOS_BUCKET_NAME: props.photosBucket.bucketName,
      },
    });

    props.spaceFinderTable.grantReadWriteData(spacesLambda);
    props.photosBucket.grantReadWrite(spacesLambda);

    this.spacesLambdaIntegration = new LambdaIntegration(spacesLambda);
  }
}
