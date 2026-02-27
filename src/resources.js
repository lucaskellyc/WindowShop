export class ResourceSet {
  constructor() {
    this.materials = [];
    this.textures = [];
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
  }
}
