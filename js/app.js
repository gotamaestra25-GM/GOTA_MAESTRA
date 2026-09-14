// ========== INICIALIZACIÓN DE PRODUCTOS ==========
let allProducts = [];

function buildAllProducts() {
  allProducts = [];

  damas.forEach((nombre, idx) => {
    const num = idx + 1;
    const extension = mujerExt[num] || 'avif';
    const imgPath = IMG_BASE_MUJER + num + "." + extension;
    allProducts.push({ id: num, nombre: nombre, genero: 'dama', imgPath: imgPath });
  });

  caballeros.forEach((nombre, idx) => {
    const num = idx + 10001;
    const extension = hombreExt[num - 10000] || 'avif';
    const imgPath = IMG_BASE_HOMBRE + (num - 10000) + "." + extension;
    allProducts.push({ id: num, nombre: nombre, genero: 'caballero', imgPath: imgPath });
  });
}

buildAllProducts();

// ========== VARIABLES GLOBALES ==========
let favorites = [];
let currentModalProduct = null;
let filtroGenero = 'todos';
let searchDebounceTimer = null;

// ========== PAGINACIÓN VIRTUAL ==========
const PAGE_SIZE = 36;        // Cards por lote
let currentPage = 0;         // Lote actual renderizado
let filteredProducts = [];   // Productos filtrados actuales
let isLoadingPage = false;   // Evita cargas solapadas durante el scroll

// ========== DOM ELEMENTS ==========
const modalOverlay = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModalBtn');
const productosGrid = document.getElementById('productosGrid');
const searchInput = document.getElementById('searchInput');
const resultCounter = document.getElementById('resultCounter');

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

// Global error handler for images to prevent WebKit parser aborts
window.handleImgError = function(img, fallbackSelector) {
  img.style.display = 'none';
  setTimeout(() => {
    if (img.parentElement) {
      const fallback = img.parentElement.querySelector(fallbackSelector || '.img-fallback');
      if (fallback) fallback.style.display = 'flex';
    }
  }, 0);
};

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

// ========== ACORDES ==========
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

// ========== MODAL DE DETALLES ==========
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

