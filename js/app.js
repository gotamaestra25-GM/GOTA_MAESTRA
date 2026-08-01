// ========== CONFIGURACIÓN ADMIN ==========
const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'Admin123';

// ========== INICIALIZACIÓN DE PRODUCTOS ==========
let allProducts = [];
let deletedProducts = [];

function loadCustomProducts() {
  const saved = localStorage.getItem('customFragrancesGM');
  if (saved) {
    try { customProducts = JSON.parse(saved); } catch (e) { customProducts = []; }
  }
  const deleted = localStorage.getItem('deletedFragrancesGM');
  if (deleted) {
    try { deletedProducts = JSON.parse(deleted); } catch (e) { deletedProducts = []; }
  }
}

function buildAllProducts() {
  allProducts = [];
  
  // Agregar productos personalizados PRIMERO
  customProducts.forEach(p => {
    allProducts.push({ ...p, isBase: false, isCustom: true });
  });

  // Productos base de data.js
  damas.forEach((nombre, idx) => {
    const num = idx + 1;
    // Si fue eliminado o editado, lo saltamos
    if (deletedProducts.includes(num)) return;
    if (customProducts.find(p => String(p.id) === String(num))) return;
    
    const extension = mujerExt[num] || 'avif';
    const imgPath = IMG_BASE_MUJER + num + "." + extension;
    allProducts.push({ id: num, nombre: nombre, genero: 'dama', imgPath: imgPath, isBase: true });
  });

  caballeros.forEach((nombre, idx) => {
    const num = idx + 10001;
    if (deletedProducts.includes(num)) return;
    if (customProducts.find(p => String(p.id) === String(num))) return;
    
    const extension = hombreExt[num - 10000] || 'avif';
    const imgPath = IMG_BASE_HOMBRE + (num - 10000) + "." + extension;
    allProducts.push({ id: num, nombre: nombre, genero: 'caballero', imgPath: imgPath, isBase: true });
  });
}

loadCustomProducts();
buildAllProducts();

// ========== VARIABLES GLOBALES ==========
let favorites = [];
let currentModalProduct = null;
let filtroGenero = 'todos';
let searchDebounceTimer = null;
let isAdminLoggedIn = false;
let editingCustomId = null;
let adminImageBase64 = null;
let acordeRowCount = 0;

// ========== DOM ELEMENTS ==========
const modalOverlay = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModalBtn');
const productosGrid = document.getElementById('productosGrid');
const searchInput = document.getElementById('searchInput');
const resultCounter = document.getElementById('resultCounter');

// ========== FUNCIONES DE AUTENTICACIÓN ==========
function openLoginModal() {
  if (isAdminLoggedIn) {
    logoutAdmin();
    return;
  }
  const overlay = document.getElementById('loginOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').style.display = 'none';
  setTimeout(() => document.getElementById('loginUser').focus(), 200);
}

function closeLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function togglePasswordVisibility() {
  const passInput = document.getElementById('loginPass');
  const btn = document.getElementById('togglePass');
  if (passInput.type === 'password') {
    passInput.type = 'text';
    btn.textContent = '🙈';
  } else {
    passInput.type = 'password';
    btn.textContent = '👁️';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    isAdminLoggedIn = true;
    closeLoginModal();
    activateEditorMode();
    showToast('Bienvenido al Modo Editor');
  } else {
    errorEl.style.display = 'block';
    const form = document.getElementById('loginForm');
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 500);
  }
}

function activateEditorMode() {
  const navBtn = document.getElementById('navUsuarioBtn');
  const mobileNavBtn = document.getElementById('mobileNavUsuarioBtn');
  if (navBtn) navBtn.textContent = 'Cerrar Sesión';
  if (mobileNavBtn) mobileNavBtn.textContent = 'Cerrar Sesión';
  
  document.getElementById('floatingAddBtn').style.display = 'flex';
  document.body.classList.add('editor-mode');
  renderProducts();
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  const navBtn = document.getElementById('navUsuarioBtn');
  const mobileNavBtn = document.getElementById('mobileNavUsuarioBtn');
  if (navBtn) navBtn.textContent = 'Usuario';
  if (mobileNavBtn) mobileNavBtn.textContent = 'Usuario';
  
  document.getElementById('floatingAddBtn').style.display = 'none';
  document.body.classList.remove('editor-mode');
  closeAdminPanel();
  renderProducts();
  showToast('Sesión cerrada correctamente');
}

// ========== FUNCIONES DEL MODAL DE DETALLES ==========
function openModal(product) {
  currentModalProduct = product;
  renderModalContent();
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  toggleMobileBars(false);
  const container = document.querySelector('.modal-container');
  if (container) container.scrollTop = 0;
  history.pushState({ modal: 'product' }, "");
}

