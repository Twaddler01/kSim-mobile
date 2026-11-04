import { svgToImage } from "./svgToImage.js";
import { tilesets } from "../assets/icons/tiles/index.js";

const TILE_IMAGE_SIZE = 96;
let _cache = null;
let _promise = null;

export function buildTileSprites() {
    if (_cache) return Promise.resolve(_cache);
    if (_promise) return _promise;

    _promise = (async () => {
        const cache = {};

        for (const [tilesetName, drawings] of Object.entries(tilesets)) {
            cache[tilesetName] = {};
            await Promise.all(
                Object.entries(drawings).map(async ([tileName, draw]) => {
                    const img = await svgToImage(draw, TILE_IMAGE_SIZE);
                    if (img) cache[tilesetName][tileName] = img;
                })
            );
        }

        _cache = cache;
        return cache;
    })();

    return _promise;
}

export function getTileCache() {
    return _cache;
}
