import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as eks from '@aws-cdk/aws-eks';
import * as ec2 from '@aws-cdk/aws-ec2';
import { PhysicalName } from '@aws-cdk/core';

export class ClusterStack extends cdk.Stack {
    public readonly cluster: eks.Cluster;//자신의 클러스터를 가져올 수 있게 한다.
    public readonly firstRegionRole: iam.Role;//
    public readonly secondRegionRole: iam.Role;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const primaryRegion = 'ap-northeast-1';
    const clusterAdmin = new iam.Role(this,'cluster-admin',{//iam 설정
      assumedBy: new iam.AccountRootPrincipal
    });
    const cluster =new eks.Cluster(this, 'yj-cluster', {//논리적인 cluster
      clusterName: 'yj_cluster',
      version: eks.KubernetesVersion.V1_16,//자기꺼에 설치된 kuber버전(?)
      defaultCapacity: 2,//cluster에 생성한 인스턴스 개수
      mastersRole: clusterAdmin,//cluster-admin이라는 애가 이 kubernetes도 제어할 수 있는 롤을 준 것
      defaultCapacityInstance: new ec2.InstanceType('t3.small')//인스턴스 type은 뭘로 줄건지
    });
    this.cluster = cluster;

    if (cdk.Stack.of(this).region==primaryRegion) {
        this.firstRegionRole = createDeployRole(this, `for-1st-region`, cluster);
    }
    else {
        // 스택이 두 번째 리전값을 가지고 있으면, 새로운 롤을 생성하되 그 리전 클러스터에만 접근할 수 있는 권한을 부여합니다.
        this.secondRegionRole = createDeployRole(this, `for-2nd-region`, cluster);
    }


    }
}
export interface EksProps extends cdk.StackProps {
    cluster: eks.Cluster
  }
  
  export interface CicdProps extends cdk.StackProps {//생성자에서 생성한 cluster와 role을 설정해줌
    firstRegionCluster: eks.Cluster,
    secondRegionCluster: eks.Cluster,
    firstRegionRole: iam.Role,
    secondRegionRole: iam.Role
  }
  
  

function createDeployRole(scope: cdk.Construct, id: string, cluster: eks.Cluster): iam.Role {
  const role = new iam.Role(scope, id, {
    roleName: PhysicalName.GENERATE_IF_NEEDED,
    assumedBy: new iam.AccountRootPrincipal()
  });
  cluster.awsAuth.addMastersRole(role);

  return role;
}//code를 배포하는 cicd stack에서 build하는 과정에서 iam롤을 생성하는데 리젼값을 읽어서 cluster에 해당하는
//리전에만 배포할 수 있도록 하는 코드이다.