function closeModal(isPopState = false) {
  modalOverlay.classList.remove('open');
  currentModalProduct = null;
  document.body.style.overflow = "";
  toggleMobileBars(true);
  if (isPopState !== true && window.history.state?.modal === 'product') {
    history.back();
  }
}

function getAcordesConIntensidad(nombre) {
  if (typeof acordesData !== 'undefined') {
    if (acordesData[nombre]) {
      return acordesData[nombre].map(a => ({ nombre: a[0], intensidad: a[1], color: a[2] }));
    }
    const searchName = nombre.toLowerCase().trim();
    const keys = Object.keys(acordesData);
    for (let key of keys) {
      if (key.toLowerCase().trim() === searchName) {
        return acordesData[key].map(a => ({ nombre: a[0], intensidad: a[1], color: a[2] }));
      }
    }
  }
  return [];
}

function renderModalContent() {
  if (!currentModalProduct) return;
  const generoLabel = currentModalProduct.genero === 'caballero' ? 'Caballero' : 'Dama';

  // Obtener acordes: primero los del producto custom, luego de acordesData
  let acordes = [];
  if (currentModalProduct.acordes && currentModalProduct.acordes.length > 0) {
    acordes = currentModalProduct.acordes;
  } else {
    acordes = getAcordesConIntensidad(currentModalProduct.nombre);
  }

  let acordesHtml = '';
  let acordesTitulo = '';
  if (acordes.length > 0) {
    acordesTitulo = '<div class="acordes-titulo"> ACORDES PRINCIPALES</div>';
    acordesHtml = acordes.map(ac => `<div class="acorde-item"><span class="acorde-nombre">${ac.nombre}</span><div class="acorde-barra-container"><div class="acorde-barra" style="width:${ac.intensidad}%;background-color:${ac.color};"></div></div><span class="acorde-porcentaje">${ac.intensidad}%</span></div>`).join('');
  }

  let imgHtml = '';
  if (currentModalProduct.imgPath) {
    const srcEncoded = currentModalProduct.imgPath.startsWith('data:') ? currentModalProduct.imgPath : currentModalProduct.imgPath.replace(/ /g, '%20');
    imgHtml = `<img src="${srcEncoded}" alt="${escapeHtml(currentModalProduct.nombre)}" style="width:100%; height:100%; object-fit:contain; padding:8px;" onerror="this.style.display='none'; this.nextSibling.style.display='flex';">`;
    imgHtml += `<div style="display:none; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:16px;"><div style="font-size:0.65rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:3px 10px; border-radius:20px;">${currentModalProduct.nombre.substring(0, 14)}</div></div>`;
  } else {
    imgHtml = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:16px;"><div style="font-size:0.65rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:3px 10px; border-radius:20px;">${currentModalProduct.nombre.substring(0, 14)}</div></div>`;
  }

  const isFav = favorites.some(f => f.id === currentModalProduct.id);
  const heartSvg = isFav ?
    `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:26px; height:26px; color:#ff4757;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>` :
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:26px; height:26px; color:#887a6d;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // Botones de admin en modal
  let adminBtns = '';
  if (isAdminLoggedIn && !currentModalProduct.isBase) {
    adminBtns = `
      <div style="display:flex; gap:10px; margin-top:16px;">
        <button onclick="editCustomProduct('${currentModalProduct.id}')" class="btn-admin-edit-modal">✏️ Editar Fragancia</button>
        <button onclick="deleteCustomProduct('${currentModalProduct.id}')" class="btn-admin-delete-modal">🗑️ Eliminar</button>
      </div>
    `;
  }

  modalBody.innerHTML = `
        <div class="modal-producto">
            <div class="modal-img">${imgHtml}</div>
            <div class="modal-info">
                <div style="position:relative; display:flex; justify-content:center; align-items:center; margin-bottom: 5px;">
                    <div class="modal-nombre" style="margin:0; padding-right: 30px;">${escapeHtml(currentModalProduct.nombre)}</div>
                    <button class="fav-toggle-btn" data-id="${currentModalProduct.id}" style="position:absolute; right:0; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:0; display:flex; align-items:center; justify-content:center; transition:transform 0.2s;">${heartSvg}</button>
                </div>
                <div class="modal-genero">${generoLabel}</div>
                ${acordesTitulo}
                ${acordesHtml}
                ${adminBtns}
            </div>
        </div>

        <div class="disclaimer-modal" style="background: rgba(243, 238, 233, 0.8); padding: 18px 24px; border-radius: 12px; margin-bottom: 20px; text-align: center; font-size: 0.8rem; color: #8a7a6b; font-style: italic; border: none; line-height: 1.5;">
            La imagen del perfume original sirve como guía visual del aroma que estás adquiriendo; el producto final es una elaboración propia diseñada para ofrecerte la misma experiencia sensorial con nuestro sello artesanal.
        </div>

        <div style="display:flex; gap:16px; margin: 20px 0;">
            <div class="modal-bote-generico" style="flex:1; background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,245,240,1) 100%); border-radius: 20px; padding: 25px 20px 15px; text-align: center; border: 1px solid rgba(212, 188, 160, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                <img src="imagenes gmaestra/tamaños_bote/bote 50 ml.png" alt="Bote de 50 ml" style="max-width: 70px; height: auto; display: block; margin: 0 auto; filter: drop-shadow(0 15px 20px rgba(0,0,0,0.15));">
                <div style="font-size: 0.75rem; letter-spacing: 1px; color: var(--texto-suave); font-weight: 600; margin-top: 25px; border-top: 1px solid rgba(212, 188, 160, 0.2); padding-top: 15px;">PRESENTACIÓN 50 ML</div>
            </div>
            
            <div class="modal-bote-generico" style="flex:1; background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,245,240,1) 100%); border-radius: 20px; padding: 25px 20px 15px; text-align: center; border: 1px solid rgba(212, 188, 160, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                <img src="imagenes gmaestra/tamaños_bote/bote 100 ml.png" alt="Bote de 100 ml" style="max-width: 80px; height: auto; display: block; margin: 0 auto; filter: drop-shadow(0 15px 20px rgba(0,0,0,0.15));">
                <div style="font-size: 0.75rem; letter-spacing: 1px; color: var(--texto-suave); font-weight: 600; margin-top: 25px; border-top: 1px solid rgba(212, 188, 160, 0.2); padding-top: 15px;">PRESENTACIÓN 100 ML</div>
            </div>
        </div>
    `;

  document.querySelector('.fav-toggle-btn')?.addEventListener('click', () => {
    toggleFavorite(currentModalProduct);
    renderModalContent();
    renderProducts();
  });
}