function renderModalContent() {
  if (!currentModalProduct) return;
  const generoLabel = currentModalProduct.genero === 'caballero' ? 'Caballero' : 'Dama';

  const acordes = getAcordesConIntensidad(currentModalProduct.nombre);

  let acordesHtml = '';
  let acordesTitulo = '';
  if (acordes.length > 0) {
    acordesTitulo = '<div class="acordes-titulo"> ACORDES PRINCIPALES</div>';
    acordesHtml = acordes.map(ac =>
      `<div class="acorde-item"><span class="acorde-nombre">${ac.nombre}</span><div class="acorde-barra-container"><div class="acorde-barra" style="width:${ac.intensidad}%;background-color:${ac.color};"></div></div><span class="acorde-porcentaje">${ac.intensidad}%</span></div>`
    ).join('');
  }

  const fallbackModal = `<div class="img-fallback" style="display:none; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:16px;"><div style="font-size:0.65rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:3px 10px; border-radius:20px;">${currentModalProduct.nombre.substring(0, 14)}</div></div>`;
  let imgHtml = '';
  if (currentModalProduct.imgPath) {
    const srcEncoded = currentModalProduct.imgPath.replace(/ /g, '%20');
    imgHtml = `<img src="${srcEncoded}" alt="${escapeHtml(currentModalProduct.nombre)}" style="width:100%; height:100%; object-fit:contain; padding:8px;" onerror="handleImgError(this, '.img-fallback')">${fallbackModal}`;
  } else {
    imgHtml = `<div class="img-fallback" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:16px;"><div style="font-size:0.65rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:3px 10px; border-radius:20px;">${currentModalProduct.nombre.substring(0, 14)}</div></div>`;
  }

  const isFav = favorites.some(f => f.id === currentModalProduct.id);
  const heartSvg = isFav ?
    `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:26px; height:26px; color:#ff4757;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>` :
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:26px; height:26px; color:#887a6d;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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

// ========== RENDERIZADO DE PRODUCTOS (con paginación virtual + lazy loading) ==========

/**
 * Genera el HTML de una card individual con lazy loading nativo.
 * El primer lote (isFirstBatch=true) usa loading="eager" para las primeras cards
 * visibles sin scroll; el resto usa loading="lazy".
 */
function buildCardHtml(prod, index, isFirstBatch) {
  const generoLabel = prod.genero === 'caballero' ? 'Caballero' : 'Dama';
  const emoji = prod.genero === 'caballero' ? '\u{1F454}' : '\u{1F457}';
  const lazyAttr = (isFirstBatch && index < 12) ? 'loading="eager"' : 'loading="lazy"';

  const fallbackCard = `<div class="img-fallback" style="width:100%; height:100%; display:none; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:24px 24px 0 0;"><div style="font-size:3.5rem; filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.2));">${emoji}</div><div style="font-size:0.7rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:4px 12px; border-radius:30px;">${prod.nombre.substring(0, 18)}</div></div>`;

  let imgBlock;
  if (prod.imgPath) {
    const srcEncoded = prod.imgPath.replace(/ /g, '%20');
    imgBlock = `<img src="${srcEncoded}" alt="${escapeHtml(prod.nombre)}" ${lazyAttr} style="width:100%; height:100%; object-fit:contain; padding:16px;" onerror="handleImgError(this, '.img-fallback')">${fallbackCard}`;
  } else {
    imgBlock = `<div class="img-fallback" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:24px 24px 0 0;"><div style="font-size:3.5rem;">${emoji}</div><div style="font-size:0.7rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:4px 12px; border-radius:30px;">${prod.nombre.substring(0, 18)}</div></div>`;
  }

  const isFav = favorites.some(f => f.id === prod.id);
  const heartSvg = isFav
    ? `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" style="width:20px;height:20px;color:#ff4757;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:20px;height:20px;color:#a0a0a0;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return `
    <div class="card" data-id="${prod.id}">
      <div class="card-img">
        ${imgBlock}
        <div class="badge-gen"> Inspiraciones Premium</div>
        <button class="card-fav-btn" data-id="${prod.id}" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.9);border:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,0.08);transition:all 0.3s ease;">${heartSvg}</button>
      </div>
      <div class="card-body">
        <div class="card-genero">${generoLabel}</div>
        <div class="card-nombre">${escapeHtml(prod.nombre)}</div>
        <button class="btn-ver-detalle" data-id="${prod.id}"> Ver acordes</button>
      </div>
    </div>`;
}

/** Agrega event listeners a las cards recién insertadas */
function bindCardEvents(cards) {
  cards.forEach(card => {
    const favBtn = card.querySelector('.card-fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = favBtn.dataset.id;
        const product = allProducts.find(p => String(p.id) === String(id));
        if (product) toggleFavorite(product);
      });
    }
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-fav-btn') || e.target.closest('.card-fav-btn')) return;
      const id = card.dataset.id;
      const product = allProducts.find(p => String(p.id) === String(id));
      if (product) openModal(product);
    });
    const detailBtn = card.querySelector('.btn-ver-detalle');
    if (detailBtn) {
      detailBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = detailBtn.dataset.id;
        const product = allProducts.find(p => String(p.id) === String(id));
        if (product) openModal(product);
      });
    }
  });
}

/**
 * Carga el siguiente lote de cards (PAGE_SIZE) al grid,
 * sin borrar lo que ya está pintado.
 */
function loadNextPage() {
  if (isLoadingPage) return;
  const start = currentPage * PAGE_SIZE;
  const end   = Math.min(start + PAGE_SIZE, filteredProducts.length);
  if (start >= filteredProducts.length) return;

  isLoadingPage = true;
  const isFirstBatch = (currentPage === 0);
  const fragment = document.createDocumentFragment();
  const newCards = [];

  for (let i = start; i < end; i++) {
    const el = document.createElement('div');
    el.innerHTML = buildCardHtml(filteredProducts[i], i - start, isFirstBatch).trim();
    const card = el.firstElementChild;
    fragment.appendChild(card);
    newCards.push(card);
  }

  productosGrid.appendChild(fragment);
  bindCardEvents(newCards);
  currentPage++;
  isLoadingPage = false;

  requestAnimationFrame(() => observeNewCards(newCards));
}

/**
 * Listener de scroll para carga infinita.
 * El evento 'scroll' SOLO se dispara cuando el usuario mueve la página —
 * no puede entrar en bucle a diferencia del IntersectionObserver.
 */
function handleScrollPagination() {
  // No hacer nada si ya cargamos todo o si estamos cargando
  if (isLoadingPage) return;
  if (currentPage * PAGE_SIZE >= filteredProducts.length) return;

  // Disparar cuando el usuario esté a 400px del final del grid
  const gridBottom = productosGrid.getBoundingClientRect().bottom;
  const triggerAt = window.innerHeight + 400;

  if (gridBottom < triggerAt) {
    loadNextPage();
  }
}

// Registrar el listener de scroll UNA SOLA VEZ (al cargar la página)
window.addEventListener('scroll', handleScrollPagination, { passive: true });



/** Función principal: filtra y arranca la paginación desde cero */
function renderProducts() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  filteredProducts = allProducts.filter(p => {
    if (filtroGenero !== 'todos' && p.genero !== filtroGenero) return false;
    if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  if (resultCounter) resultCounter.innerText = `${filteredProducts.length} productos`;

  // Limpiar grid y resetear estado de paginación
  productosGrid.innerHTML = '';
  currentPage = 0;
  isLoadingPage = false;

  if (filteredProducts.length === 0) {
    productosGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
      <div style="font-size:4rem; margin-bottom:20px; opacity:0.5;">\uD83D\uDD0D</div>
      <h3 style="color:var(--texto); margin-bottom:10px;">No se encontraron fragancias</h3>
      <p style="color:var(--texto-suave);">Prueba con otro nombre o revisa los filtros</p>
    </div>`;
    return;
  }

  // Cargar el primer lote de cards
  loadNextPage();
}


