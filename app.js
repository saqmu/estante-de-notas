// ============================================================
// 1. CONFIGURAÇÃO BASE THREE.JS & ILUMINAÇÃO ESTÚDIO SOFT CLAY
// ============================================================
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 11.2);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.background = new THREE.Color('#d7c4b7'); // Fundo café com leite

// Iluminação Suave
const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.9);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
dirLight.position.set(5, 8, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.0008;
scene.add(dirLight);

const warmFillLight = new THREE.DirectionalLight(0xffdfcb, 0.45);
warmFillLight.position.set(-5, -2, 4);
scene.add(warmFillLight);

// ============================================================
// 2. CONSTRUÇÃO DO ARMÁRIO DE MADEIRA (3 ANDARES)
// ============================================================
const shelfGroup = new THREE.Group();
scene.add(shelfGroup);

const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xdfab7b, roughness: 0.6 });
const woodBackMaterial = new THREE.MeshStandardMaterial({ color: 0xc89667, roughness: 0.8 });

const shelfWidth = 5.2, shelfHeight = 7.0, shelfDepth = 1.6, boardThickness = 0.18;

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

// Fundo
const backGeo = new THREE.BoxGeometry(shelfWidth, shelfHeight, 0.05);
const backBoard = new THREE.Mesh(backGeo, woodBackMaterial);
backBoard.position.z = -shelfDepth / 2 + 0.03;
backBoard.receiveShadow = true;

shelfGroup.add(leftSide, rightSide, topBoard, bottomBoard, backBoard);

// Prateleiras internas (divisórias)
[-1.15, 1.15].forEach(y => {
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth - boardThickness, boardThickness, shelfDepth), woodMaterial);
  shelf.position.y = y;
  shelf.receiveShadow = true;
  shelf.castShadow = true;
  shelfGroup.add(shelf);
});

// Superfície exata onde os livros se apoiam (Topo da tábua de cada andar)
const SHELF_FLOORS = [
  1.15 + boardThickness / 2,  // Topo: 1.24
 -1.15 + boardThickness / 2,  // Meio: -1.06
 -shelfHeight / 2 + boardThickness / 2 // Base: -3.41
];

// ============================================================
// 3. VASINHOS DECORATIVOS (IDÊNTICOS À IMAGEM)
// ============================================================
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

// Vaso terracota na prateleira do meio
const orangeVase = createPlant(0xdb6b51, 0x6e8e6f);
orangeVase.position.set(1.9, SHELF_FLOORS[1], 0.1);
shelfGroup.add(orangeVase);

// Vaso verde na prateleira de baixo
const greenVase = createPlant(0x4e7c69, 0x98b899);
greenVase.position.set(-1.9, SHELF_FLOORS[2], 0.1);
shelfGroup.add(greenVase);

// ============================================================
// 4. LOMBADA E TEXTURA DINÂMICA DO LIVRO
// ============================================================
function generateSpineTexture(title, hexColor) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Cor da capa
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, c.width, c.height);

  // Faixas douradas clássicas (estampa da imagem de referência)
  ctx.fillStyle = '#f5d77f';
  ctx.fillRect(25, 60, 206, 14);
  ctx.fillRect(25, 90, 206, 8);
  ctx.fillRect(25, 920, 206, 8);
  ctx.fillRect(25, 950, 206, 14);

  // Título vertical impresso
  ctx.save();
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.font = 'bold 46px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 6;
  ctx.fillText(title.toUpperCase().slice(0, 16), 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(c);
  texture.needsUpdate = true;
  return texture;
}

// ============================================================
// 5. GERENCIAMENTO DE LIVROS E POSICIONAMENTO
// ============================================================
let books = [];
const bookMeshes = [];
let editingNoteId = null;

const bookWidth = 0.34;
const bookHeight = 1.8;
const bookDepth = 1.1;
const SHELF_CAPACITY = 10;

function createBookMesh(note) {
  const spineTexture = generateSpineTexture(note.title || 'NOTA', note.color);
  const coverMat = new THREE.MeshStandardMaterial({ color: note.color, roughness: 0.5 });
  const spineMat = new THREE.MeshStandardMaterial({ map: spineTexture, roughness: 0.5 });
  const pagesMat = new THREE.MeshStandardMaterial({ color: 0xfffcf0, roughness: 0.9 });

  const materials = [coverMat, coverMat, pagesMat, pagesMat, spineMat, pagesMat];
  const geo = new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth);
  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { id: note.id };

  return mesh;
}

