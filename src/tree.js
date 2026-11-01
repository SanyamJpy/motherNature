import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/*
 * Tree class
 */

export default class Tree {
  constructor(trunkHeight = 3.5) {
    this.group = new THREE.Group();

    //* Tree parameters
    this.parameters = {
      trunkHeight: trunkHeight,
      trunkThickness: 0.5,
      leavesHeight: 1.5,
      leavesWidth: 1.5,
      leavesLength: 1.5,
      trunkLeaves: {
        count: 5,
        spread: 0.9,
        heightVariation: 0.2,
        scale: 0.75,
        scaleVariation: 0.1,
      },
      branches: {
        branchCount: 3,
        projection: 1.8,
        height: 0.5,
        thickness: 0.4,
        leafCount: 3,
        leafPositionVariation: 0.17,
        leafSpread: 0.4,
        leafScaleVariation: 0.2,
      },
    };

    //* Defining Materials once
    this.trunkMaterial = new THREE.MeshStandardMaterial({
      color: "#614736",
      metalness: 0,
      roughness: 0.5,
      wireframe: false,
    });

    this.leavesMaterial = new THREE.MeshStandardMaterial({
      color: "#1d5d26",
      metalness: 0,
      roughness: 0.5,
      wireframe: false,
      opacity: 0.9,
      // transparent: true,
    });

    //* Minimum trunk height for branches to be created
    this.minimumTrunkHeightForBranches = 2;

    //* List of leaves for future reference
    this.leavesList = [];

    //* tracking the branch direction to avoid overlapping branches
    this.branchLastRotation = null;

    //* Create the tree
    this.createLeafGeometries();
    this.createTrunk();
    this.createTrunkLeaves();
  }

  //* Creating Leaf Geometries once to reuse them for all leaves and branches
  createLeafGeometries() {
    this.leavesGeometry = new RoundedBoxGeometry(
      this.parameters.leavesWidth,
      this.parameters.leavesHeight,
      this.parameters.leavesLength,
      2,
      0.06,
    );

    this.branchLeavesGeometry = new RoundedBoxGeometry(
      this.parameters.leavesWidth * 0.5,
      this.parameters.leavesHeight * 0.5,
      this.parameters.leavesLength * 0.5,
      2,
      0.06,
    );
  }

  //* Creating main trunk and adding branches
  createTrunk() {
    const trunkGeometry = new RoundedBoxGeometry(
      this.parameters.trunkThickness,
      this.parameters.trunkHeight,
      this.parameters.trunkThickness,
      2,
      0.02,
    );

    const trunk = new THREE.Mesh(trunkGeometry, this.trunkMaterial);
    trunk.position.y = this.parameters.trunkHeight / 2;
    trunk.name = "trunk";
    this.group.add(trunk);

    // Adding branches if trunk is tall enough
    if (this.parameters.trunkHeight > this.minimumTrunkHeightForBranches) {
      // Start a fresh rotation sequence whenever the trunk is rebuilt.
      this.branchLastRotation = null;
      for (let i = 0; i < this.parameters.branches.branchCount; i++) {
        this.createBranches();
      }
    }
  }

  //* Creating leaves and adding them to the treeTrunk; debugging purposes only, not used in final tree
  createLeaves(randomness = 0, scale = 1) {
    const leaf = this.createLeafMesh(
      this.leavesGeometry,
      "trunkLeaf",
      0,
      0,
      0,
      scale,
    );

    // Position one additional leaf around the top of the trunk.
    leaf.position.y =
      this.parameters.trunkHeight + this.parameters.leavesHeight / 2;

    // Randomness in X and Z moves the additional leaf around the trunk.
    leaf.position.x =
      (Math.random() - 0.5) *
      (randomness * (this.parameters.leavesWidth / 1.5));
    leaf.position.z =
      (Math.random() - 0.5) *
      (randomness * (this.parameters.leavesLength / 1.5));

    this.leavesList.push(leaf);
    this.group.add(leaf);
  }

  //* Create a randomized cluster of smaller leaves around the top of the trunk
  createTrunkLeaves() {
    const trunkLeaves = new THREE.Group();
    trunkLeaves.name = "trunkLeaves";

    const leafCount = Math.max(
      0,
      Math.floor(this.parameters.trunkLeaves.count),
    );
    const { spread, heightVariation, scale, scaleVariation } =
      this.parameters.trunkLeaves;

    for (let i = 0; i < leafCount; i++) {
      // Distribute leaves around the trunk, with a little angular and radial randomness.
      const baseAngle = (i / leafCount) * Math.PI * 2;
      const angle = baseAngle + (Math.random() - 0.5) * (Math.PI / 3);
      const radius = spread * (0.65 + Math.random() * 0.35);
      const leafScale = scale * (1 + (Math.random() * 2 - 1) * scaleVariation);
      const leafY =
        this.parameters.trunkHeight +
        (this.parameters.leavesHeight * leafScale) / 2 +
        (Math.random() * 2 - 1) * heightVariation;

      const leaf = this.createLeafMesh(
        this.leavesGeometry,
        "trunkLeaf",
        Math.cos(angle) * radius,
        leafY,
        Math.sin(angle) * radius,
        leafScale,
      );

      // Keep direct references to individual leaves for later inspection or control.
      this.leavesList.push(leaf);
      trunkLeaves.add(leaf);
    }

    this.group.add(trunkLeaves);
  }

