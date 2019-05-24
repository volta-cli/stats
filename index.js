var request = require('request-promise');
var semver = require('semver');
var _ = require('lodash');
var fs = require('fs-extra');

async function githubReleases(org, repo) {
    return await request({
        uri: "https://api.github.com/repos/" + org + "/" + repo + "/releases",
        headers: { 'user-agent': 'node.js' }
    });
}

// async function cachedVoltaReleases(filename) {
//     return await fs.readFile(filename, 'utf8');
// }

function extractVersions(raw) {
    return JSON.parse(raw)
        .map(release => ({
            name: release.name,
            assets: release.assets.map(asset => ({
                filename: asset.name,
                count: asset.download_count
            }))
        }));
}

const FILENAME_REGEXP = /(volta|notion)-([0-9]+)\.([0-9]+)\.([0-9]+)-(.+)\.(tar.gz|sh|msi)$/;
const LINUX_REGEXP = /linux(?:-openssl-(1\.0|1\.1|1\.0\.1|rhel))?/;

function parseLinux(raw) {
    let m = raw.match(LINUX_REGEXP);

    return {
        os: 'linux',
        openssl: m[1] || 'rhel'
    };
}

function parseOS(raw) {
    switch (raw) {
        case 'macos':
            return {
                os: 'macos',
                arch: 'x86_64'
            };

        case 'windows-x86_64':
            return {
                os: 'windows',
                arch: 'x86_64'
            };
        
        default:
            return parseLinux(raw);
    }
}

function parseAsset(filename) {
    let m = filename.match(FILENAME_REGEXP);
    return {
        product: m[1],
        version: {
            major: m[2],
            minor: m[3],
            patch: m[4]
        },
        platform: parseOS(m[5]),
        ext: m[6]
    };
}

function normalizePlatform(platform) {
    switch (platform.os) {
        case 'windows':
        case 'macos':
            return platform.os + "-" + platform.arch;
        case 'linux':
            return platform.os + "-openssl-" + platform.openssl;
    }
}

async function main() {
    let releases = await githubReleases('volta-cli', 'volta');
    let versions = extractVersions(releases);
    let stats = versions.map(version => {
        let assets = version.assets.map(asset => ({
            asset: parseAsset(asset.filename),
            count: asset.count
        }));
        let grouped = _.groupBy(assets, asset => asset.asset.platform.os);
        let collated =  _.mapValues(grouped, group => {
            return {
                product: group[0].asset.product,
                version: group[0].asset.version,
                count: _.sumBy(group, asset => asset.count)
            }
        });
        return collated;
    });

    console.log("Product,Version,Major,Minor,Patch,macOS,Linux,Windows,Total");

    for (let { linux, macos, windows } of stats) {
        let product = macos.product;
        let version = `${macos.version.major}.${macos.version.minor}.${macos.version.patch}`;
        let major = macos.version.major;
        let minor = macos.version.minor;
        let patch = macos.version.patch;
        macos = macos.count;
        linux = linux ? linux.count : 0;
        windows = windows ? windows.count : 0;
        console.log(`${product},${version},${major},${minor},${patch},${macos},${linux},${windows}`);
    }
}

main();
