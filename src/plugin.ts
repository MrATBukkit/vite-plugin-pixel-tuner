import {normalizePath, Plugin, ResolvedConfig} from 'vite';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import {promises as fsPromises} from 'fs';
import os from 'os';
import fs from 'fs';

const { mkdir, rm, copyFile } = fsPromises;

const idMap: { [key: string]: { filePath: string, query: string, hashedFilename: string|undefined } } = {};

export function VitePixelTuner(): Plugin {// Variable, um den Wurzelpfad zu speichern
    let config: ResolvedConfig

    const tempDir = path.join(os.tmpdir(), 'vite-pixel-tuner');

    return {
        name: 'vite-plugin-pixel-tuner',
        enforce: 'pre',
        configResolved(resolvedConfig) {// Speichern Sie den Wurzelpfad
            config = resolvedConfig;
        },
        async buildStart() {
            // Erstelle den temporären Ordner, wenn er noch nicht existiert
            if (!fs.existsSync(tempDir)) {
                await mkdir(tempDir, { recursive: true });
            } else {
                // Wenn der Ordner bereits existiert, leeren Sie ihn
                const files = await fsPromises.readdir(tempDir);
                for (const file of files) {
                    const filePath = path.join(tempDir, file);
                    await rm(filePath, { recursive: true });
                }
            }
        },
        async writeBundle()
        {
            for (const [key, value] of Object.entries(idMap)) {
                const destPath = path.join(config.root, config.build.outDir, config.build.assetsDir, value.hashedFilename ?? '');
                await mkdir(path.dirname(destPath), { recursive: true });
                await copyFile(value.filePath, destPath);
            }

            // Leere den temporären Ordner am Ende des Builds
            const files = await fsPromises.readdir(tempDir);
            for (const file of files) {
                const filePath = path.join(tempDir, file);
                await rm(filePath, { recursive: true });
            }
        },
        resolveId(source) {
            const [filePath, query] = source.split('?');
            const fileExtension = path.extname(filePath).slice(1);

            if (['png', 'jpg', 'jpeg', 'gif'].includes(fileExtension) && query) {
                const {dir, name} = path.parse(filePath);
                const params = new URLSearchParams(query);
                const width = params.get('width') || params.get('w') || '0';
                const height = params.get('height') || params.get('h') || '0';
                const quality = params.get('quality') || params.get('q') || '100';
                const newId = normalizePath(path.join(dir, `${filePath}-w${width}-h${height}-q${quality}.${fileExtension}`));

                idMap[newId] = {filePath, query, hashedFilename: undefined};

                return newId;
            }

            return null;
        },
        async load(id) {
            const fileExtension = path.extname(id).slice(1);

            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension) && idMap[id]) {
                const {filePath, query} = idMap[id];
                const params = new URLSearchParams(query);
                const width = parseInt(params.get('width') || params.get('w') || '0', 10);
                const height = parseInt(params.get('height') || params.get('h') || '0', 10);
                const format = params.get('format') || fileExtension;
                const quality = parseInt(params.get('quality') || params.get('q') || '100', 10);

                const absolutePath = path.join(config.root, 'src', filePath);
                const image = sharp(absolutePath);

                if (width || height) {
                    image.resize(width || undefined, height || undefined);
                }

                if (quality < 100) {
                    image.jpeg({quality});
                }

                if (format) {
                    image.toFormat(format as sharp.AvailableFormatInfo["id"]);
                }

                const imageBuffer = await image.toBuffer();

                if (config.command === 'serve') { // Wenn in Entwicklungsmodus
                    const base64Image = imageBuffer.toString('base64');
                    return `export default "data:image/${format};base64,${base64Image}"`;
                } else {
                    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
                    const hashedFilename = `${path.basename(filePath, path.extname(filePath))}-${hash}.${format}`;
                    const tempImagePath = path.join(tempDir, hashedFilename);

                    try {
                        await fsPromises.writeFile(tempImagePath, imageBuffer);
                    } catch (err) {
                        console.error(`Fehler beim Speichern des Bildes: ${err.message}`);
                        throw err;
                    }

                    idMap[id]['filePath'] = tempImagePath;
                    idMap[id]['hashedFilename'] = hashedFilename;

                    const publicImagePath = '/' + config.build.assetsDir + '/' + hashedFilename;
                    return `export default "${publicImagePath}"`;
                }
            }
        },
    };
}