// Calcula as coordenadas exatas na prateleira para qualquer índice
function getSlotPosition(index) {
  const shelfIndex = Math.min(2, Math.floor(index / SHELF_CAPACITY));
  const slot = index % SHELF_CAPACITY;
  const spacing = 0.38;

  let startX = -1.9;
  if (shelfIndex === 1) startX = -2.0; // Desvio do vaso laranja
  if (shelfIndex === 2) startX = -1.1; // Desvio do vaso verde

  const x = startX + slot * spacing;
  const y = SHELF_FLOORS[shelfIndex] + bookHeight / 2;
  const z = 0.1;
  return { x, y, z, shelfIndex };
}

// Descobre o índice mais próximo para onde o livro foi arrastado
function getClosestIndexFromCoordinates(x, y) {
  let shelfIndex = 0;
  if (y > 0.4) shelfIndex = 0;
  else if (y > -1.9) shelfIndex = 1;
  else shelfIndex = 2;

  let startX = -1.9;
  if (shelfIndex === 1) startX = -2.0;
  if (shelfIndex === 2) startX = -1.1;

  const spacing = 0.38;
  let slot = Math.round((x - startX) / spacing);
  slot = Math.max(0, Math.min(SHELF_CAPACITY - 1, slot));

  const candidate = shelfIndex * SHELF_CAPACITY + slot;
  return Math.max(0, Math.min(books.length - 1, candidate));
}

// Reposiciona todos os livros com efeito elástico/bolha
function repositionBooks(excludeMesh = null) {
  books.forEach((note, index) => {
    let mesh = bookMeshes.find(m => m.userData.id === note.id);
    const targetPos = getSlotPosition(index);

    if (!mesh) {
      // Livro novo surgindo na estante
      mesh = createBookMesh(note);
      mesh.position.set(targetPos.x, targetPos.y, targetPos.z);
      mesh.scale.set(0.01, 0.01, 0.01);
      shelfGroup.add(mesh);
      bookMeshes.push(mesh);

      gsap.to(mesh.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.6,
        ease: 'back.out(2)'
      });
    } else if (mesh !== excludeMesh) {
      // Livro já existente abrindo espaço
      gsap.to(mesh.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 0.35,
        ease: 'power2.out'
      });
    }
  });
}

// ============================================================
// 6. FÍSICA DE ARRASTAR & SOLTAR (DRAG & DROP FOFO)
// ============================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.85);
const planeIntersect = new THREE.Vector3();

let draggedMesh = null;
let isDragging = false;
let startPointerPos = { x: 0, y: 0 };
let currentHoverIndex = -1;

window.addEventListener('pointerdown', (e) => {
  // Ignora cliques que atingiram a interface (botão "+", modal, etc)
  if (!modalOverlay.classList.contains('hidden')) return;
  if (e.target.closest('#btn-add-note') || e.target.closest('#note-modal')) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(bookMeshes);

  if (intersects.length > 0) {
    draggedMesh = intersects[0].object;
    startPointerPos = { x: e.clientX, y: e.clientY };
    currentHoverIndex = books.findIndex(b => b.id === draggedMesh.userData.id);
    isDragging = false;
  }
});

window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (!draggedMesh) {
    const hits = raycaster.intersectObjects(bookMeshes);
    canvas.classList.toggle('grab', hits.length > 0);
    return;
  }

  const dist = Math.hypot(e.clientX - startPointerPos.x, e.clientY - startPointerPos.y);

  if (!isDragging && dist > 7) {
    isDragging = true;
    canvas.classList.add('grabbing');

    // Efeito bolha ao levantar o livro
    gsap.to(draggedMesh.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.2, ease: 'back.out(2)' });
  }

  if (isDragging) {
    raycaster.ray.intersectPlane(dragPlane, planeIntersect);
    const localPos = shelfGroup.worldToLocal(planeIntersect.clone());

    draggedMesh.position.x = localPos.x;
    draggedMesh.position.y = localPos.y;
    draggedMesh.position.z = 0.85; // Suspenso na frente da estante

    // Leve inclinação fofa ao balançar
    const tilt = (e.clientX - startPointerPos.x) * 0.002;
    draggedMesh.rotation.z = THREE.MathUtils.clamp(-tilt, -0.22, 0.22);

    // Reorganiza os outros livros abrindo espaço
    const targetIdx = getClosestIndexFromCoordinates(localPos.x, localPos.y);
    if (targetIdx !== currentHoverIndex) {
      const [moved] = books.splice(currentHoverIndex, 1);
      books.splice(targetIdx, 0, moved);
      currentHoverIndex = targetIdx;
      repositionBooks(draggedMesh);
    }
  }
});

