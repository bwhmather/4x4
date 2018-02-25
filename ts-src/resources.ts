export class TextureManager {
    private textures: Map<string, HTMLImageElement>;
    private total: number;
    private remaining: number;

    onLoad: (textureManager: TextureManager) => any = null;
    onProgress: (
        textureManager: TextureManager, total: number, remaining: number,
    ) => any = null;

    constructor(textures) {
        this.textures = new Map();

        this.total = 0;
        this.remaining = 0;

        // XXX just going to assume that iterating over keys is fine...
        for (let name in textures) {
            this.total++;
            this.remaining++;
            let image = new Image();
            image.onload = this.textureLoaded.bind(this);
            image.src = textures[name];
            this.textures.set(name, image);
        }
    }

    private textureLoaded(name) {
        this.remaining--;

        if (this.remaining) {
            if (this.onProgress) {
                this.onProgress(this, this.total, this.remaining);
            }
        } else if (this.onLoad) {
            this.onLoad(this);
        }
    }

    get(name) {
        return this.textures.get(name);
    }
};