// ========== FAVORITOS ==========
function saveFavorites() {
  localStorage.setItem('favsHN', JSON.stringify(favorites));
  renderFavorites();
}

function loadFavorites() {
  const saved = localStorage.getItem('favsHN');
  if (saved) {
    try { favorites = JSON.parse(saved); } catch(e) { favorites = []; }
  }
  renderFavorites();
}

function toggleFavorite(product) {
  const idx = favorites.findIndex(f => String(f.id) === String(product.id));
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast('Eliminado de favoritos');
  } else {
    favorites.push(product);
    showToast('Agregado a favoritos ❤️');
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
    if (imgSrc) imgSrc = imgSrc.replace(/ /g, '%20');
    const fallbackFav = `<div class="fav-img-fallback" style="display:none; width:65px; height:65px; background:white; border-radius:12px; align-items:center; justify-content:center; font-size:1.5rem;">${emoji}</div>`;
    const imgHtml = imgSrc ?
      `<img src="${imgSrc}" style="width:65px; height:65px; object-fit:contain; background:white; border-radius:12px; padding:4px;" onerror="handleImgError(this, '.fav-img-fallback')">${fallbackFav}` :
      `<div style="width:65px; height:65px; background:white; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">${emoji}</div>`;
    html += `
      <div style="background:rgba(255,255,255,0.7); backdrop-filter:blur(4px); border:1px solid rgba(0,0,0,0.03); margin-bottom:12px; padding:12px; border-radius:20px; display:flex; align-items:center; gap:15px; position:relative; transition:all 0.3s ease;">
        <div onclick="openModalById('${prod.id}')" style="cursor:pointer; display:flex; align-items:center; gap:15px; flex:1;">
          ${imgHtml}
          <div>
            <div style="font-weight:700; font-size:0.95rem;">${escapeHtml(prod.nombre)}</div>
            <div style="font-size:0.75rem; color:var(--texto-suave);">${prod.genero === 'caballero' ? 'Caballero' : 'Dama'}</div>
          </div>
        </div>
        <button onclick="event.stopPropagation(); removeFavorite('${prod.id}')" style="background:rgba(255,71,87,0.1); color:#ff4757; border:none; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1rem;">✕</button>
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

  // FIX: Limpiar ambos inputs y re-renderizar con todos los productos
  if (integratedSearchInput) integratedSearchInput.value = '';
  if (searchInput) searchInput.value = '';

  // FIX: Limpiar el botón X del buscador desktop
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) clearBtn.style.display = 'none';

  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

  // FIX: renderProducts se llama ANTES del scroll para evitar layout shifts
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
      const clearBtn = document.getElementById('clearSearch');
      if (clearBtn) clearBtn.style.display = searchInput.value ? 'flex' : 'none';
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

// Filtros de género
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

// Botón limpiar búsqueda desktop
const clearSearchBtn = document.getElementById('clearSearch');
if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    if (searchInput) { searchInput.value = ''; }
    clearSearchBtn.style.display = 'none';
    renderProducts();
    if (searchInput) searchInput.focus();
  });
}

// Modal
closeModalBtn?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

// Hamburguesa
const hamburger = document.getElementById('hamburgerBtn');
const mobileNavEl = document.getElementById('mobileNav');
function toggleMobile() {
  if (mobileNavEl) mobileNavEl.style.display = mobileNavEl.style.display === 'flex' ? 'none' : 'flex';
}
hamburger?.addEventListener('click', toggleMobile);

// ========== INICIALIZACIÓN ==========
loadFavorites();
renderProducts();
setupSearchHandlers();

// ========== MOBILE BOTTOM NAV ==========
const mobileSearchBtn = document.getElementById('mobileSearchBtn');
const closeIntegratedSearchBtn = document.getElementById('closeIntegratedSearch');

// FIX: Botones móviles — asegurar que los listeners se registran y funcionan
if (mobileSearchBtn) {
  mobileSearchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openMobileSearch();
  });
}

if (closeIntegratedSearchBtn) {
  closeIntegratedSearchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeIntegratedSearchMode();
  });
}

// Favoritos overlay
const mobileFavBtn = document.getElementById('mobileFavBtn');
const favOverlay = document.getElementById('favOverlay');
const closeFavBtn = document.getElementById('closeFavBtn');

if (mobileFavBtn) {
  mobileFavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (favOverlay) favOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setActiveNavItem('mobileFavBtn');
    toggleMobileBars(false);
  });
}

if (closeFavBtn) {
  closeFavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeFavOverlay();
  });
}

favOverlay?.addEventListener('click', (e) => { if (e.target === favOverlay) closeFavOverlay(); });

function closeFavOverlay() {
  if (favOverlay) favOverlay.style.display = 'none';
  document.body.style.overflow = '';
  setActiveNavItem('mobileHomeBtn');
  toggleMobileBars(true);
}

// Notificaciones
const mobileNotifBtn = document.getElementById('mobileNotifBtn');
if (mobileNotifBtn) {
  mobileNotifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showToast("🎉 ¡Pronto! Tendremos novedades de fragancias aquí.");
    setActiveNavItem('mobileNotifBtn');
    const dot = document.getElementById('notifDot');
    if (dot) dot.style.display = 'none';
    setTimeout(() => setActiveNavItem('mobileHomeBtn'), 2000);
  });
}

setTimeout(() => {
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = 'block';
}, 10000);

function setActiveNavItem(id) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// ========== SCROLL Y ANIMACIONES ==========
const cachedHeader = document.querySelector('header');

// --- Instagram-style nav minimize ---
let lastScrollY = window.scrollY;
let navExpandTimer = null;
const bottomNav = document.querySelector('.mobile-bottom-nav');

window.addEventListener('scroll', () => {
  requestAnimationFrame(() => {
    const currentScrollY = window.scrollY;

    // Header scroll class
    if (cachedHeader) {
      cachedHeader.classList.toggle('header-scrolled', currentScrollY > 50);
    }

    // Home btn water effect
    const homeBtn = document.getElementById('mobileHomeBtn');
    if (homeBtn && homeBtn.classList.contains('active')) {
      if (currentScrollY > 100) {
        homeBtn.classList.add('scrolled', 'was-scrolled');
      } else {
        homeBtn.classList.remove('scrolled');
      }
    }

    // ── Instagram iOS nav minimize ──────────────────────────────
    if (bottomNav && !bottomNav.classList.contains('search-active')) {
      const delta = currentScrollY - lastScrollY;

      if (delta > 4 && currentScrollY > 80) {
        // Scrolling DOWN — minimizar
        bottomNav.classList.add('nav-minimized');
        // Cancelar timer de expansión si existía
        if (navExpandTimer) { clearTimeout(navExpandTimer); navExpandTimer = null; }
      } else if (delta < -4 || currentScrollY < 80) {
        // Scrolling UP o cerca del top — expandir inmediatamente
        bottomNav.classList.remove('nav-minimized');
        if (navExpandTimer) { clearTimeout(navExpandTimer); navExpandTimer = null; }
      }

      // También expandir si el usuario deja de hacer scroll por 1.2 segundos
      if (bottomNav.classList.contains('nav-minimized')) {
        if (navExpandTimer) clearTimeout(navExpandTimer);
        navExpandTimer = setTimeout(() => {
          bottomNav.classList.remove('nav-minimized');
          navExpandTimer = null;
        }, 1200);
      }
    }
    // ────────────────────────────────────────────────────────────

    lastScrollY = currentScrollY;
  });
}, { passive: true });



// ========== INTERSECTION OBSERVER PARA ANIMACIÓN DE CARDS ==========
// FIX: Desconectar el observer antes de re-crear para evitar observers huérfanos
let cardObserver = null;

function createCardObserver() {
  if (cardObserver) {
    cardObserver.disconnect();
  }
  const observerOptions = { root: null, rootMargin: '0px 0px 50px 0px', threshold: 0.05 };
  cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        cardObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  return cardObserver;
}

/**
 * Anima sólo las cards del lote recién insertado (paginación infinita).
 * Las primeras visibles se animan con delay escalonado; las que están
 * fuera de la pantalla se observan para animarse al hacer scroll.
 */
function observeNewCards(newCards) {
  if (!newCards || newCards.length === 0) return;
  const observer = createCardObserver();

  newCards.forEach((card, index) => {
    card.classList.add('reveal');
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight + 150) {
      setTimeout(() => card.classList.add('active'), Math.min(index * 25, 250));
    } else {
      observer.observe(card);
    }
  });

  // Fallback: visibilidad garantizada a los 700ms
  setTimeout(() => {
    newCards.forEach(c => { if (!c.classList.contains('active')) c.classList.add('active'); });
  }, 700);
}

/** Alias legacy para compatibilidad (ya no se usa en el flujo normal) */
function observeCards() {
  observeNewCards(Array.from(document.querySelectorAll('.card')));
}

// Cerrar modal con botón atrás del navegador
window.addEventListener('popstate', (e) => {
  if (modalOverlay && modalOverlay.classList.contains('open')) { closeModal(true); }
  if (favOverlay && favOverlay.style.display === 'flex') { closeFavOverlay(); }
});

// Finalizar setup
toggleMobileBars(true);
console.log('✅ GOTA MAESTRA - Catálogo cargado correctamente');