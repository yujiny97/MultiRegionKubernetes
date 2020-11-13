import * as cdk from '@aws-cdk/core';
import { EksProps } from './cluster-stack';
import * as rds from '@aws-cdk/aws-rds';


export class RdsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EksProps) {
    super(scope, id, props);
    const cluster = props.cluster;//cluster변수 선언헤서 넣어주기
    

  }

}


