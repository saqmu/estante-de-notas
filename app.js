// --- 1. CONFIGURAÇÃO BASE THREE.JS ---
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 11);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.background = new THREE.Color('#d7c4b7');

// Iluminação suave (estilo clay 3D)
const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.85);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
dirLight.position.set(5, 8, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);

const softLight = new THREE.DirectionalLight(0xffd5b8, 0.4);
softLight.position.set(-5, -2, 4);
scene.add(softLight);

// --- 2. ARMÁRIO DE MADEIRA ---
const shelfGroup = new THREE.Group();
scene.add(shelfGroup);

const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xdfab7b, roughness: 0.6 });
const woodBackMaterial = new THREE.MeshStandardMaterial({ color: 0xc89667, roughness: 0.8 });

const shelfWidth = 5.2, shelfHeight = 7.0, shelfDepth = 1.6, boardThickness = 0.18;

// Laterais e Fundo
const sideGeo = new THREE.BoxGeometry(boardThickness, shelfHeight, shelfDepth);
const leftSide = new THREE.Mesh(sideGeo, woodMaterial);
leftSide.position.x = -shelfWidth / 2;
leftSide.castShadow = true;
leftSide.receiveShadow = true;

const rightSide = new THREE.Mesh(sideGeo, woodMaterial);
rightSide.position.x = shelfWidth / 2;
rightSide.castShadow = true;
rightSide.receiveShadow = true;

const topBottomGeo = new THREE.BoxGeometry(shelfWidth + boardThickness, boardThickness, shelfDepth);
const topBoard = new THREE.Mesh(topBottomGeo, woodMaterial);
topBoard.position.y = shelfHeight / 2;
topBoard.castShadow = true;

const bottomBoard = new THREE.Mesh(topBottomGeo, woodMaterial);
bottomBoard.position.y = -shelfHeight / 2;
bottomBoard.receiveShadow = true;

const backGeo = new THREE.BoxGeometry(shelfWidth, shelfHeight, 0.05);
const backBoard = new THREE.Mesh(backGeo, woodBackMaterial);
backBoard.position.z = -shelfDepth / 2 + 0.03;
backBoard.receiveShadow = true;

shelfGroup.add(leftSide, rightSide, topBoard, bottomBoard, backBoard);

// Divisórias das 3 prateleiras
[-1.15, 1.15].forEach(y => {
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth - boardThickness, boardThickness, shelfDepth), woodMaterial);
  shelf.position.y = y;
  shelf.receiveShadow = true;
  shelf.castShadow = true;
  shelfGroup.add(shelf);
});

// Chão de cada andar da estante
const SHELF_FLOORS = [1.25, -1.05, -3.35];

// --- 3. PLANTINHAS DECORATIVAS ---
function createPlant(potColor, plantColor) {
  const group = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24), new THREE.MeshStandardMaterial({ color: potColor, roughness: 0.4 }));
  pot.scale.set(1, 1.2, 1);
  pot.position.y = 0.35;
  pot.castShadow = true;
  group.add(pot);

  const leafGeo = new THREE.ConeGeometry(0.08, 0.28, 6);
  const leafMat = new THREE.MeshStandardMaterial({ color: plantColor, roughness: 0.5 });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const angle = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.12, 0.72, Math.sin(angle) * 0.12);
    leaf.rotation.set(0.4, angle, 0);
    leaf.castShadow = true;
    group.add(leaf);
  }
  return group;
}

const orangeVase = createPlant(0xdb6b51, 0x6e8e6f);
orangeVase.position.set(1.9, SHELF_FLOORS[1], 0.1);
shelfGroup.add(orangeVase);

const greenVase = createPlant(0x4e7c69, 0x98b899);
greenVase.position.set(-1.9, SHELF_FLOORS[2], 0.1);
shelfGroup.add(greenVase);

// --- 4. GERADOR DE TEXTURA DA LOMBADA DO LIVRO ---
function generateSpineTexture(title, hexColor) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Cor de fundo do livro
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, c.width, c.height);

  // Faixas douradas clássicas (estilo da imagem de referência)
  ctx.fillStyle = '#f5d77f';
  // Topo
  ctx.fillRect(25, 60, 206, 14);
  ctx.fillRect(25, 90, 206, 8);
  // Base
  ctx.fillRect(25, 920, 206, 8);
  ctx.fillRect(25, 950, 206, 14);

  // Título vertical na lombada
  ctx.save();
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.font = 'bold 46px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.fillText(title.toUpperCase().slice(0, 16), 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(c);
  return texture;
}

