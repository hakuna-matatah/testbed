#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { TestbedStack } from '../lib/testbed-stack';

const app = new cdk.App();
new TestbedStack(app, 'TestbedStack');
