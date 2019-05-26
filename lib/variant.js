import _ from 'lodash';

export default class Variant {
    constructor(assets) {
        this.assets = assets;
        this.downloadCount = _.sumBy(assets, asset => asset.downloadCount);
    }

    toJSON() {
        return {
            assets: this.assets.map(asset => asset.toJSON()),
            downloadCount: this.downloadCount
        };
    }

    static fromAssets(assets) {
        return new Variant(assets);
    }
}
