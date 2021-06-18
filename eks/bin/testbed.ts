#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { TestbedStack, TestbedProps } from '../lib/testbed-stack';
import { Repository } from '../lib/addons/fluxv2';

const syncRepositories = [
    { repoUrl: "https://github.com/awslabs/kubernetes-iteration-toolkit", repoBranch: "main", repoPath: "./testbed/k8s-config/" }];
const app = new cdk.App();
new TestbedStack(app, 'TestbedStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
    ,
    fluxRepos: syncRepositories,
    fluxVersion: "v0.15.0"
});
