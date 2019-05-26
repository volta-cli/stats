import request from 'request-promise';
import Asset from './asset';
import Variant from './variant';
import _ from 'lodash';

export default class Release {
    static async fetchAll(org, repo) {
        let raw = await request({
            uri: "https://api.github.com/repos/" + org + "/" + repo + "/releases",
            headers: {
                'user-agent': 'node.js',
                'Authorization': process.env.GITHUB_TOKEN
            }
        });

        return JSON.parse(raw).map(Release.parse);
    }

    constructor(version, assets) {
        this.version = version;

        let details = assets[0].details;
        this.details = {
            product: details.product,
            version: details.version
        };

        let variants = _.groupBy(assets, asset => asset.details.platform.os);
        this.variants = _.mapValues(variants, Variant.fromAssets);
        this.downloadCount = _.sumBy(this.variants, variant => variant.downloadCount);
    }

    toJSON() {
        return {
            version: this.version,
            details: this.details,
            variants: _.mapValues(this.variants, variant => variant.toJSON())
        };
    }

    byVariant() {
        let product = this.details.product;

        let major = this.details.version.major;
        let minor = this.details.version.minor;
        let patch = this.details.version.patch;
        let version = `${major}.${minor}.${patch}`;

        let macos = this.variants.macos.downloadCount;
        let linux = this.variants.linux ? this.variants.linux.downloadCount : 0;
        let windows = this.variants.windows ? this.variants.windows.downloadCount : 0;

        let total = macos + linux + windows;

        return `${product},${version},${major},${minor},${patch},${macos},${linux},${windows},${total}`;
    }

    static parse(json) {
        return new Release(json.name, json.assets.map(Asset.parse));
    }
}
