import * as iam from '@aws-cdk/aws-iam';
import * as eks from '@aws-cdk/aws-eks';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core'
import { FluxV2, Repository } from './addons/fluxv2';

export interface TestbedProps extends cdk.StackProps {
  fluxRepos: Repository[];
  fluxVersion: string;
}

export class TestbedStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: TestbedProps) {
    super(scope, id, props);

    // A VPC, including NAT GWs, IGWs, where we will run our cluster
    const vpc = new ec2.Vpc(this, 'VPC', {});

    // The IAM role that will be used by EKS
    const clusterRole = new iam.Role(this, 'ClusterRole', {
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSVPCResourceController')
      ]
    });

    // The EKS cluster
    const cluster = new eks.Cluster(this, 'Cluster', {
      vpc: vpc,
      role: clusterRole,
      version: eks.KubernetesVersion.V1_19,
      defaultCapacity: 0
    });

    // Worker node IAM role
    const workerRole = new iam.Role(this, 'WorkerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSVPCResourceController') // Allows us to use Security Groups for pods
      ]
    });

    // Select the private subnets created in our VPC and place our worker nodes there
    const privateSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE
    });

    // for time being we start with these defaults; To-do use karpenter to manage this
    cluster.addNodegroupCapacity('WorkerNodeGroup', {
      subnets: privateSubnets,
      nodeRole: workerRole,
      minSize: 3,
      maxSize: 20
    });

    // Add FluxV2
    new FluxV2(this, 'FluxV2', {
      cluster: cluster,
      secretName: 'github-key',
      fluxRepos: props.fluxRepos,
      fluxVersion: props.fluxVersion
    });

  }
}