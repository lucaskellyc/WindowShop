class ResourceSet {
  constructor() {
    this.materials = [];
    this.textures = [];
    this.videos = [];
  }
  load(loader, assets) {
    for (let i = 0; i < assets.textures.length; i++) {
      this.textures[i] = {};
      this.textures[i].name = assets.textures[i].name;
      this.textures[i].items = [];
      assets.textures[i].items.forEach(async (item, index) => {
        this.textures[i].items.push({});
        this.textures[i].items[index].type = item.type;
        this.textures[i].items[index].texture = await loader.load(item.src);
      });
    }
    for (let i = 0; i < assets.videos.length; i++) {
      this.videos[i] = {};
      this.videos[i].name = assets.videos[i].name;
      this.videos[i].video = document.createElement("video");
      this.videos[i].video.src = assets.videos[i].src;
      this.videos[i].video.loop = true;
      this.videos[i].video.muted = true;
    }
  }
}
