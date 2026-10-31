import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/*
 * Tree class
 */

export default class Tree {
  constructor(trunkHeight = 3) {
    this.group = new THREE.Group();

    //* Tree parameters
    this.parameters = {
      trunkHeight: trunkHeight,
      trunkThickness: 0.5,
      leavesHeight: 1.5,
      leavesWidth: 1.5,
      leavesLength: 1.5,
      branches: {
        projection: 1.8,
        height: 0.5,
        thickness: 0.4,
        leafCount: 3,
        leafPositionVariation: 0.17,
        leafSpread: 0.7,
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
      transparent: true,
    });

    //* Minimum trunk height for branches to be created
    this.minimumTrunkHeightForBranches = 2;

    //* List of leaves for future reference
    this.leavesList = [];

    //* tracking the branch direction to avoid overlapping branches
    this.branchRotation = null;

    //* Create the tree
    this.createLeafGeometries();
    this.createTrunk();
    this.createLeaves();
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
      this.branchRotation = null;
      for (let i = 0; i < 2; i++) {
        this.createBranches();
      }
    }
  }

  //* Creating leaves and adding them to the treeTrunk
  createLeaves(randomness = 0, scale = 1) {
    const leaves = new THREE.Mesh(this.leavesGeometry, this.leavesMaterial);
    leaves.name = "leaves";

    // Position
    leaves.position.y =
      this.parameters.trunkHeight + this.parameters.leavesHeight / 2;

    // Randomness in X and Z position to make the leaves look more natural
    leaves.position.x =
      (Math.random() - 0.5) *
      (randomness * (this.parameters.leavesWidth / 1.5));
    leaves.position.z =
      (Math.random() - 0.5) *
      (randomness * (this.parameters.leavesLength / 1.5));

    // Scale
    leaves.scale.setScalar(scale);

    // Add leaves to the list and the group
    this.leavesList.push(leaves);
    this.group.add(leaves);
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
      this.branchRotation === null
        ? rotationOptions
        : rotationOptions.filter(
            (rotation) => rotation !== this.branchRotation,
          );
    const randomRotation =
      availableRotations[Math.floor(Math.random() * availableRotations.length)];
    this.branchRotation = randomRotation;

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
    const leaves = new THREE.Group();
    leaves.name = "branchLeaves";

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

      leaves.add(this.createBranchLeaf(leafX, leafY, leafZ, leafScale));
    }

    return leaves;
  }

  //* Create one branch leaf so every leaf uses the same geometry and material
  createBranchLeaf(x, y, z, scale) {
    const leaf = new THREE.Mesh(this.branchLeavesGeometry, this.leavesMaterial);
    leaf.name = "branchLeaf";
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
    this.createLeaves();
  }
}
