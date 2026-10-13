const canvas = document.getElementById("scene");
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.z = 14;

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const NODE_COUNT = window.innerWidth < 700 ? 60 : 110;
const group = new THREE.Group();
scene.add(group);

const nodes = [];
for (let i = 0; i < NODE_COUNT; i++) {
  nodes.push(
    new THREE.Vector3(
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 12,
    ),
  );
}

const pointsMaterial = new THREE.PointsMaterial({
  color: 0xe8c872,
  size: 0.16,
  transparent: true,
  opacity: 0.9,
});
group.add(
  new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(nodes),
    pointsMaterial,
  ),
);

const edges = [];
const linePoints = [];
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    if (nodes[i].distanceTo(nodes[j]) < 4.2) {
      edges.push([i, j]);
      linePoints.push(nodes[i], nodes[j]);
    }
  }
}
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0x8b6cff,
  transparent: true,
  opacity: 0.35,
});
group.add(
  new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(linePoints),
    lineMaterial,
  ),
);

const signals = [];
const signalGeometry = new THREE.SphereGeometry(0.11, 12, 12);
const signalMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

function pickEdge(signal) {
  signal.edge = edges[Math.floor(Math.random() * edges.length)];
  signal.progress = 0;
}

for (let i = 0; i < 14; i++) {
  const mesh = new THREE.Mesh(signalGeometry, signalMaterial);
  const signal = { mesh: mesh, edge: null, progress: Math.random() };
  pickEdge(signal);
  group.add(mesh);
  signals.push(signal);
}

let mouseX = 0;
let mouseY = 0;
let scrollAmount = 0;
let energy = 0; 
let energyTarget = 0;

window.addEventListener("mousemove", function (e) {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener("scroll", function () {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  scrollAmount = maxScroll > 0 ? window.scrollY / maxScroll : 0;
});

document.querySelectorAll("[data-energy]").forEach(function (card) {
  card.addEventListener("mouseenter", function () {
    energyTarget = 1;
  });
  card.addEventListener("mouseleave", function () {
    energyTarget = 0;
  });
});

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  energy += (energyTarget - energy) * 0.06;

  const speed = reduceMotion ? 0 : 1;
  group.rotation.y = time * 0.05 * speed + scrollAmount * Math.PI * 1.2;
  group.rotation.x = scrollAmount * 0.5;

  camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.04;
  camera.position.y += (-mouseY * 1.0 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  pointsMaterial.size = 0.16 + Math.sin(time * 2) * 0.03 + energy * 0.1;
  lineMaterial.opacity = 0.3 + energy * 0.4;
  lineMaterial.color.set(energy > 0.5 ? 0xe8c872 : 0x8b6cff);

  signals.forEach(function (s) {
    s.progress += (0.008 + energy * 0.02) * speed;
    if (s.progress >= 1) pickEdge(s);
    const a = nodes[s.edge[0]];
    const b = nodes[s.edge[1]];
    s.mesh.position.lerpVectors(a, b, s.progress);
  });

  renderer.render(scene, camera);
}

animate();
