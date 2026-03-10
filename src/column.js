class Column {
  constructor() {
    this.segments = {};
    this.modules = {};
    this.helpers = [];

    this.loaded = false;
    this.autoScroll = true;
    this.frame = 0;

    this.origin = 0;
    this.loop = 0;
    this.breakpoint = { top: 0, bottom: 0 };
    this.cursor = 0;
    this.currentScroll = 0;
    this.shifting = false;
    this.shifter;
    this.scrollUp = false;
  }
  loadMeshes(meshLoader, assets) {
    //Preload segments
    this.segments.imports = [];
    assets.segments.forEach(async (segment, index) => {
      this.segments.imports.push({});
      await meshLoader.load(segment.mesh, (result) => {
        this.segments.imports[index].mesh = result.scene.children[0];
        this.segments.imports[index].index = segment.index;
        this.segments.imports[index].material = segment.material;
      });
    });

    //Preload modules
    this.modules.imports = [];
    for (let i = 0; i < assets.modules.length; i++) {
      this.modules.imports.push({});
      this.modules.imports[i].index = assets.modules[i].index;
      this.modules.imports[i].children = [];
      assets.modules[i].children.forEach(async (child, subindex) => {
        this.modules.imports[i].children.push({});
        await meshLoader.load(child.mesh, (result) => {
          this.modules.imports[i].children[subindex].mesh =
            result.scene.children[0];
          this.modules.imports[i].children[subindex].subindex = child.subindex;
          this.modules.imports[i].children[subindex].material = child.material;
          this.modules.imports[i].children[subindex].position = child.position;
          this.modules.imports[i].children[subindex].behavior = child.behavior;
          this.modules.imports[i].children[subindex].dimmable = child.dimmable;
        });
      });
      this.modules.imports[i].lights = assets.modules[i].lights;
    }
  }
  setup(THREE, scene, resources, shaders, NodeToyMaterial) {
    this.scene = {};
    this.scene.lights = [];
    this.scene.meshes = [];
    this.scene.dimmables = [];

    this.segments.objects = [];
    this.modules.objects = [];

    for (let i = 0; i < this.segments.imports.length; i++) {
      this.segments.objects.push({});

      this.segments.objects[i].index = this.segments.imports[i].index;

      switch (this.segments.imports[i].material.type) {
        case "standard":
          this.segments.objects[i].material = new THREE.MeshStandardMaterial();

          if (
            resources.textures.find(
              (texture) =>
                texture.name === this.segments.imports[i].material.textures,
            )
          ) {
            this.segments.objects[i].textures = resources.textures.find(
              (texture) =>
                texture.name === this.segments.imports[i].material.textures,
            ).items;
            this.segments.objects[i].textures[0].texture.flipY = false;
            if (this.segments.objects[i].textures[1]) {
              this.segments.objects[i].textures[1].texture.flipY = false;
              this.segments.objects[i].material.normalMap =
                this.segments.objects[i].textures[1].texture;
            }
            if (this.segments.objects[i].textures[2]) {
              this.segments.objects[i].textures[2].texture.flipY = false;
              this.segments.objects[i].material.metalnessMap =
                this.segments.objects[i].textures[2].texture;
            }

            this.segments.objects[i].material.map =
              this.segments.objects[i].textures[0].texture;
          }
          if (this.segments.imports[i].material.roughness) {
            this.segments.objects[i].material.roughness =
              this.segments.imports[i].material.roughness;
          }
          if (this.segments.imports[i].material.metalness) {
            this.segments.objects[i].material.metalness =
              this.segments.imports[i].material.metalness;
          }
          break;
        case "debug":
          this.segments.objects[i].material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHex(
              this.segments.imports[i].material.color,
            ),
          });
          break;
      }

      this.segments.objects[i].mesh = new THREE.Mesh(
        this.segments.imports.find(
          (segment) => segment.index === this.segments.objects[i].index,
        ).mesh.geometry,
        this.segments.objects[i].material,
      );
      this.segments.objects[i].mesh.name = "segment";
      this.segments.objects[i].mesh.receiveShadow = true;
      this.segments.objects[i].bounds = new THREE.Box3()
        .setFromObject(this.segments.objects[i].mesh)
        .getSize(new THREE.Vector3());
      this.loop += this.segments.objects[i].bounds.y;

      scene.add(this.segments.objects[i].mesh);
      this.segments.objects[i].mesh.visible = true;

      if (
        this.modules.imports.find(
          (module) => module.index === this.segments.objects[i].index,
        )
      ) {
        this.modules.objects.push({});
        this.modules.objects[i].index = this.segments.objects[i].index;
        this.modules.objects[i].children = [];
        this.modules.objects[i].lights = [];

        this.modules.imports[i].lights.forEach((light, index) => {
          this.modules.objects[i].lights.push({
            subindex: index,
            position: light.position,
            object: new THREE.PointLight(
              new THREE.Color().setHex(light.color),
              0,
            ),
          });
          this.modules.objects[i].lights[index].object.position.z =
            light.position.z;
          this.modules.objects[i].lights[index].object.position.x =
            light.position.x;
          this.modules.objects[i].lights[index].object.position.y =
            light.position.y;
          this.modules.objects[i].lights[index].power = 15;
          this.modules.objects[i].lights[index].object.castShadow = true;
          this.modules.objects[i].lights[index].object.distance = 3.5;

          if (light.behavior) {
            this.modules.objects[i].lights[index].behavior = light.behavior;
          }
          this.scene.lights.push(this.modules.objects[i].lights[index]);
          scene.add(this.modules.objects[i].lights[index].object);
        });
        this.modules.imports
          .find((module) => module.index === this.modules.objects[i].index)
          .children.forEach((child, index) => {
            this.modules.objects[i].children.push({
              subindex: index,
            });

            switch (child.material.type) {
              case "standard":
                this.modules.objects[i].children[index].material =
                  new THREE.MeshStandardMaterial();
                if (child.material.transparent) {
                  this.modules.objects[i].children[index].material.transparent =
                    true;
                  this.modules.objects[i].children[index].material.alphaTest =
                    0.5;
                }
                if (child.material.color) {
                  this.modules.objects[i].children[index].material.color =
                    new THREE.Color().setHex(child.material.color);
                }
                if (child.material.roughness) {
                  this.modules.objects[i].children[index].material.roughness =
                    child.material.roughness;
                }
                if (child.material.metalness) {
                  this.modules.objects[i].children[index].material.metalness =
                    child.material.metalness;
                }

                if (
                  resources.textures.find(
                    (texture) => texture.name === child.material.textures,
                  )
                ) {
                  this.modules.objects[i].children[index].textures =
                    resources.textures.find(
                      (texture) => texture.name === child.material.textures,
                    ).items;
                  this.modules.objects[i].children[index].textures.forEach(
                    (texture) => {
                      texture.texture.flipY = false;
                      switch (texture.type) {
                        case "diffuse":
                          this.modules.objects[i].children[index].material.map =
                            texture.texture;
                          break;
                        case "normal":
                          this.modules.objects[i].children[
                            index
                          ].material.normalMap = texture.texture;
                          break;
                        case "roughness":
                          this.modules.objects[i].children[
                            index
                          ].material.roughnessMap = texture.texture;
                          break;
                        case "alpha":
                          this.modules.objects[i].children[
                            index
                          ].material.alphaMap = texture.texture;
                          break;
                        default:
                          console.warn(`Unknown texture type: ${texture.type}`);
                      }
                    },
                  );
                  this.modules.objects[i].children[index].shadow = true;
                }
                break;
              case "unlit":
                this.modules.objects[i].children[index].material =
                  new THREE.MeshBasicMaterial({});

                this.modules.objects[i].children[index].material.map =
                  resources.textures.find(
                    (item) =>
                      item.name ===
                      this.modules.imports[i].children[index].material.textures,
                  ).items[0].texture;
                this.modules.objects[i].children[index].material.map.wrapS =
                  THREE.RepeatWrapping;
                this.modules.objects[i].children[index].material.map.wrapT =
                  THREE.RepeatWrapping;
                this.modules.objects[i].children[index].material.transparent =
                  true;
                this.modules.objects[i].children[index].material.name = "unlit";
                break;
              case "debug":
                this.modules.objects[i].children[index].material =
                  new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHex(child.material.color),
                  });
                break;
              case "nodetoy":
                this.modules.objects[i].children[index].shader =
                  shaders[
                    this.modules.imports[i].children[index].material.index
                  ];
                this.modules.objects[i].children[index].material =
                  new NodeToyMaterial({
                    data: this.modules.objects[i].children[index].shader,
                  });
                this.modules.objects[i].children[index].material.name =
                  "nodetoy";
                if (
                  this.modules.objects[i].children[index].material.uniforms.hue
                ) {
                  this.modules.objects[i].children[
                    index
                  ].material.uniforms.hue.value =
                    "" +
                    this.modules.imports[i].children[index].material.hue +
                    "";
                }
                if (
                  this.modules.objects[i].children[index].material.uniforms
                    .delay
                ) {
                  this.modules.objects[i].children[
                    index
                  ].material.uniforms.delay.value =
                    "" +
                    this.modules.imports[i].children[index].material.delay +
                    "";
                }
                this.modules.objects[i].children[index].shadow = false;

                break;
              case "television":
                this.modules.objects[i].children[index].material =
                  new THREE.MeshBasicMaterial({});
                this.modules.objects[i].children[index].video =
                  resources.videos.find(
                    (video) =>
                      video.name ===
                      this.modules.imports[i].children[index].material.texture,
                  ).video;
                this.modules.objects[i].children[index].material.map =
                  new THREE.VideoTexture(
                    this.modules.objects[i].children[index].video,
                  );
                this.modules.objects[i].children[index].video.play();
                break;
              case "interior":
                this.modules.objects[i].children[index].material =
                  new THREE.MeshBasicMaterial({});
                this.modules.objects[i].children[index].material.map =
                  resources.textures.find(
                    (item) =>
                      item.name ===
                      this.modules.imports[i].children[index].material.textures,
                  ).items[0].texture;
                this.modules.objects[i].children[index].material.map.wrapS =
                  THREE.RepeatWrapping;
                this.modules.objects[i].children[index].material.map.wrapT =
                  THREE.RepeatWrapping;
                this.modules.objects[i].children[index].material.transparent =
                  true;
                this.modules.objects[i].children[index].material.map.repeat.set(
                  2.5,
                  2.5,
                );
                this.modules.objects[i].children[index].material.name = "unlit";
                break;
            }

            this.modules.objects[i].children[index].mesh = new THREE.Mesh(
              child.mesh.geometry,
              this.modules.objects[i].children[index].material,
            );
            this.modules.objects[i].children[index].mesh.name = child.name;
            this.modules.objects[i].children[index].behavior = child.behavior;
            this.modules.objects[i].children[index].dimmable = child.dimmable;
            this.modules.objects[i].children[index].position = child.position;
            this.modules.objects[i].children[index].mesh.castShadow =
              this.modules.objects[i].children[index].shadow;
            this.modules.objects[i].children[index].mesh.receiveShadow = false;
            scene.add(this.modules.objects[i].children[index].mesh);

            this.scene.meshes.push(
              this.modules.objects[i].children[index].mesh,
            );
            if (this.modules.objects[i].children[index].dimmable) {
              this.scene.dimmables.push(
                this.modules.objects[i].children[index],
              );
            }

            if (this.modules.objects[i].children[index].behavior !== "none") {
              switch (this.modules.objects[i].children[index].behavior.type) {
                case "clockwise":
                  this.modules.objects[i].children[index].mesh.rotation.z =
                    this.modules.objects[i].children[index].behavior.start *
                    Math.PI;
                  break;
              }
            }

            this.modules.objects[i].children[index].mesh.visible = true;
          });
      }
    }

    this.breakpoint.top = this.segments.objects[0].bounds.y;
    this.breakpoint.bottom = -this.loop;

    this.scene.lights.forEach((light) => {
      light.intensity = 15;
    });

    //scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  }
  update() {
    this.frame += 1;
    this.cursor = this.origin;
    this.segments.objects.forEach((segment, index) => {
      segment.mesh.position.y = this.cursor + this.currentScroll;

      if (
        this.modules.objects.find(
          (module) => module.index === this.segments.objects[index].index,
        )
      ) {
        this.modules.objects
          .find((module) => module.index === this.segments.objects[index].index)
          .children.forEach((child) => {
            child.mesh.position.y =
              child.position.y + this.cursor + this.currentScroll;
            child.mesh.position.z = child.position.z;
            child.mesh.position.x = child.position.x;

            if (child.behavior !== "none") {
              switch (child.behavior.type) {
                case "clockwise":
                  child.mesh.rotation.z += Math.PI * child.behavior.speed;
                  break;
                case "turntable":
                  child.mesh.rotation.y += Math.PI / 500;
                  break;
                case "scroll":
                  child.mesh.material.map.offset.x += 0.001;
                  break;
              }
            }
          });
        this.modules.objects
          .find((module) => module.index === this.segments.objects[index].index)
          .lights.forEach((light) => {
            light.object.position.y =
              light.position.y + this.cursor + this.currentScroll;
            if (light.behavior && light.behavior.type) {
              switch (light.behavior.type) {
                case "flicker":
                  light.intensity =
                    light.power + Math.random() * (0.5 - 1.5) + 1.5;
                  break;
                case "alternate":
                  light.intensity =
                    Math.sin(light.behavior.delay + this.frame * 0.18) * 10;
                  break;
              }
            }
          });
      }

      this.cursor -= segment.bounds.y;

      this.scene.lights.forEach((light) => {
        light.object.intensity = Math.max(
          light.intensity - Math.abs((light.object.position.y + 5) * 4),
          0,
        );
      });
    });
  }
  scroll(velocity) {
    if (this.autoScroll) {
      this.currentScroll += velocity / 100;
    } else {
      this.currentScroll += velocity / 750;
    }

    if (
      this.cursor + this.currentScroll < this.breakpoint.bottom &&
      !this.shifting
    ) {
      this.shifter = this.segments.objects.splice(
        this.segments.objects.length - 1,
        1,
      )[0];
      this.origin += this.shifter.bounds.y;
      this.segments.objects.splice(0, 0, this.shifter);
      this.breakpoint.top = this.segments.objects[0].bounds.y;
      this.shifting = true;
    } else if (
      this.origin + this.currentScroll > this.breakpoint.top &&
      !this.shifting
    ) {
      this.shifter = this.segments.objects.splice(0, 1)[0];
      this.segments.objects.splice(
        this.segments.objects.length,
        0,
        this.shifter,
      );

      this.origin -= this.shifter.bounds.y;
      this.breakpoint.top = this.segments.objects[0].bounds.y;
      this.breakpoint.bottom = -this.loop;
      this.shifting = true;
    } else {
      this.shifting = false;
    }
  }
}