window.addEventListener('pointerup', () => {
  canvas.classList.remove('grabbing');

  if (!draggedMesh) return;

  if (isDragging) {
    // Soltou o livro: Efeito elástico e assentamento no novo slot
    const finalPos = getSlotPosition(currentHoverIndex);

    gsap.to(draggedMesh.position, {
      x: finalPos.x,
      y: finalPos.y,
      z: finalPos.z,
      duration: 0.5,
      ease: 'elastic.out(1.15, 0.4)'
    });

    gsap.to(draggedMesh.rotation, { x: 0, y: 0, z: 0, duration: 0.3 });
    gsap.to(draggedMesh.scale, { x: 1, y: 1, z: 1, duration: 0.3 });

    saveToStorage();
  } else {
    // Apenas um clique rápido: abre a nota para ler e editar
    const note = books.find(b => b.id === draggedMesh.userData.id);
    if (note) {
      gsap.to(draggedMesh.position, {
        z: 0.55,
        duration: 0.18,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        onComplete: () => openModal(note)
      });
    }
  }

  draggedMesh = null;
  isDragging = false;
});

// ============================================================
// 7. PERSISTÊNCIA NO NAVEGADOR (LOCAL STORAGE)
// ============================================================
function saveToStorage() {
  localStorage.setItem('shelf_notes_3d_data', JSON.stringify(books));
}

function loadFromStorage() {
  const saved = localStorage.getItem('shelf_notes_3d_data');
  if (saved) {
    try {
      books = JSON.parse(saved);
      // Aparição em cascata fofa na inicialização
      books.forEach((note, i) => {
        setTimeout(() => {
          const targetPos = getSlotPosition(i);
          const mesh = createBookMesh(note);
          mesh.position.set(targetPos.x, targetPos.y, targetPos.z);
          mesh.scale.set(0.01, 0.01, 0.01);
          shelfGroup.add(mesh);
          bookMeshes.push(mesh);

          gsap.to(mesh.scale, {
            x: 1, y: 1, z: 1,
            duration: 0.55,
            ease: 'back.out(2)'
          });
        }, i * 70);
      });
    } catch (e) {
      console.error('Erro ao restaurar notas:', e);
    }
  }
}

// ============================================================
// 8. INTERFACE DO MODAL (UI GOOGLE KEEP)
// ============================================================
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
let isDrawingOnCanvas = false;

// Checklist
const listInput = document.getElementById('list-input');
const listAddBtn = document.getElementById('list-add-btn');
const checklistUl = document.getElementById('checklist-items');
let checklistData = [];

let currentType = 'text';
let currentColor = '#d95d4f';

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    currentType = btn.dataset.tab;
  });
});

colorCircles.forEach(c => {
  c.addEventListener('click', () => {
    colorCircles.forEach(circle => circle.classList.remove('active'));
    c.classList.add('active');
    currentColor = c.dataset.color;
  });
});

// Configuração do Desenho com precisão de tela
function setupDrawing() {
  dCtx.lineWidth = 4;
  dCtx.lineCap = 'round';

  function getCanvasCoords(e) {
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  drawCanvas.addEventListener('pointerdown', (e) => {
    isDrawingOnCanvas = true;
    dCtx.strokeStyle = drawColor.value;
    const coords = getCanvasCoords(e);
    dCtx.beginPath();
    dCtx.moveTo(coords.x, coords.y);
  });

  drawCanvas.addEventListener('pointermove', (e) => {
    if (!isDrawingOnCanvas) return;
    const coords = getCanvasCoords(e);
    dCtx.lineTo(coords.x, coords.y);
    dCtx.stroke();
  });

  window.addEventListener('pointerup', () => { isDrawingOnCanvas = false; });
  drawClear.onclick = () => dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}
setupDrawing();

function renderChecklist() {
  checklistUl.innerHTML = '';
  checklistData.forEach((item, idx) => {
    const li = document.createElement('li');
    if (item.done) li.classList.add('done');
    li.innerHTML = `
      <input type="checkbox" ${item.done ? 'checked' : ''} />
      <span>${item.text}</span>
      <button type="button" style="border:none;background:none;cursor:pointer;color:#999;font-size:18px;">&times;</button>
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

listInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') listAddBtn.click();
});

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

// Salvar / Atualizar
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

  saveToStorage();
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

  saveToStorage();
  closeModal();
};

// ============================================================
// 9. LOOP DE RENDERIZAÇÃO & EFEITO PARALAXE
// ============================================================
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
  if (isDragging) return;
  mouseX = (e.clientX / window.innerWidth - 0.5) * 0.12;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 0.12;
});

function animate() {
  requestAnimationFrame(animate);

  if (!isDragging) {
    shelfGroup.rotation.y += (mouseX - shelfGroup.rotation.y) * 0.05;
    shelfGroup.rotation.x += (mouseY - shelfGroup.rotation.x) * 0.05;
  } else {
    shelfGroup.rotation.y *= 0.92;
    shelfGroup.rotation.x *= 0.92;
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Carrega as notas salvas ao iniciar
loadFromStorage();
