#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ClusterStack } from '../lib/cluster-stack';
import { ContainerStack } from '../lib/container-stack';
import { CicdStack } from '../lib/cicd-stack';

const app = new cdk.App();

const account = app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const primaryRegion = {account: account, region: 'ap-northeast-1'};
const secondaryRegion = {account: account, region: 'us-west-2'};

//여기서 생성해줘야지만 생성된다.
const primaryCluster = new ClusterStack(app, `ClusterStackYJv2-${primaryRegion.region}`, {env: primaryRegion });
new ContainerStack(app, `ContainerStackYJv2-${primaryRegion.region}`, {env: primaryRegion, cluster: primaryCluster.cluster });

const secondaryCluster = new ClusterStack(app, `ClusterStackYJv2-${secondaryRegion.region}`, {env: secondaryRegion });
new ContainerStack(app, `ContainerStackYJv2-${secondaryRegion.region}`, {env: secondaryRegion, cluster: secondaryCluster.cluster });

 
new CicdStack(app, `CicdStackYJv3`, {env: primaryRegion, 
    firstRegionCluster: primaryCluster.cluster,
        secondRegionCluster: secondaryCluster.cluster,
        firstRegionRole: primaryCluster.firstRegionRole,
        secondRegionRole: secondaryCluster.secondRegionRole});

