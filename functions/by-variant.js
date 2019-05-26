import Release from '../lib/release';

export async function handler(event, context, callback) {
    let releases = await Release.fetchAll('volta-cli', 'volta');
    let variants = ["Product,Version,Major,Minor,Patch,macOS,Linux,Windows,Total"]
        .concat(releases.map(release => release.byVariant()));

    return {
        statusCode: 200,
        body: variants.join("\n")
    };
}
