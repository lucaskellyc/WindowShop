import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { NodeToyMaterial } from "@nodetoy/three-nodetoy";

import interact from "interactjs";

import { shaderData } from "./shaders.js";
import { ResourceSet } from "./resources.js";
import { Column } from "./column.js";

import assets from "./assets.json";
import { texture } from "three/src/nodes/TSL.js";

let scenes = [new THREE.Scene(), new THREE.Scene(), new THREE.Scene()],
  cameras = [];
let renderers = [];
let container = document.getElementById("columns");

let active = [true, true, true];

let touchScroll = 0;
let touchMode;
touchMode = window.matchMedia("(pointer: coarse)").matches;

for (let i = 0; i < 3; i++) {
  cameras.push(
    new THREE.PerspectiveCamera(75, 300 / window.innerHeight, 0.1, 1000),
  );
}
for (let i = 0; i < 3; i++) {
  renderers.push(new THREE.WebGLRenderer({ alpha: true, antialias: false }));
}

const resources = new ResourceSet();
const loadManager = new THREE.LoadingManager();
const meshLoader = new GLTFLoader(loadManager);
const texLoader = new THREE.TextureLoader(loadManager);

let meshesLoaded = false,
  texturesLoaded = false;

resources.load(texLoader, assets.resources);

const downtown = new Column(THREE);
const midtown = new Column(THREE);
const uptown = new Column(THREE);

loadManager.onProgress = (url, loaded, total) => {
  //console.log(url, loaded + "/" + total);
};

loadManager.onLoad = () => {
  if (!texturesLoaded && !meshesLoaded) {
    texturesLoaded = true;
    downtown.loadMeshes(meshLoader, assets.columns[0]);
    midtown.loadMeshes(meshLoader, assets.columns[1]);
    uptown.loadMeshes(meshLoader, assets.columns[2]);
  } else if (texturesLoaded && !meshesLoaded) {
    meshesLoaded = true;
    uptown.loaded = true;
    midtown.loaded = true;
    downtown.loaded = true;
    downtown.setup(
      THREE,
      scenes[0],
      resources.textures,
      shaderData,
      NodeToyMaterial,
    );
    midtown.setup(
      THREE,
      scenes[1],
      resources.textures,
      shaderData,
      NodeToyMaterial,
    );
    uptown.setup(
      THREE,
      scenes[2],
      resources.textures,
      shaderData,
      NodeToyMaterial,
    );
  }
};

renderers.forEach((renderer) => {
  renderer.setSize(300, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
});

window.addEventListener("resize", () => {
  cameras.forEach((camera) => {
    camera.aspect = 300 / window.innerHeight;
    camera.updateProjectionMatrix();
  });
  renderers.forEach((renderer) => {
    renderer.setSize(300, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
});

cameras[0].position.y = -5;
cameras[0].position.z = 5;
cameras[1].position.y = -5;
cameras[1].position.z = 5;
cameras[2].position.y = -5;
cameras[2].position.z = 5;

function timeout(index) {
  active[index] = false;
}
let timers = [
  setTimeout(() => timeout(0), 500),
  setTimeout(() => timeout(1), 500),
  setTimeout(() => timeout(2), 500),
];

renderers[0].domElement.addEventListener("wheel", (event) => {
  active[0] = true;
  downtown.scroll(event.deltaY / 10);
  clearTimeout(timers[0]);
  timers[0] = setTimeout(() => timeout(0), 1000);
});
renderers[1].domElement.addEventListener("wheel", (event) => {
  active[1] = true;
  midtown.scroll(event.deltaY / 10);
  clearTimeout(timers[1]);
  timers[1] = setTimeout(() => timeout(1), 1000);
});
renderers[2].domElement.addEventListener("wheel", (event) => {
  active[2] = true;
  uptown.scroll(event.deltaY / 10);
  clearTimeout(timers[2]);
  timers[2] = setTimeout(() => timeout(2), 1000);
});

interact(renderers[1].domElement)
  .draggable({
    inertia: true,
    inertia: {
      resistance: 4,
      allowResume: true,
    },
    onstart: (event) => {
      touchMode = window.matchMedia("(pointer: coarse)").matches;
      if (touchMode) {
        touchScroll = 0;
        active[1] = true;
      }
    },
    onmove: (event) => {
      if (touchMode) {
        touchScroll = event.dy / 5;
        midtown.scroll(-touchScroll);
      }
    },
    onend: (event) => {
      clearTimeout(timers[1]);
      timers[1] = setTimeout(() => timeout(1), 1000);
    },
  })
  .styleCursor(false);

function animate() {
  requestAnimationFrame(animate);
  NodeToyMaterial.tick();

  if (downtown.loaded) {
    renderers[0].render(scenes[0], cameras[0]);
    downtown.update();
    if (!active[0]) {
      downtown.scroll(1);
    }
  }
  if (midtown.loaded) {
    renderers[1].render(scenes[1], cameras[1]);
    midtown.update();
    if (!active[1] && !touchMode) {
      midtown.scroll(-1);
    }
  }
  if (uptown.loaded) {
    renderers[2].render(scenes[2], cameras[2]);
    uptown.update();
    if (!active[2]) {
      uptown.scroll(1);
    }
  }
}
animate();
