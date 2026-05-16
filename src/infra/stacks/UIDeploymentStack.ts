import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { AccessLevel, Distribution } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { existsSync } from "fs";
import path from "path";
import { getSuffixFromStack } from "../Utils";

export class UIDeploymentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const suffix = getSuffixFromStack(this);

    const bucket = new Bucket(this, "UIDeploymentBucket", {
      bucketName: `space-finder-frontend-bucket-${suffix}`,
    });

    const uiDirectory = path.join(__dirname, "../../../frontend/dist");
    if (!existsSync(uiDirectory)) {
      console.warn(`UI directory not found: ${uiDirectory}`);
      return;
    }

    new BucketDeployment(this, "SpaceFinderUIDeployment", {
      sources: [Source.asset(uiDirectory)],
      destinationBucket: bucket,
      prune: true,
      retainOnDelete: false,
    });

    const s3Origin = S3BucketOrigin.withOriginAccessControl(bucket, {
      originAccessLevels: [AccessLevel.READ],
    });

    const distribution = new Distribution(this, "UIDeploymentDistribution", {
      defaultBehavior: {
        origin: s3Origin,
      },
      defaultRootObject: "index.html",
    });

    new CfnOutput(this, "UIDeploymentDistributionDomainName", {
      value: distribution.domainName,
    });
  }
}
