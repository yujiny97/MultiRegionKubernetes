import * as cdk from '@aws-cdk/core';
import { readYamlFromDir } from '../utils/read-file';
import { EksProps } from './cluster-stack'; 


export class ContainerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EksProps) {
    super(scope, id, props);
    const cluster = props.cluster;//cluster변수 선언헤서 넣어주기
    const commonFolder = './yaml-common/';//어떤 리젼이던 동일하게 적용될 yaml
    const regionFolder = `./yaml-${cdk.Stack.of(this).region}/`;//region에 따라 다르게 적용될 yaml

    readYamlFromDir(commonFolder, cluster);
    readYamlFromDir(regionFolder, cluster);



  }

}


