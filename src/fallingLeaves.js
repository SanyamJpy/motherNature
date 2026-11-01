import * as THREE from "three";

// Create one lightweight particle cloud and distribute its particles across all trees.
export default function createFallingLeaves(
  trees,
  scene,
  particlesPerTree = 10,
) {
  const particleCount = trees.length * particlesPerTree;
  const positions = new Float32Array(particleCount * 3);
  const particles = Array.from({ length: particleCount }, (_, index) => ({
    tree: trees[index % trees.length],
    speed: 0.2 + Math.random() * 0.7,
    driftX: (Math.random() - 0.5) * 0.25,
    driftZ: (Math.random() - 0.5) * 0.25,
  }));
  const treePosition = new THREE.Vector3();

  // Place a particle near its tree's canopy, or scatter it through the fall area initially.
  function resetParticle(index, scatterThroughFallArea = false) {
    const particle = particles[index];
    const tree = particle.tree;
    tree.group.getWorldPosition(treePosition);

    const maxRadius = Math.max(
      tree.parameters.branches.projection,
      tree.parameters.trunkLeaves.spread,
    );
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.3 + Math.random() * maxRadius;
    const canopyTop = treePosition.y + tree.parameters.trunkHeight;

    const particleY = scatterThroughFallArea
      ? treePosition.y +
        0.2 +
        Math.random() * (canopyTop - treePosition.y - 0.2)
      : canopyTop + Math.random() * 0.5;
    const positionIndex = index * 3;

    positions[positionIndex] = treePosition.x + Math.cos(angle) * radius;
    positions[positionIndex + 1] = particleY;
    positions[positionIndex + 2] = treePosition.z + Math.sin(angle) * radius;
  }

  // Assign particles to trees and start them at different heights for an immediate effect.
  for (let i = 0; i < particleCount; i++) {
    resetParticle(i, true);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // Small warm-colored points suggest leaves without creating a mesh for every particle.
  const material = new THREE.PointsMaterial({
    color: "#1d5d26",
    size: 0.06,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "fallingLeaves";
  points.visible = false;
  points.frustumCulled = false;
  scene.add(points);

  return {
    points,
    update(deltaTime) {
      for (let i = 0; i < particleCount; i++) {
        const particle = particles[i];
        const positionIndex = i * 3;

        positions[positionIndex] += particle.driftX * deltaTime;
        positions[positionIndex + 1] -= particle.speed * deltaTime;
        positions[positionIndex + 2] += particle.driftZ * deltaTime;

        // Restart each particle at its tree's canopy after it falls below the ground.
        if (positions[positionIndex + 1] < 0) {
          resetParticle(i);
        }
      }

      geometry.attributes.position.needsUpdate = true;
    },
  };
}
