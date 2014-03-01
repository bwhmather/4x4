"use strict";

var TextureManager = function(textures) {
    var image, name;
    this.textures = Object.create(null);

    this.total = 0;
    this.remaining = 0;

    // XXX just going to assume that iterating over keys is fine...
    for (name in textures) {
        this.total++;
        this.remaining++;
        image = new Image();
        image.onload = this.textureLoaded.bind(this);
        image.src = textures[name];
        this.textures[name] = image;
    }
};


TextureManager.prototype.textureLoaded = function(name) {
    this.remaining--;

    if (this.remaining) {
        if (this.onProgress) {
            this.onProgress(this, this.total, this.remaining);
        }
    } else if (this.onLoad) {
        this.onLoad(this);
    }
};


TextureManager.prototype.get = function (name) {
    return this.textures[name];
};


module.exports = {
    'TextureManager': TextureManager
};