// --- 5. GERENCIAMENTO DE LIVROS / NOTAS ---
const books = [];
const bookMeshes = [];
let editingNoteId = null;

const bookWidth = 0.34;
const bookHeight = 1.8;
const bookDepth = 1.1;

// Criar o Mesh do livro 3D
function createBookMesh(note) {
  const spineTexture = generateSpineTexture(note.title || 'NOTA', note.color);
  const coverMat = new THREE.MeshStandardMaterial({ color: note.color, roughness: 0.5 });
  const spineMat = new THREE.MeshStandardMaterial({ map: spineTexture, roughness: 0.5 });
  const pagesMat = new THREE.MeshStandardMaterial({ color: 0xfffcf0, roughness: 0.9 });

  // Materiais das 6 faces: +X, -X, +Y, -Y, +Z (Lombada virada p/ frente), -Z
  const materials = [
    coverMat, // Direita (capa)
    coverMat, // Esquerda (contracapa)
    pagesMat, // Topo (folhas)
    pagesMat, // Base
    spineMat, // Frente (Lombada visível)
    pagesMat  // Fundo
  ];

  const geo = new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth);
  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { id: note.id };

  return mesh;
}

// Calcular onde cada livro deve se posicionar na estante
function repositionBooks() {
  const shelfCapacity = 11;
  const startX = -2.0;
  const spacing = 0.38;

  books.forEach((note, index) => {
    const shelfIndex = Math.floor(index / shelfCapacity);
    if (shelfIndex > 2) return; // Limite de 3 prateleiras

    let slot = index % shelfCapacity;
    let targetX = startX + slot * spacing;

    // Desviar dos vasinhos de decoração
    if (shelfIndex === 1 && targetX > 1.4) targetX = 1.4; 
    if (shelfIndex === 2) targetX += 0.8;

    const targetY = SHELF_FLOORS[shelfIndex] + bookHeight / 2;
    const targetZ = 0.1;

    let mesh = bookMeshes.find(m => m.userData.id === note.id);

    if (!mesh) {
      // Livro novo sendo criado! Efeito elástico bolha:
      mesh = createBookMesh(note);
      mesh.position.set(targetX, targetY, targetZ);
      mesh.scale.set(0.01, 0.01, 0.01);
      shelfGroup.add(mesh);
      bookMeshes.push(mesh);

      gsap.to(mesh.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.6,
        ease: 'back.out(2)'
      });
    } else {
      // Mover suavemente para a posição correta
      gsap.to(mesh.position, {
        x: targetX, y: targetY, z: targetZ,
        duration: 0.4,
        ease: 'power2.out'
      });
    }
  });
}

// --- 6. CONTROLES DO MODAL (UI) ---
const modalOverlay = document.getElementById('modal-overlay');
const btnAddNote = document.getElementById('btn-add-note');
const btnClose = document.getElementById('modal-close');
const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');

const noteTitle = document.getElementById('note-title');
const noteText = document.getElementById('note-text');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const colorCircles = document.querySelectorAll('.color-circle');

// Canvas de Desenho
const drawCanvas = document.getElementById('draw-canvas');
const dCtx = drawCanvas.getContext('2d');
const drawColor = document.getElementById('draw-color');
const drawClear = document.getElementById('draw-clear');
let isDrawing = false;

// Checklist
const listInput = document.getElementById('list-input');
const listAddBtn = document.getElementById('list-add-btn');
const checklistUl = document.getElementById('checklist-items');
let checklistData = [];

let currentType = 'text';
let currentColor = '#d95d4f';

// Troca de Abas
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    currentType = btn.dataset.tab;
  });
});

// Escolha de Cor
colorCircles.forEach(c => {
  c.addEventListener('click', () => {
    colorCircles.forEach(circle => circle.classList.remove('active'));
    c.classList.add('active');
    currentColor = c.dataset.color;
  });
});

// Ações do Desenho
function setupDrawing() {
  dCtx.lineWidth = 4;
  dCtx.lineCap = 'round';
  dCtx.strokeStyle = drawColor.value;

  drawCanvas.onmousedown = (e) => {
    isDrawing = true;
    dCtx.beginPath();
    dCtx.moveTo(e.offsetX, e.offsetY);
  };
  drawCanvas.onmousemove = (e) => {
    if (!isDrawing) return;
    dCtx.strokeStyle = drawColor.value;
    dCtx.lineTo(e.offsetX, e.offsetY);
    dCtx.stroke();
  };
  window.onmouseup = () => isDrawing = false;
  drawClear.onclick = () => dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}
setupDrawing();