  //* Creating branches and adding them to the treeTrunk
  createBranches() {
    const branchProjection =
      this.parameters.branches.projection * Math.random() * 0.5 + 0.75;
    const branchGeometry = new RoundedBoxGeometry(
      branchProjection,
      this.parameters.branches.thickness,
      this.parameters.branches.thickness,
      2,
      0.01,
    );
    const branch = new THREE.Mesh(branchGeometry, this.trunkMaterial);
    branch.name = "branch";

    // Random Y position for the branch along the trunk
    const branchYPosFromTrunkCenter = Math.random() * 2 + 1;
    const branchYPos =
      this.parameters.trunkHeight * 0.5 +
      branchYPosFromTrunkCenter * this.parameters.branches.thickness;

    // Random rotation for the branch around the trunk
    const branchPivot = new THREE.Group();
    branchPivot.name = "branch + branchLeaves";

    // Rotation around the Y axis (0, 90, 180, 270 degrees)
    const rotationOptions = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

    // Exclude the previous branch's direction, then choose from the remaining options.
    const availableRotations =
      this.branchLastRotation === null
        ? rotationOptions
        : rotationOptions.filter(
            (rotation) => rotation !== this.branchLastRotation,
          );
    const randomRotation =
      availableRotations[Math.floor(Math.random() * availableRotations.length)];
    this.branchLastRotation = randomRotation;

    branchPivot.rotation.y = randomRotation;

    // Positioning
    branch.position.x =
      (this.parameters.trunkThickness + branchProjection) * 0.5;
    branch.position.y = branchYPos;

    // Creating leaves for the branch and adding them to the branchPivot
    const branchLeaves = this.createBranchLeaves(branchProjection, branchYPos);
    branchPivot.add(branch, branchLeaves);
    this.group.add(branchPivot);
  }

  //* Creating leaves for the branches
  createBranchLeaves(projection, height) {
    /**
     * projection: distance from the trunk to the leaves
     * height: height of the leaves from the ground
     */
    const branchLeaves = new THREE.Group();
    branchLeaves.name = "branchLeaves";

    // Use evenly spaced X positions so random placement cannot bunch all the leaves together.
    const leafCount = Math.max(
      0,
      Math.floor(this.parameters.branches.leafCount),
    );

    // domain for the leaves X pos
    const startLeafX = this.parameters.trunkThickness * 0.5 + projection * 0.25;
    const endLeafX = projection + this.parameters.leavesWidth * 0.25;

    const positionVariation = this.parameters.branches.leafPositionVariation;
    const leafSpread = this.parameters.branches.leafSpread;
    const scaleVariation = this.parameters.branches.leafScaleVariation;

    for (let i = 0; i < leafCount; i++) {
      // track the progress of the leaf along the branch to space them out evenly, then add some randomness to their position
      const progress = leafCount === 1 ? 0.5 : i / (leafCount - 1);
      const evenlySpacedX = startLeafX + progress * (endLeafX - startLeafX);
      // Add some randomness to the X position of the leaves so they don't all line up perfectly
      const xJitter = (Math.random() * 2 - 1) * positionVariation;
      // Clamp the X position of the leaves so they don't go outside the branch
      const leafX = Math.min(
        endLeafX,
        Math.max(startLeafX, evenlySpacedX + xJitter),
      );

      // Stagger leaves in height and depth so their individual shapes stay visible.
      const depthProgress = leafCount === 1 ? 0.5 : progress;
      // depth = Z offset from the branch, height = Y offset from the branch
      const depthOffset = (depthProgress - 0.5) * leafSpread;
      const heightOffset = (i % 2 === 0 ? -1 : 1) * leafSpread * 0.25;
      // Y pos
      const leafY =
        height + heightOffset + (Math.random() * 2 - 1) * positionVariation;

      // Z pos
      const leafZ = depthOffset + (Math.random() * 2 - 1) * positionVariation;

      // Scale variation
      const leafScale = 1 + (Math.random() * 2 - 1) * scaleVariation;

      branchLeaves.add(this.createBranchLeaf(leafX, leafY, leafZ, leafScale));
    }

    return branchLeaves;
  }

  //* Create one branch leaf so every branch leaf uses the same geometry and material
  createBranchLeaf(x, y, z, scale) {
    return this.createLeafMesh(
      this.branchLeavesGeometry,
      "branchLeaf",
      x,
      y,
      z,
      scale,
    );
  }

  //* Create a leaf mesh with the requested geometry, name, position, and scale
  createLeafMesh(geometry, name, x, y, z, scale) {
    const leaf = new THREE.Mesh(geometry, this.leavesMaterial);
    leaf.name = name;
    leaf.position.set(x, y, z);
    leaf.scale.setScalar(scale);

    return leaf;
  }

  //* Rebuild the tree by disposing of old geometries and creating new ones
  rebuild() {
    // get all geometries in the group and dispose of them
    const geometries = new Set();
    // add all geometries in the group to the set
    this.group.traverse((object) => {
      if (object.geometry) {
        geometries.add(object.geometry);
      }
    });

    // console.log("disposing geometries", geometries.size);
    // console.log(geometries);

    // Dispose of all geometries
    geometries.forEach((geometry) => geometry.dispose());
    this.group.clear();
    this.leavesList = [];

    // Recreate the tree
    this.createLeafGeometries();
    this.createTrunk();
    this.createTrunkLeaves();
  }
}