// ========== RENDERIZADO DE PRODUCTOS ==========
function renderProducts() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  let filtered = allProducts.filter(p => {
    if (filtroGenero !== 'todos' && p.genero !== filtroGenero) return false;
    if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  resultCounter.innerText = `${filtered.length} productos`;

  if (filtered.length === 0) {
    productosGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
            <div style="font-size:4rem; margin-bottom:20px; opacity:0.5;">🔍</div>
            <h3 style="color:var(--texto); margin-bottom:10px;">No se encontraron fragancias</h3>
            <p style="color:var(--texto-suave);">Prueba con otro nombre o revisa los filtros</p>
        </div>`;
    return;
  }

  let html = "";
  filtered.forEach(prod => {
    const generoLabel = prod.genero === 'caballero' ? 'Caballero' : 'Dama';
    const emoji = prod.genero === 'caballero' ? '👔' : '👗';
    let imgBlock = "";
    if (prod.imgPath) {
      const srcEncoded = prod.imgPath.startsWith('data:') ? prod.imgPath : prod.imgPath.replace(/ /g, '%20');
      imgBlock = `<img src="${srcEncoded}" alt="${escapeHtml(prod.nombre)}" style="width:100%; height:100%; object-fit:contain; padding:16px;" onerror="this.style.display='none'; this.nextSibling.style.display='flex';">`;
      imgBlock += `<div style="width:100%; height:100%; display:none; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:24px 24px 0 0;"><div style="font-size:3.5rem; filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.2));">${emoji}</div><div style="font-size:0.7rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:4px 12px; border-radius:30px;">${prod.nombre.substring(0, 18)}</div></div>`;
    } else {
      imgBlock = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:24px 24px 0 0;"><div style="font-size:3.5rem;">${emoji}</div><div style="font-size:0.7rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:4px 12px; border-radius:30px;">${prod.nombre.substring(0, 18)}</div></div>`;
    }
    const isFav = favorites.some(f => f.id === prod.id);
    const heartSvg = isFav ?
      `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:20px; height:20px; color:#ff4757;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>` :
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:20px; height:20px; color:#a0a0a0;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    // Botones de admin (editar/eliminar) para TODOS los productos
    let adminControls = '';
    if (isAdminLoggedIn) {
      adminControls = `
        <div class="admin-card-controls">
          <button class="admin-edit-btn" onclick="event.stopPropagation(); editCustomProduct('${prod.id}')">Editar</button>
          <button class="admin-delete-btn" onclick="event.stopPropagation(); deleteCustomProduct('${prod.id}')">Eliminar</button>
        </div>
      `;
    }

    html += `
            <div class="card ${!prod.isBase && isAdminLoggedIn ? 'card-custom-admin' : ''}" data-id="${prod.id}">
                <div class="card-img">
                    ${imgBlock}
                    <div class="badge-gen"> Inspiraciones Premium</div>
                    <button class="card-fav-btn" data-id="${prod.id}" style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.9); border:none; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.08); transition:all 0.3s ease;">${heartSvg}</button>
                    ${adminControls}
                </div>
                <div class="card-body">
                    <div class="card-genero">${generoLabel}</div>
                    <div class="card-nombre">${escapeHtml(prod.nombre)}</div>
                    <button class="btn-ver-detalle" data-id="${prod.id}"> Ver acordes</button>
                </div>
            </div>
        `;
  });
  productosGrid.innerHTML = html;

  document.querySelectorAll('.card-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id) || btn.dataset.id;
      const product = allProducts.find(p => String(p.id) === String(id));
      if (product) toggleFavorite(product);
    });
  });
  document.querySelectorAll('.card, .btn-ver-detalle').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-fav-btn') || e.target.closest('.admin-card-controls')) return;
      const cardDiv = e.target.closest('.card');
      if (cardDiv) {
        const id = cardDiv.dataset.id;
        const product = allProducts.find(p => String(p.id) === String(id));
        if (product) openModal(product);
      }
    });
  });
}

