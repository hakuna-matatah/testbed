import cdk = require('@aws-cdk/core');
import eks = require('@aws-cdk/aws-eks');



export interface KarpenterProps extends cdk.StackProps {
    cluster: eks.Cluster;
}

export class Karpenter extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: KarpenterProps) {
        super(scope, id);

    }
}