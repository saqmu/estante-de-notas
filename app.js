// --- CONFIGURAÇÃO BÁSICA DO THREE.JS ---
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();

// Câmera com perspectiva suave
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 11);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Fundo cor de café claro
scene.background = new THREE.Color('#d7c4b7');

// --- ILUMINAÇÃO ESTILO 3D FOFO (SOFT CLAY) ---
const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(5, 8, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);

const softLight = new THREE.DirectionalLight(0xffd5b8, 0.4);
softLight.position.set(-5, -2, 4);
scene.add(softLight);

// --- MATERIAIS ---
// Madeira clara e suave da estante (igual à foto)
const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0xdfab7b,
  roughness: 0.6,
  metalness: 0.05
});

const woodBackMaterial = new THREE.MeshStandardMaterial({
  color: 0xc89667,
  roughness: 0.8
});

// --- CONSTRUÇÃO DO ARMÁRIO ---
const shelfGroup = new THREE.Group();
scene.add(shelfGroup);

const shelfWidth = 5.2;
const shelfHeight = 7.0;
const shelfDepth = 1.6;
const boardThickness = 0.18;

// Laterais
const sideGeo = new THREE.BoxGeometry(boardThickness, shelfHeight, shelfDepth);
const leftSide = new THREE.Mesh(sideGeo, woodMaterial);
leftSide.position.x = -shelfWidth / 2;
leftSide.castShadow = true;
leftSide.receiveShadow = true;

const rightSide = new THREE.Mesh(sideGeo, woodMaterial);
rightSide.position.x = shelfWidth / 2;
rightSide.castShadow = true;
rightSide.receiveShadow = true;

// Topo e Base
const topBottomGeo = new THREE.BoxGeometry(shelfWidth + boardThickness, boardThickness, shelfDepth);
const topBoard = new THREE.Mesh(topBottomGeo, woodMaterial);
topBoard.position.y = shelfHeight / 2;
topBoard.castShadow = true;

const bottomBoard = new THREE.Mesh(topBottomGeo, woodMaterial);
bottomBoard.position.y = -shelfHeight / 2;
bottomBoard.receiveShadow = true;

// Fundo da estante
const backGeo = new THREE.BoxGeometry(shelfWidth, shelfHeight, 0.05);
const backBoard = new THREE.Mesh(backGeo, woodBackMaterial);
backBoard.position.z = -shelfDepth / 2 + 0.03;
backBoard.receiveShadow = true;

shelfGroup.add(leftSide, rightSide, topBoard, bottomBoard, backBoard);

// Prateleiras internas (3 divisórias onde ficam os livros)
const shelfYPositions = [1.15, -1.15]; // Prateleira superior e inferior
shelfYPositions.forEach(y => {
  const innerShelf = new THREE.Mesh(
    new THREE.BoxGeometry(shelfWidth - boardThickness, boardThickness, shelfDepth),
    woodMaterial
  );
  innerShelf.position.y = y;
  innerShelf.receiveShadow = true;
  innerShelf.castShadow = true;
  shelfGroup.add(innerShelf);
});

// Posições verticais do chão de cada prateleira (para apoiar livros e decorações)
// Prateleira 1 (Topo): Y = 1.25
// Prateleira 2 (Meio): Y = -1.05
// Prateleira 3 (Base): Y = -3.35
const SHELF_FLOORS = [1.25, -1.05, -3.35];

// --- DECORAÇÕES (VASINHOS DE PLANTINHAS DA IMAGEM) ---
function createPlant(potColor, plantColor) {
  const plantGroup = new THREE.Group();

  // Vaso arredondado
  const potGeo = new THREE.SphereGeometry(0.35, 24, 24);
  const potMat = new THREE.MeshStandardMaterial({ color: potColor, roughness: 0.4 });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.scale.set(1, 1.2, 1);
  pot.position.y = 0.35;
  pot.castShadow = true;
  plantGroup.add(pot);

  // Folhinhas suculentas no topo
  const leafGeo = new THREE.ConeGeometry(0.08, 0.28, 6);
  const leafMat = new THREE.MeshStandardMaterial({ color: plantColor, roughness: 0.5 });
  
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const angle = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.12, 0.72, Math.sin(angle) * 0.12);
    leaf.rotation.x = 0.4;
    leaf.rotation.y = angle;
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }

  return plantGroup;
}

// Vasinho Laranja na prateleira do meio (lado direito)
const orangeVase = createPlant(0xdb6b51, 0x6e8e6f);
orangeVase.position.set(1.9, SHELF_FLOORS[1], 0.1);
shelfGroup.add(orangeVase);

// Vasinho Verde na prateleira de baixo (lado esquerdo)
const greenVase = createPlant(0x4e7c69, 0x98b899);
greenVase.position.set(-1.9, SHELF_FLOORS[2], 0.1);
shelfGroup.add(greenVase);

// Suave flutuação/inclinação ao mover o mouse para dar profundidade
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 0.15;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 0.15;
});

// Loop de Animação
function animate() {
  requestAnimationFrame(animate);

  // Efeito suave de paralaxe com o mouse
  shelfGroup.rotation.y += (mouseX - shelfGroup.rotation.y) * 0.05;
  shelfGroup.rotation.x += (mouseY - shelfGroup.rotation.x) * 0.05;

  renderer.render(scene, camera);
}
animate();

// Responsividade
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