// ========== FAVORITOS LOGIC ==========
function saveFavorites() {
  localStorage.setItem('favsHN', JSON.stringify(favorites));
  renderFavorites();
}

function loadFavorites() {
  const saved = localStorage.getItem('favsHN');
  if (saved) favorites = JSON.parse(saved);
  renderFavorites();
}

function toggleFavorite(product) {
  const idx = favorites.findIndex(f => String(f.id) === String(product.id));
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast(`Eliminado de favoritos`);
  } else {
    favorites.push(product);
    showToast(`Agregado a favoritos`);
  }
  saveFavorites();
}

function renderFavorites() {
  const favList = document.getElementById('favList');
  if (!favList) return;
  if (favorites.length === 0) {
    favList.innerHTML = `<div style="text-align:center; padding: 60px 20px;">
            <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;"><svg viewBox="0 0 24 24" fill="currentColor" width="60" height="60" style="color:#ff4757;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <h4 style="color: var(--texto); margin-bottom: 10px;">¿Aún sin favoritos?</h4>
            <p style="font-size: 0.9rem; color: var(--texto-suave);">Guarda las fragancias que más te gusten para tenerlas siempre a mano.</p>
        </div>`;
    return;
  }
  let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding: 0 5px;">
        <span style="font-size:0.85rem; color:var(--texto-suave);">${favorites.length} fragancias guardadas</span>
    </div>`;
  favorites.forEach(prod => {
    const emoji = prod.genero === 'caballero' ? '👔' : '👗';
    let imgSrc = prod.imgPath || '';
    if (imgSrc && !imgSrc.startsWith('data:')) imgSrc = imgSrc.replace(/ /g, '%20');
    const imgHtml = imgSrc ? `<img src="${imgSrc}" style="width:65px; height:65px; object-fit:contain; background:white; border-radius:12px; padding:4px;" onerror="this.style.display='none'">` : `<div style="width:65px; height:65px; background:white; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">${emoji}</div>`;
    html += `
            <div style="background:rgba(255,255,255,0.7); backdrop-filter:blur(4px); border:1px solid rgba(0,0,0,0.03); margin-bottom:12px; padding:12px; border-radius:20px; display:flex; align-items:center; gap:15px; position:relative; transition:all 0.3s ease;">
                <div onclick="openModalById('${prod.id}')" style="cursor:pointer; display:flex; align-items:center; gap:15px; flex:1;">
                    ${imgHtml}
                    <div class="fav-item-info">
                        <div class="fav-item-name" style="font-weight:700; font-size:0.95rem;">${escapeHtml(prod.nombre)}</div>
                        <div style="font-size:0.75rem; color:var(--texto-suave);">${prod.genero === 'caballero' ? 'Caballero' : 'Dama'}</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="remove-fav" onclick="event.stopPropagation(); removeFavorite('${prod.id}')" style="background:rgba(255,71,87,0.1); color:#ff4757; border:none; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">✕</button>
                </div>
            </div>
        `;
  });
  favList.innerHTML = html;
}

function removeFavorite(id) {
  favorites = favorites.filter(f => String(f.id) !== String(id));
  saveFavorites();
  renderProducts();
}

function openModalById(id) {
  const product = allProducts.find(p => String(p.id) === String(id));
  if (product) {
    closeFavOverlay();
    openModal(product);
  }
}

// ========== ADMIN CRUD ==========
const PREDEFINED_ACORDES = {
  "floral": "#F5B7D1",
  "cítrico": "#F4D03F",
  "almizclado": "#D5B8A0",
  "atalcado": "#EAD5C3",
  "cálido especiado": "#E07045",
  "amaderado": "#7B4F2E",
  "acuático": "#A8D8E8",
  "dulce": "#F0B8A0",
  "avainillado": "#D4A05A",
  "frutado": "#F0A07C",
  "rosa": "#E6A8D7",
  "aldehídos": "#D0E0E0",
  "cuero": "#8A5030",
  "aromático": "#5BBAB0",
  "ámbar": "#C85A1E",
  "verde": "#A8D8A0",
  "tropical": "#F7DC6F",
  "café": "#6A3818",
  "jabonoso": "#C0D9D9",
  "floral blanco": "#F5B7D1",
  "fresco especiado": "#8DB87A",
  "floral frutal": "#F0A07C",
  "tabaco": "#8A6A3A",
  "clavel": "#F8B88B",
  "jazmín": "#FFF0D4",
  "gardenia": "#E8F0D0",
  "coco": "#E8D0A0"
};

function openAdminPanel(productId = null) {
  if (!isAdminLoggedIn) return;
  editingCustomId = productId;
  adminImageBase64 = null;
  acordeRowCount = 0;

  const panel = document.getElementById('adminPanelOverlay');
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('adminPanelTitle').textContent = productId ? 'Editar Fragancia' : 'Agregar Fragancia';

  // Limpiar form
  document.getElementById('adminNombre').value = '';
  document.getElementById('adminGenero').value = '';
  document.getElementById('editingProductId').value = productId || '';
  document.getElementById('adminImagePreviewImg').style.display = 'none';
  document.getElementById('uploadPlaceholder').style.display = 'flex';
  document.getElementById('removeImageBtn').style.display = 'none';
  document.getElementById('acordesContainer').innerHTML = '';

  if (productId) {
    // Cargar datos del producto a editar
    const prod = allProducts.find(p => String(p.id) === String(productId));
    if (prod) {
      document.getElementById('adminNombre').value = prod.nombre;
      document.getElementById('adminGenero').value = prod.genero;
      if (prod.imgPath) {
        adminImageBase64 = prod.imgPath;
        const previewImg = document.getElementById('adminImagePreviewImg');
        previewImg.src = prod.imgPath;
        previewImg.style.display = 'block';
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('removeImageBtn').style.display = 'inline-flex';
      }
      
      let acordes = prod.acordes;
      if (!acordes || acordes.length === 0) {
        acordes = getAcordesConIntensidad(prod.nombre);
      }
      
      if (acordes && acordes.length > 0) {
        acordes.forEach(ac => addAcordeRow(ac.nombre, ac.intensidad));
      } else {
        addAcordeRow();
      }
    } else {
      addAcordeRow();
    }
  } else {
    // Agregar al menos un acorde vacío por defecto
    addAcordeRow();
  }

  updatePreview();
}

function closeAdminPanel() {
  const panel = document.getElementById('adminPanelOverlay');
  panel.classList.remove('open');
  document.body.style.overflow = '';
  editingCustomId = null;
  adminImageBase64 = null;
}

function editCustomProduct(id) {
  closeModal();
  setTimeout(() => openAdminPanel(id), 200);
}

function deleteCustomProduct(id) {
  if (!confirm('¿Estás seguro de eliminar esta fragancia?')) return;
  
  const product = allProducts.find(p => String(p.id) === String(id));
  
  if (product && product.isBase) {
    // Si es un producto base, lo agregamos a deletedProducts
    deletedProducts.push(parseInt(id));
    localStorage.setItem('deletedFragrancesGM', JSON.stringify(deletedProducts));
  } else {
    // Si es custom, lo removemos de customProducts
    customProducts = customProducts.filter(p => String(p.id) !== String(id));
    localStorage.setItem('customFragrancesGM', JSON.stringify(customProducts));
  }
  
  buildAllProducts();
  renderProducts();
  closeModal();
  showToast('Fragancia eliminada');
}

function addAcordeRow(nombre = '', intensidad = 70) {
  const container = document.getElementById('acordesContainer');
  if (container.children.length >= 5) {
    showToast('Máximo 5 acordes permitidos');
    return;
  }
  acordeRowCount++;
  const row = document.createElement('div');
  row.className = 'acorde-row';
  row.dataset.rowId = acordeRowCount;
  
  let options = '<option value="">Seleccione acorde</option>';
  for (const [key, color] of Object.entries(PREDEFINED_ACORDES)) {
    const selected = (key === nombre) ? 'selected' : '';
    options += `<option value="${key}" data-color="${color}" ${selected}>${key.charAt(0).toUpperCase() + key.slice(1)}</option>`;
  }

  row.innerHTML = `
    <select class="acorde-nombre-input" onchange="updatePreview()">
      ${options}
    </select>
    <input type="number" class="acorde-intensidad-input" placeholder="%" min="1" max="100" value="${intensidad}" onchange="updatePreview()">
    <button type="button" class="remove-acorde-btn" onclick="removeAcordeRow(this)">✕</button>
  `;
  container.appendChild(row);

  // Check if add btn should be disabled
  const addBtn = document.getElementById('addAcordeBtn');
  if (container.children.length >= 5) {
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
  }
  updatePreview();
}

function removeAcordeRow(btn) {
  btn.closest('.acorde-row').remove();
  const addBtn = document.getElementById('addAcordeBtn');
  addBtn.disabled = false;
  addBtn.style.opacity = '1';
  updatePreview();
}

function removeAdminImage() {
  adminImageBase64 = null;
  document.getElementById('adminImagePreviewImg').style.display = 'none';
  document.getElementById('adminImagePreviewImg').src = '';
  document.getElementById('uploadPlaceholder').style.display = 'flex';
  document.getElementById('removeImageBtn').style.display = 'none';
  document.getElementById('adminImagen').value = '';
  updatePreview();
}

function updatePreview() {
  const nombre = document.getElementById('adminNombre').value.trim() || 'Nombre de la Fragancia';
  const genero = document.getElementById('adminGenero').value;
  const generoLabel = genero === 'caballero' ? 'Caballero' : genero === 'dama' ? 'Dama' : 'Género';
  const emoji = genero === 'caballero' ? '👔' : genero === 'dama' ? '👗' : '🌸';

  document.getElementById('previewNombre').textContent = nombre;
  document.getElementById('previewGenero').textContent = generoLabel;

  // Actualizar imagen de la tarjeta de preview
  const previewCardImg = document.getElementById('previewCardImg');
  const imgPlaceholder = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:24px 24px 0 0;"><div style="font-size:3.5rem;">${emoji}</div><div style="font-size:0.7rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:4px 12px; border-radius:30px;">${nombre.substring(0, 18)}</div></div><div class="badge-gen"> Inspiraciones Premium</div>`;
  if (adminImageBase64) {
    previewCardImg.innerHTML = `<img src="${adminImageBase64}" style="width:100%; height:100%; object-fit:contain; padding:16px;" onerror="this.style.display='none'"><div class="badge-gen"> Inspiraciones Premium</div>`;
  } else {
    previewCardImg.innerHTML = imgPlaceholder;
  }

  // Actualizar acordes de preview
  const rows = document.querySelectorAll('.acorde-row');
  const acordes = [];
  rows.forEach(row => {
    const select = row.querySelector('.acorde-nombre-input');
    const n = select.value;
    const i = parseInt(row.querySelector('.acorde-intensidad-input').value) || 70;
    
    if (n) {
      const c = select.options[select.selectedIndex].dataset.color;
      acordes.push({ nombre: n, intensidad: i, color: c });
    }
  });

  const previewAcordes = document.getElementById('previewAcordes');
  if (acordes.length > 0) {
    previewAcordes.innerHTML = acordes.map(ac => `
      <div class="preview-acorde-item">
        <span class="acorde-nombre">${ac.nombre}</span>
        <div class="acorde-barra-container"><div class="acorde-barra" style="width:${ac.intensidad}%; background-color:${ac.color};"></div></div>
        <span class="acorde-porcentaje">${ac.intensidad}%</span>
      </div>
    `).join('');
  } else {
    previewAcordes.innerHTML = '<p style="text-align:center; color:var(--texto-suave); font-size:0.85rem;">Sin acordes configurados</p>';
  }
}

