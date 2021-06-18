import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Testbed from '../lib/testbed-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Testbed.TestbedStack(app, 'MyTestStack', { fluxRepos: [{ repoBranch: "", repoPath: "", repoUrl: "" }], fluxVersion: "" });
  // THEN
  expectCDK(stack).to(matchTemplate({
    "Resources": {}
  }, MatchStyle.EXACT))
});