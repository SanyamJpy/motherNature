import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/*
 * Tree class
 */

export default class Tree {
  constructor() {
    this.group = new THREE.Group();

    //* Tree parameters
    this.parameters = {
      trunkHeight: 3,
      trunkThickness: 0.5,
      leavesHeight: 1.5,
      leavesWidth: 1.5,
      leavesLength: 1.5,
      branches: {
        projection: 1.3,
        height: 0.5,
        thickness: 0.2,
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
    });

    //* Minimum trunk height for branches to be created
    this.minimumTrunkHeightForBranches = 2;

    //* List of leaves for future reference
    this.leavesList = [];

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
      this.createBranches();
    }
  }

  //* Creating leaves and adding them to the treeTrunk
  createLeaves(randomness = 0, scale = 1) {
    const leaves = new THREE.Mesh(this.leavesGeometry, this.leavesMaterial);

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

    // Random Y position for the branch along the trunk
    const branchYPosFromTrunkCenter = Math.random() * 6 + 1;
    const branchYPos =
      this.parameters.trunkHeight * 0.6 +
      branchYPosFromTrunkCenter * this.parameters.branches.thickness;

    // Random rotation for the branch around the trunk
    const branchPivot = new THREE.Group();
    const rotationOptions = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    branchPivot.rotation.y =
      rotationOptions[Math.floor(Math.random() * rotationOptions.length)];

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
    const leaves = new THREE.Mesh(
      this.branchLeavesGeometry,
      this.leavesMaterial,
    );
    // Positioning the leaves at the end of the branch
    leaves.position.x = projection + this.parameters.leavesWidth * 0.25;
    leaves.position.y = height;

    return leaves;
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