// Manejo del upload de imagen
document.addEventListener('DOMContentLoaded', () => {
  const adminImagenInput = document.getElementById('adminImagen');
  if (adminImagenInput) {
    adminImagenInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        adminImageBase64 = ev.target.result;
        const previewImg = document.getElementById('adminImagePreviewImg');
        previewImg.src = adminImageBase64;
        previewImg.style.display = 'block';
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('removeImageBtn').style.display = 'inline-flex';
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
  }

  // Drag and drop en la zona de upload
  const uploadArea = document.getElementById('imageUploadArea');
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          adminImageBase64 = ev.target.result;
          const previewImg = document.getElementById('adminImagePreviewImg');
          previewImg.src = adminImageBase64;
          previewImg.style.display = 'block';
          document.getElementById('uploadPlaceholder').style.display = 'none';
          document.getElementById('removeImageBtn').style.display = 'inline-flex';
          updatePreview();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Form submit del admin
  const adminForm = document.getElementById('adminFragranceForm');
  if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveFragrance();
    });
  }

  // Inputs para actualizar preview en tiempo real
  const adminNombreInput = document.getElementById('adminNombre');
  const adminGeneroSelect = document.getElementById('adminGenero');
  if (adminNombreInput) adminNombreInput.addEventListener('input', updatePreview);
  if (adminGeneroSelect) adminGeneroSelect.addEventListener('change', updatePreview);
});