// Ações da Checklist
function renderChecklist() {
  checklistUl.innerHTML = '';
  checklistData.forEach((item, idx) => {
    const li = document.createElement('li');
    if (item.done) li.classList.add('done');
    li.innerHTML = `
      <input type="checkbox" ${item.done ? 'checked' : ''} />
      <span>${item.text}</span>
      <button style="border:none;background:none;cursor:pointer;color:#999;">&times;</button>
    `;
    li.querySelector('input').onclick = () => {
      checklistData[idx].done = !checklistData[idx].done;
      renderChecklist();
    };
    li.querySelector('button').onclick = () => {
      checklistData.splice(idx, 1);
      renderChecklist();
    };
    checklistUl.appendChild(li);
  });
}

listAddBtn.onclick = () => {
  if (!listInput.value.trim()) return;
  checklistData.push({ text: listInput.value.trim(), done: false });
  listInput.value = '';
  renderChecklist();
};

// Abrir e Fechar Modal
function openModal(note = null) {
  modalOverlay.classList.remove('hidden');

  if (note) {
    editingNoteId = note.id;
    noteTitle.value = note.title;
    noteText.value = note.text || '';
    currentColor = note.color;
    currentType = note.type || 'text';
    checklistData = note.checklist ? [...note.checklist] : [];
    btnDelete.classList.remove('hidden');

    if (note.drawing) {
      const img = new Image();
      img.onload = () => {
        dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        dCtx.drawImage(img, 0, 0);
      };
      img.src = note.drawing;
    } else {
      dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }
  } else {
    editingNoteId = null;
    noteTitle.value = '';
    noteText.value = '';
    checklistData = [];
    dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    btnDelete.classList.add('hidden');
  }

  renderChecklist();
  document.querySelector(`.tab-btn[data-tab="${currentType}"]`).click();
  document.querySelector(`.color-circle[data-color="${currentColor}"]`)?.click();
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

btnAddNote.onclick = () => openModal();
btnClose.onclick = closeModal;

// Salvar Livro / Nota
btnSave.onclick = () => {
  const title = noteTitle.value.trim() || 'Sem Título';

  if (editingNoteId) {
    const existing = books.find(b => b.id === editingNoteId);
    existing.title = title;
    existing.color = currentColor;
    existing.type = currentType;
    existing.text = noteText.value;
    existing.checklist = [...checklistData];
    existing.drawing = drawCanvas.toDataURL();

    // Atualiza textura da lombada
    const mesh = bookMeshes.find(m => m.userData.id === editingNoteId);
    if (mesh) {
      mesh.material[4].map = generateSpineTexture(title, currentColor);
      mesh.material[4].needsUpdate = true;
      mesh.material[0].color.set(currentColor);
      mesh.material[1].color.set(currentColor);
    }
  } else {
    const newNote = {
      id: Date.now(),
      title,
      color: currentColor,
      type: currentType,
      text: noteText.value,
      checklist: [...checklistData],
      drawing: drawCanvas.toDataURL()
    };
    books.push(newNote);
    repositionBooks();
  }

  closeModal();
};

// Excluir Livro
btnDelete.onclick = () => {
  if (!editingNoteId) return;

  const idx = books.findIndex(b => b.id === editingNoteId);
  if (idx !== -1) books.splice(idx, 1);

  const meshIdx = bookMeshes.findIndex(m => m.userData.id === editingNoteId);
  if (meshIdx !== -1) {
    const mesh = bookMeshes[meshIdx];
    gsap.to(mesh.scale, {
      x: 0, y: 0, z: 0,
      duration: 0.35,
      ease: 'back.in(2)',
      onComplete: () => {
        shelfGroup.remove(mesh);
        bookMeshes.splice(meshIdx, 1);
        repositionBooks();
      }
    });
  }

  closeModal();
};

// --- 7. CLIQUE NO LIVRO 3D (RAYCASTER) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointerdown', (e) => {
  if (!modalOverlay.classList.contains('hidden')) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(bookMeshes);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const note = books.find(b => b.id === clickedMesh.userData.id);

    if (note) {
      // Efeito fofo: puxar o livro um pouco para frente antes de abrir a nota
      gsap.to(clickedMesh.position, {
        z: 0.6,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        onComplete: () => openModal(note)
      });
    }
  }
});

// Efeito de movimento do mouse (profundidade)
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 0.12;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 0.12;
});

function animate() {
  requestAnimationFrame(animate);

  shelfGroup.rotation.y += (mouseX - shelfGroup.rotation.y) * 0.05;
  shelfGroup.rotation.x += (mouseY - shelfGroup.rotation.x) * 0.05;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
