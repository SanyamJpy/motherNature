import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import GUI from "lil-gui";
import Tree from "./tree.js";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 400 });

// Debug object
const debugObject = {};

debugObject.createLeaves = () => {
  console.log("added leaves");

  tree1.createLeaves(2.5, 0.6 + Math.random() * 0.4);
};

debugObject.createBranches = () => {
  console.log("added branches");
  // console.log(tree.group);

  if (tree1.parameters.trunkHeight > 2) {
    tree1.createBranches();
  } else {
    console.log("tree small");
  }
};

// Add to GUI
gui.add(debugObject, "createLeaves");
gui.add(debugObject, "createBranches");

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Axes Helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({
    color: "#42614b",
    metalness: 0,
    roughness: 0.9,
  }),
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Tree
 */

const tree1 = new Tree();
scene.add(tree1.group);
console.log(tree1);

// for (let i = 0; i < 20; i++) {
//   const tree = new Tree(Math.random() * 2 + 2);
//   tree.group.position.x = Math.random() * 30 - 15;
//   tree.group.position.z = Math.random() * 30 - 15;
//   scene.add(tree.group);
// }

gui.add(tree1.leavesMaterial, "wireframe");
gui
  .add(tree1.parameters, "trunkHeight")
  .min(2)
  .max(10)
  .step(0.1)
  .onFinishChange(() => tree1.rebuild());

// Add leafSpread to GUI
gui
  .add(tree1.parameters.branches, "leafSpread")
  .min(0.1)
  .max(2)
  .step(0.01)
  .onFinishChange(() => tree1.rebuild());

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.set(-4, 4, 5);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