function saveFragrance() {
  const nombre = document.getElementById('adminNombre').value.trim();
  const genero = document.getElementById('adminGenero').value;

  if (!nombre) { showToast('El nombre es requerido'); return; }
  if (!genero) { showToast('Selecciona el género'); return; }

  // Recoger acordes
  const rows = document.querySelectorAll('.acorde-row');
  const acordes = [];
  rows.forEach(row => {
    const select = row.querySelector('.acorde-nombre-input');
    const n = select.value;
    const i = parseInt(row.querySelector('.acorde-intensidad-input').value) || 70;
    if (n) {
      const c = select.options[select.selectedIndex].dataset.color;
      acordes.push({ nombre: n, intensidad: i, color: c });
    }
  });

  let productId = editingCustomId;
  
  if (!productId) {
    // Generate new ID based on genero to follow the base array logic
    if (genero === 'dama') {
      const allDamas = allProducts.filter(p => p.genero === 'dama');
      const maxId = allDamas.length > 0 ? Math.max(...allDamas.map(p => p.id)) : 0;
      productId = maxId + 1;
    } else {
      const allCaballeros = allProducts.filter(p => p.genero === 'caballero');
      const maxId = allCaballeros.length > 0 ? Math.max(...allCaballeros.map(p => p.id)) : 10000;
      productId = maxId + 1;
    }
  }

  const productData = {
    id: productId,
    nombre: nombre,
    genero: genero,
    imgPath: adminImageBase64 || null,
    acordes: acordes,
    isBase: false
  };

  const isEditingBaseProduct = editingCustomId && allProducts.find(p => String(p.id) === String(editingCustomId) && p.isBase);

  if (editingCustomId && !isEditingBaseProduct) {
    // Editar custom existente
    const idx = customProducts.findIndex(p => String(p.id) === String(editingCustomId));
    if (idx > -1) customProducts[idx] = productData;
    showToast('Fragancia actualizada correctamente');
  } else {
    // Agregar nuevo o guardar modificación de producto base
    customProducts.push(productData);
    showToast('Fragancia agregada/modificada en el catálogo');
  }

  localStorage.setItem('customFragrancesGM', JSON.stringify(customProducts));
  buildAllProducts();
  closeAdminPanel();
  renderProducts();
}

