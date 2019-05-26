const FILENAME_REGEXP = /(volta|notion)-([0-9]+)\.([0-9]+)\.([0-9]+)-(.+)\.(tar.gz|sh|msi)$/;
const LINUX_REGEXP = /linux(?:-openssl-(1\.0|1\.1|1\.0\.1|rhel))?/;

function parseLinux(raw) {
    let m = raw.match(LINUX_REGEXP);

    return {
        os: 'linux',
        openssl: m[1] || 'rhel'
    };
}

function parsePlatform(raw) {
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

function parseFilename(filename) {
    let m = filename.match(FILENAME_REGEXP);
    return {
        product: m[1],
        version: {
            major: m[2],
            minor: m[3],
            patch: m[4]
        },
        platform: parsePlatform(m[5]),
        ext: m[6]
    };
}

export default class Asset {
    constructor(filename, downloadCount) {
        this.filename = filename;
        this.details = parseFilename(filename);
        this.downloadCount = downloadCount;
    }

    toJSON() {
        return {
            filename: this.filename,
            details: this.details,
            download_count: this.downloadCount
        }
    }

    static parse(json) {
        return new Asset(json.name, json.download_count);
    }
}
