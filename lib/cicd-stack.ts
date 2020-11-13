import * as cdk from '@aws-cdk/core';
import codecommit = require('@aws-cdk/aws-codecommit');
import ecr = require('@aws-cdk/aws-ecr');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import pipelineAction = require('@aws-cdk/aws-codepipeline-actions');
import { codeToECRspec, deployToEKSspec } from '../utils/buildspecs';
import { CicdProps } from './cluster-stack';



export class CicdStack extends cdk.Stack {

    constructor(scope: cdk.Construct, id: string, props: CicdProps) {
        super(scope, id, props);

        const primaryRegion = 'ap-northeast-1';
        const secondaryRegion = 'us-west-2';
        const helloPyRepo = new codecommit.Repository(this, 'coronaweb-for-demogo-yj', {
            repositoryName: `coronaweb-${cdk.Stack.of(this).region}`
        });
        
        new cdk.CfnOutput(this, `codecommit-uri`, {
            exportName: 'CodeCommitURL',
            value: helloPyRepo.repositoryCloneUrlHttp
        });

        //ECR 레포지토리 생성
        const ecrForMainRegion = new ecr.Repository(this, `ecr-for-coronaweb`);
    
        //도커 이미지를 빌드하는 codbuild 프로젝트 생성
        const buildForECR = codeToECRspec(this, ecrForMainRegion.repositoryUri);
        ///utils 폴더에 이 워크샵에서 사용할 빌드 스펙을 미리 정의해두었습니다. 자세한 빌드 스펙이 궁금하신 분은 /utils/buildspec.ts 파일을 참조해주십시오.

        ecrForMainRegion.grantPullPush(buildForECR.role!);//ECR에 d이미지를 push할 수 있는 권한

        //deploy하기 위한 코드
        const deployToMainCluster = deployToEKSspec(this, primaryRegion, props.firstRegionCluster, ecrForMainRegion, props.firstRegionRole);
        ///utils 폴더에 이 워크샵에서 사용할 빌드 스펙을 미리 정의해두었습니다. 자세한 빌드 스펙이 궁금하신 분은 /utils/buildspec.ts 파일을 참조해주십시오.

        const deployTo2ndCluster = deployToEKSspec(this, secondaryRegion, props.secondRegionCluster, ecrForMainRegion, props.secondRegionRole);
        //코드 pipeline 생성하는 코드
        const sourceOutput = new codepipeline.Artifact();

        new codepipeline.Pipeline(this, 'multi-region-eks-dep-coronawebyj', {
            stages: [ {
                    stageName: 'Source',
                    actions: [ new pipelineAction.CodeCommitSourceAction({
                            actionName: 'CatchSourcefromCode',
                            repository: helloPyRepo,
                            output: sourceOutput,
                        })]
                },{
                    stageName: 'Build',
                    actions: [ new pipelineAction.CodeBuildAction({
                        actionName: 'BuildAndPushtoECR',
                        input: sourceOutput,
                        project: buildForECR
                    })]
                },
                {
                    stageName: 'DeployToMainEKScluster',
                    actions: [ new pipelineAction.CodeBuildAction({
                        actionName: 'DeployToMainEKScluster',
                        input: sourceOutput,
                        project: deployToMainCluster
                    })]
                },{
                    stageName: 'ApproveToDeployTo2ndRegion',
                    actions: [ new pipelineAction.ManualApprovalAction({
                            actionName: 'ApproveToDeployTo2ndRegion'
                    })]
                },
                {
                    stageName: 'DeployTo2ndRegionCluster',
                    actions: [ new pipelineAction.CodeBuildAction({
                        actionName: 'DeployTo2ndRegionCluster',
                        input: sourceOutput,
                        project: deployTo2ndCluster
                    })]
                }
                
            ]
        });


    }
}