// ========== FUNCIONES UTILITARIAS ==========
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function showToast(mensaje) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-mensaje';
  toast.innerHTML = mensaje;
  toastContainer.appendChild(toast);
  setTimeout(() => { toast.classList.add('show'); }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function closeMobile() {
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) mobileNav.style.display = 'none';
}

function toggleMobileBars(show) {
  const bars = document.querySelectorAll('.mobile-bottom-nav, .mobile-search-overlay');
  bars.forEach(bar => {
    if (show) { bar.classList.remove('nav-hidden'); }
    else { bar.classList.add('nav-hidden'); }
  });
}

function hideKeyboard() {
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    document.activeElement.blur();
  }
}

// ========== BÚSQUEDA ==========
let savedScrollBeforeSearch = 0;

function openMobileSearch() {
  const bottomNav = document.querySelector('.mobile-bottom-nav');
  const integratedSearchInput = document.getElementById('integratedSearchInput');
  savedScrollBeforeSearch = window.scrollY;
  if (bottomNav) bottomNav.classList.add('search-active');
  document.body.classList.add('search-mode-active');
  setTimeout(() => { if (integratedSearchInput) integratedSearchInput.focus(); }, 50);
}

function closeIntegratedSearchMode() {
  const bottomNav = document.querySelector('.mobile-bottom-nav');
  const integratedSearchInput = document.getElementById('integratedSearchInput');
  if (bottomNav) {
    bottomNav.classList.remove('search-active');
    bottomNav.style.top = "auto";
    bottomNav.style.bottom = "25px";
  }
  document.body.classList.remove('search-mode-active');
  if (integratedSearchInput) integratedSearchInput.value = '';
  if (searchInput) searchInput.value = '';
  if (typeof searchDebounceTimer !== 'undefined' && searchDebounceTimer) clearTimeout(searchDebounceTimer);
  renderProducts();
  hideKeyboard();
  requestAnimationFrame(() => { window.scrollTo({ top: savedScrollBeforeSearch, behavior: 'instant' }); });
}

function setupSearchHandlers() {
  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      setTimeout(() => {
        const filtrosWrapper = document.querySelector('.filtros-wrapper');
        if (filtrosWrapper) {
          const rect = filtrosWrapper.getBoundingClientRect();
          if (rect.top < 0) filtrosWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    });
    searchInput.addEventListener('input', () => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => renderProducts(), 150);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); searchInput.blur(); hideKeyboard(); }
    });
  }
  const integratedSearchInput = document.getElementById('integratedSearchInput');
  if (integratedSearchInput) {
    integratedSearchInput.addEventListener('input', (e) => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        const term = e.target.value.toLowerCase().trim();
        if (searchInput) searchInput.value = term;
        renderProducts();
      }, 150);
    });
    integratedSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); integratedSearchInput.blur(); hideKeyboard(); }
    });
  }
}

