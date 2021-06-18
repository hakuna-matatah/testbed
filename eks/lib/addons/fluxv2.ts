import cdk = require('@aws-cdk/core');
import eks = require('@aws-cdk/aws-eks');
import * as yaml from 'js-yaml';
import * as request from 'sync-request';

export interface FluxV2Props extends cdk.StackProps {
    cluster: eks.Cluster;
    fluxRepos: Repository[];
    secretName: string;
    fluxVersion: string;
}
export class Repository {
    repoUrl: string;
    repoBranch: string;
    repoPath: string;

    constructor(repoUrl: string, repoBranch?: string, repoPath?: string) {
        if (!repoBranch) {
            this.repoBranch = "main"
        } else {
            this.repoBranch = repoBranch
        }
        if (!repoPath) {
            this.repoPath = "test/workflows"
        } else {
            this.repoPath = repoPath
        }
        this.repoUrl = repoUrl
    }
}
class FluxRelease {
    private fluxVersion: string;
    private manifestUrl: string;
    public installManifest: any;

    constructor(version: string) {
        this.fluxVersion = version;
        this.manifestUrl = `https://github.com/fluxcd/flux2/releases/download/${this.fluxVersion}/install.yaml`
    }

    public getUrl(): string {
        return this.manifestUrl;
    }

    public getManifest(): any {
        this.installManifest = yaml.loadAll(
            request.default('GET', this.manifestUrl)
                .getBody()
                .toString()
        );
        return this.installManifest;
    }
}

export class FluxV2 extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: FluxV2Props) {
        super(scope, id);

        // Actually install Flux components onto the cluster
        const fluxRelease = new FluxRelease(props.fluxVersion);
        const fluxManifest = props.cluster.addManifest('fluxManifest', ...fluxRelease.getManifest());

        for (let index = 0; index < props.fluxRepos.length; index++) {

            // Bootstrap manifests
            const gitRepoManifest = props.cluster.addManifest('GitRepoSelf', {
                apiVersion: 'source.toolkit.fluxcd.io/v1beta1',
                kind: 'GitRepository',
                metadata: {
                    //to-do use some meaningfulname
                    name: 'flux-system' + index,
                    namespace: 'flux-system'
                },
                spec: {
                    // we can adjust this later if we want to be more aggressive  
                    interval: '5m0s',
                    ref: {
                        branch: props.fluxRepos[index].repoBranch,
                    },
                    secretRef: {
                        name: props.secretName
                    },
                    url: props.fluxRepos[index].repoUrl
                }
            });
            gitRepoManifest.node.addDependency(fluxManifest);
            const kustomizationManifest = props.cluster.addManifest('KustomizationSelf', {
                apiVersion: 'kustomize.toolkit.fluxcd.io/v1beta1',
                kind: 'Kustomization',
                metadata: {
                    //to-do use some meaningfulname
                    name: 'flux-system' + index,
                    namespace: 'flux-system'
                },
                spec: {
                    // we can adjust this later if we want to be more aggressive  
                    interval: '5m0s',
                    path: props.fluxRepos[index].repoPath,
                    prune: true,
                    sourceRef: {
                        kind: 'GitRepository',
                        name: 'flux-system'
                    },
                    validation: 'client'
                }
            });
            kustomizationManifest.node.addDependency(fluxManifest);
        }
    }
}