// ========== EVENT LISTENERS ==========
document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroGenero = btn.dataset.genero;
    const catalogo = document.getElementById('catalogo');
    if (catalogo) {
      const headerH = document.querySelector('header')?.offsetHeight || 76;
      const filtrosH = document.querySelector('.filtros-wrapper')?.offsetHeight || 0;
      const targetY = catalogo.getBoundingClientRect().top + window.scrollY - headerH - filtrosH;
      window.scrollTo({ top: targetY, behavior: 'instant' });
    }
    renderProducts();
  });
});

const clearSearchBtn = document.getElementById('clearSearch');
if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderProducts();
    searchInput.focus();
  });
}

closeModalBtn?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

document.getElementById('closeLoginBtn')?.addEventListener('click', closeLoginModal);
document.getElementById('loginOverlay')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('loginOverlay')) closeLoginModal();
});

document.getElementById('closeAdminPanelBtn')?.addEventListener('click', closeAdminPanel);

const hamburger = document.getElementById('hamburgerBtn');
const mobileNav = document.getElementById('mobileNav');
function toggleMobile() {
  mobileNav.style.display = mobileNav.style.display === 'flex' ? 'none' : 'flex';
}
hamburger?.addEventListener('click', toggleMobile);

// ========== INITIALIZATION ==========
loadFavorites();
renderProducts();

// ========== MOBILE BOTTOM NAV HANDLERS ==========
const mobileSearchBtn = document.getElementById('mobileSearchBtn');
const closeIntegratedSearch = document.getElementById('closeIntegratedSearch');

setupSearchHandlers();
mobileSearchBtn?.addEventListener('click', openMobileSearch);
closeIntegratedSearch?.addEventListener('click', closeIntegratedSearchMode);

const mobileFavBtn = document.getElementById('mobileFavBtn');
const favOverlay = document.getElementById('favOverlay');
const closeFavBtn = document.getElementById('closeFavBtn');

mobileFavBtn?.addEventListener('click', () => {
  favOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setActiveNavItem('mobileFavBtn');
  toggleMobileBars(false);
});

closeFavBtn?.addEventListener('click', closeFavOverlay);
favOverlay?.addEventListener('click', (e) => { if (e.target === favOverlay) closeFavOverlay(); });

function closeFavOverlay() {
  favOverlay.style.display = 'none';
  document.body.style.overflow = '';
  setActiveNavItem('mobileHomeBtn');
  toggleMobileBars(true);
}

const mobileNotifBtn = document.getElementById('mobileNotifBtn');
mobileNotifBtn?.addEventListener('click', () => {
  showToast("🎉 ¡Pronto! Tendremos novedades de fragancias aquí.");
  setActiveNavItem('mobileNotifBtn');
  document.getElementById('notifDot').style.display = 'none';
  setTimeout(() => setActiveNavItem('mobileHomeBtn'), 2000);
});

setTimeout(() => {
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = 'block';
}, 10000);

function setActiveNavItem(id) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// ========== ANIMATIONS AND PREMIUM EFFECTS ==========
let lastScrollY = 0;
let scrollTicking = false;
const cachedHeader = document.querySelector('header');

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50) {
        cachedHeader.classList.add('header-scrolled');
      } else {
        cachedHeader.classList.remove('header-scrolled');
      }
      const homeBtn = document.getElementById('mobileHomeBtn');
      if (homeBtn && homeBtn.classList.contains('active')) {
        if (currentScrollY > 100) {
          homeBtn.classList.add('scrolled');
          homeBtn.classList.add('was-scrolled');
        } else {
          homeBtn.classList.remove('scrolled');
        }
      }
      lastScrollY = currentScrollY;
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

function observeCards() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.classList.add('reveal');
    observer.observe(card);
  });
}

const originalRenderProducts = renderProducts;
renderProducts = function () {
  originalRenderProducts();
  observeCards();
};

window.addEventListener('popstate', (e) => {
  if (modalOverlay.classList.contains('open')) { closeModal(true); }
  if (favOverlay && favOverlay.style.display === 'flex') { closeFavOverlay(); }
});

function preventSearchScrollIssues() {
  const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
  window.HTMLElement.prototype.scrollIntoView = function (options) {
    if (this.classList && this.classList.contains('header-container') &&
      document.querySelector('.mobile-bottom-nav')?.classList.contains('search-active')) {
      return;
    }
    originalScrollIntoView.call(this, options);
  };
}

observeCards();
toggleMobileBars(true);
preventSearchScrollIssues();

console.log('✅ App.js cargado - Catálogo puro con sistema de administración');