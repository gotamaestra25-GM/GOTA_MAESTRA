// ========== INICIALIZACIÓN DE PRODUCTOS ==========
let allProducts = [];

damas.forEach((nombre, idx) => {
  const num = idx + 1;
  const extension = mujerExt[num] || 'avif';
  const imgPath = IMG_BASE_MUJER + num + "." + extension;
  allProducts.push({ id: num, nombre: nombre, genero: 'dama', imgPath: imgPath });
});

caballeros.forEach((nombre, idx) => {
  const num = idx + 1;
  const extension = hombreExt[num] || 'avif';
  const imgPath = IMG_BASE_HOMBRE + num + "." + extension;
  allProducts.push({ id: num + 10000, nombre: nombre, genero: 'caballero', imgPath: imgPath });
});

// ========== VARIABLES GLOBALES ==========
let cart = [];
let favorites = [];
let currentModalProduct = null;
let modalMlSelected = 50;
let modalCantidad = 1;
let filtroGenero = 'todos';

// ========== DOM ELEMENTS ==========
const modalOverlay = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModalBtn');
const cartCountSpan = document.getElementById('cartCount');
const mobileCartCount = document.getElementById('mobileCartCount');
const cartItemsContainer = document.getElementById('cartItemsList');
const cartTotalSpan = document.getElementById('cartTotalPrice');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlayEl = document.getElementById('cartOverlay');
const productosGrid = document.getElementById('productosGrid');
const searchInput = document.getElementById('searchInput');
const resultCounter = document.getElementById('resultCounter');

// ========== FUNCIONES DEL CARRITO ==========
function saveCart() {
  localStorage.setItem('cartHN', JSON.stringify(cart));
  updateCartUI();
}

function loadCart() {
  const saved = localStorage.getItem('cartHN');
  if (saved) cart = JSON.parse(saved);
  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((acc, i) => acc + i.cantidad, 0);
  cartCountSpan.innerText = totalItems;
  if (mobileCartCount) mobileCartCount.innerText = totalItems;
  const floatingCount = document.getElementById('floatingCartCount');
  if (floatingCount) floatingCount.innerText = totalItems;
  
  const navCartCount = document.getElementById('mobileNavCartCount');
  if (navCartCount) navCartCount.innerText = totalItems;

  renderCartSidebar();
}

function renderCartSidebar() {
  if (!cartItemsContainer) return;
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div style="text-align:center;padding:30px;"> Carrito vacío</div>';
    cartTotalSpan.innerText = 'L. 0';
    return;
  }
  let html = '', total = 0;
  cart.forEach((item, idx) => {
    const subtotal = item.cantidad * item.precio;
    total += subtotal;
    const imgSrc = item.imgPath ? item.imgPath.replace(/ /g, '%20') : '';
    const emoji = item.genero === 'caballero' ? '🧔‍♂️' : '🌸';
    const imgHtml = imgSrc ? `<img src="${imgSrc}" style="width: 65px; height: 65px; object-fit: contain; background: rgba(255,255,255,0.6); border-radius: 12px; padding: 4px;" onerror="this.style.display='none'">` : `<div style="width: 65px; height: 65px; background: rgba(255,255,255,0.6); border-radius: 12px; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;">${emoji}</div>`;

    html += `
      <div class="cart-item" style="background: rgba(255,255,255,0.9); border-radius: 16px; padding: 16px; margin-bottom: 16px; display: flex; gap: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid rgba(255,255,255,0.8); position: relative;">
        ${imgHtml}
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--texto); line-height: 1.2; padding-right: 20px;">${escapeHtml(item.nombre)}</div>
            <div style="font-size: 0.75rem; color: var(--texto-suave); margin-top: 4px;">${item.genero === 'caballero' ? 'Caballero' : 'Dama'} · ${item.ml}ml</div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
            <div style="display: flex; align-items: center; background: white; border-radius: 8px; padding: 2px 4px; border: 1px solid rgba(212, 188, 160, 0.4);">
              <button class="cart-qty-btn" data-idx="${idx}" data-op="decr" style="width: 24px; height: 24px; border: none; background: transparent; cursor: pointer; color: var(--texto-suave); font-size: 1rem; display:flex; align-items:center; justify-content:center;">-</button>
              <span style="font-size: 0.85rem; font-weight: 600; width: 24px; text-align: center;">${item.cantidad}</span>
              <button class="cart-qty-btn" data-idx="${idx}" data-op="incr" style="width: 24px; height: 24px; border: none; background: transparent; cursor: pointer; color: var(--texto-suave); font-size: 1rem; display:flex; align-items:center; justify-content:center;">+</button>
            </div>
            <div style="font-weight: 700; color: var(--texto); font-size: 1.05rem;">L. ${subtotal}</div>
          </div>
        </div>
        <button class="cart-qty-btn" data-idx="${idx}" data-op="remove" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: #a3a3a3; cursor: pointer; padding: 4px;">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>`;
  });
  cartItemsContainer.innerHTML = html;

  const subtotalEl = document.getElementById('cartSubtotalPrice');
  const totalEl = document.getElementById('cartTotalPrice');
  if (subtotalEl) subtotalEl.innerText = `L. ${total}`;
  if (totalEl) totalEl.innerText = `L. ${total}`;

  document.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const op = btn.dataset.op;
      if (op === 'incr') cart[idx].cantidad += 1;
      else if (op === 'decr') {
        if (cart[idx].cantidad > 1) cart[idx].cantidad -= 1;
        else cart.splice(idx, 1);
      } else if (op === 'remove') cart.splice(idx, 1);
      saveCart();
      updateCartUI();
    });
  });
}

function addToCart(producto, ml, cantidad) {
  const precio = ml === 100 ? PRECIO_100ML : PRECIO_50ML;
  const key = `${producto.id}_${ml}`;
  const exist = cart.find(p => p.cartKey === key);
  if (exist) {
    exist.cantidad += cantidad;
  } else {
    cart.push({ ...producto, cantidad, precio, ml, cartKey: key });
  }
  saveCart();
  showToast(`✅ <b>${producto.nombre}</b> agregado a tu pedido`);
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

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function openCartSidebar() {
  cartSidebar.classList.add('open');
  cartOverlayEl.classList.add('open');
  history.pushState({ sidebar: 'cart' }, "");
}

function closeCartSidebar(isPopState = false) {
  cartSidebar.classList.remove('open');
  cartOverlayEl.classList.remove('open');
  if (isPopState !== true && window.history.state?.sidebar === 'cart') {
    history.back();
  }
}

// ========== FUNCIONES DEL MODAL ==========
function openModal(product) {
  currentModalProduct = product;
  modalMlSelected = 50;
  modalCantidad = 1;
  renderModalContent();
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Siempre resetear el scroll al inicio (arriba)
  const container = document.querySelector('.modal-container');
  if (container) container.scrollTop = 0;
  
  // Agregar estado al historial para que el botón "atrás" cierre el modal
  history.pushState({ modal: 'product' }, "");
}

function closeModal(isPopState = false) {
  modalOverlay.classList.remove('open');
  currentModalProduct = null;
  document.body.style.overflow = '';
  
  // Si se cerró manualmente (no por botón atrás), quitar el estado del historial
  if (isPopState !== true && window.history.state?.modal === 'product') {
    history.back();
  }
}

function renderModalContent() {
  if (!currentModalProduct) return;
  const generoLabel = currentModalProduct.genero === 'caballero' ? 'Caballero' : 'Dama';
  const precio = modalMlSelected === 100 ? PRECIO_100ML : PRECIO_50ML;
  const acordes = getAcordesConIntensidad(currentModalProduct.nombre);
  const acordesHtml = acordes.map(ac => `<div class="acorde-item"><span class="acorde-nombre">${ac.nombre}</span><div class="acorde-barra-container"><div class="acorde-barra" style="width:${ac.intensidad}%;background-color:${ac.color};"></div></div><span class="acorde-porcentaje">${ac.intensidad}%</span></div>`).join('');

  const emoji = currentModalProduct.genero === 'caballero' ? '🧔‍♂️' : '🌸';
  let imgHtml = '';
  if (currentModalProduct.imgPath) {
    const srcEncoded = currentModalProduct.imgPath.replace(/ /g, '%20');
    imgHtml = `<img src="${srcEncoded}" alt="${escapeHtml(currentModalProduct.nombre)}" style="width:100%; height:100%; object-fit:contain; padding:8px;" onerror="this.style.display='none'; this.parentElement.innerHTML=this.nextSibling.outerHTML;">`;
    imgHtml += `<div style="display:none; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:16px;"><div style="font-size:3rem; filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.2));">${emoji}</div><div style="font-size:0.65rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:3px 10px; border-radius:20px;">${currentModalProduct.nombre.substring(0, 14)}</div></div>`;
  } else {
    imgHtml = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:16px;"><div style="font-size:3rem;">${emoji}</div><div style="font-size:0.65rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:3px 10px; border-radius:20px;">${currentModalProduct.nombre.substring(0, 14)}</div></div>`;
  }

  const bottleImgPath = `imagenes gmaestra/tamaños_bote/bote ${modalMlSelected} ml.png`;
  const bottleImgHtml = `
    <div class="modal-bote-generico" style="display: flex; flex-direction: column; align-items: center; margin-top: 24px; background: linear-gradient(180deg, #ffffff 0%, #fcf9f5 100%); border-radius: 16px; padding: 24px 16px; box-shadow: 0 8px 24px rgba(122, 90, 58, 0.04), inset 0 1px 0 rgba(255,255,255,1); border: 1px solid rgba(212, 188, 160, 0.4);">
      <span style="font-family: 'Playfair Display', serif; font-size: 1.05rem; font-style: italic; color: #8c6b4a; margin-bottom: 16px;">Así lucirá tu fragancia</span>
      <img src="${bottleImgPath.replace(/ /g, '%20')}" alt="Bote Genérico de ${modalMlSelected} ml" style="max-height: 170px; width: auto; object-fit: contain; filter: drop-shadow(0px 10px 15px rgba(0,0,0,0.12));">
      <div style="font-size: 0.65rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #b39b82; margin-top: 20px; border-top: 1px solid rgba(212, 188, 160, 0.3); padding-top: 12px; width: 80%; text-align: center;">Presentación ${modalMlSelected} ml</div>
    </div>`;

  const disclaimerHtml = `<div class="modal-disclaimer-artesanal" style="font-size: 0.65rem; color: #8c6b4a; text-align: center; margin: 5px 0 16px 0; font-style: italic; line-height: 1.5; padding: 10px 14px; background: rgba(212, 188, 160, 0.15); border-radius: 12px; border: 1px solid rgba(212, 188, 160, 0.3);">La imagen del perfume original sirve como guía visual del aroma que estás adquiriendo; el producto final es una elaboración propia diseñada para ofrecerte la misma experiencia sensorial con nuestro sello artesanal.</div>`;

  const isFav = favorites.some(f => f.id === currentModalProduct.id);
  const heartSvg = isFav ? 
    `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:24px; height:24px; color:#ff4757;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>` : 
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:24px; height:24px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  modalBody.innerHTML = `<div class="modal-producto"><div class="modal-img">${imgHtml}</div><div class="modal-info"><div style="display:flex; justify-content:space-between; align-items:flex-start;"><div class="modal-nombre">${escapeHtml(currentModalProduct.nombre)}</div><button class="fav-toggle-btn" data-id="${currentModalProduct.id}" style="background:none; border:none; cursor:pointer; padding:0 0 0 10px; display:flex; align-items:center; justify-content:center; transition:transform 0.2s;">${heartSvg}</button></div><div class="modal-genero">${generoLabel}</div><div class="acordes-titulo">ACORDES PRINCIPALES</div>${acordesHtml}</div></div>${disclaimerHtml}<div class="ml-selector"><button class="ml-btn ${modalMlSelected === 50 ? 'selected' : ''}" data-ml="50">50 ml · L.250</button><button class="ml-btn ${modalMlSelected === 100 ? 'selected' : ''}" data-ml="100">100 ml · L.500</button></div>${bottleImgHtml}<div class="precio-dinamico">L. ${precio}</div><div class="cantidad-row"><span class="cantidad-label">Cantidad:</span><div class="qty-ctrl"><button class="qty-decr-modal">−</button><span class="qty-num" id="modalQty">${modalCantidad}</span><button class="qty-incr-modal">+</button></div></div><button class="btn-agregar-modal" id="modalAddToCart"> Agregar al carrito · L. ${precio * modalCantidad}</button>`;

  document.querySelector('.fav-toggle-btn')?.addEventListener('click', (e) => {
    toggleFavorite(currentModalProduct);
    renderModalContent();
    renderProductos(); // Para actualizar el corazón en la grid si es visible
  });

  document.querySelectorAll('.ml-btn').forEach(btn => btn.addEventListener('click', () => {
    modalMlSelected = parseInt(btn.dataset.ml);
    renderModalContent();
  }));
  document.querySelector('.qty-decr-modal')?.addEventListener('click', () => {
    if (modalCantidad > 1) modalCantidad--;
    renderModalContent();
  });
  document.querySelector('.qty-incr-modal')?.addEventListener('click', () => {
    modalCantidad++;
    renderModalContent();
  });
  document.getElementById('modalAddToCart')?.addEventListener('click', () => {
    addToCart(currentModalProduct, modalMlSelected, modalCantidad);
    closeModal();
  });
}

// ========== RENDERIZADO DE PRODUCTOS ==========
function renderProductos() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  let filtered = allProducts.filter(p => {
    if (filtroGenero !== 'todos' && p.genero !== filtroGenero) return false;
    if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm)) return false;
    return true;
  });
  resultCounter.innerText = `${filtered.length} productos`;
  if (filtered.length === 0) {
    productosGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">✨ No se encontraron fragancias. Prueba otro nombre.</div>';
    return;
  }

  let html = '';
  filtered.forEach(prod => {
    const generoLabel = prod.genero === 'caballero' ? 'Caballero' : 'Dama';
    const emoji = prod.genero === 'caballero' ? '🧔‍♂️' : '🌸';

    let imgBlock = '';
    if (prod.imgPath) {
      const srcEncoded = prod.imgPath.replace(/ /g, '%20');
      imgBlock = `<img src="${srcEncoded}" alt="${escapeHtml(prod.nombre)}" style="width:100%; height:100%; object-fit:contain; padding:16px;" onerror="this.style.display='none'; this.nextSibling.style.display='flex';">`;
      imgBlock += `<div style="width:100%; height:100%; display:none; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:24px 24px 0 0;"><div style="font-size:3.5rem; filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.2));">${emoji}</div><div style="font-size:0.7rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:4px 12px; border-radius:30px;">${prod.nombre.substring(0, 18)}</div></div>`;
    } else {
      imgBlock = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #e8d5c0, #d4bca0); border-radius:24px 24px 0 0;"><div style="font-size:3.5rem;">${emoji}</div><div style="font-size:0.7rem; font-weight:600; color:#7a5a3a; margin-top:8px; background:rgba(255,255,255,0.7); padding:4px 12px; border-radius:30px;">${prod.nombre.substring(0, 18)}</div></div>`;
    }

    const isFav = favorites.some(f => f.id === prod.id);
    const heartSvg = isFav ? 
      `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:20px; height:20px; color:#ff4757;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>` : 
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:20px; height:20px; color:#a0a0a0;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    html += `<div class="card" data-id="${prod.id}"><div class="card-img">${imgBlock}<div class="badge-gen"> Inspiraciones Premium</div><button class="card-fav-btn" data-id="${prod.id}" style="position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.9); border:none; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.08); transition:all 0.3s ease;">${heartSvg}</button></div><div class="card-body"><div class="card-genero">${generoLabel}</div><div class="card-nombre">${escapeHtml(prod.nombre)}</div><div class="card-precio-preview"><small>L.</small> 250 <small style="font-size:0.65rem;opacity:.7">50ml</small></div><button class="btn-ver-detalle" data-id="${prod.id}"> Ver acordes y agregar</button></div></div>`;
  });
  productosGrid.innerHTML = html;
  attachCardEvents();
}

function attachCardEvents() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-ver-detalle')) return;
      const id = parseInt(card.dataset.id);
      const product = allProducts.find(p => p.id === id);
      if (product) openModal(product);
    });
  });
  document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const product = allProducts.find(p => p.id === id);
      if (product) openModal(product);
    });
  });
  document.querySelectorAll('.card-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const product = allProducts.find(p => p.id === id);
      if (product) {
        toggleFavorite(product);
        renderProductos();
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
  const idx = favorites.findIndex(f => f.id === product.id);
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast(`💔 Eliminado de favoritos`);
  } else {
    favorites.push(product);
    showToast(`❤️ Agregado a favoritos`);
  }
  saveFavorites();
}

function renderFavorites() {
  const favList = document.getElementById('favList');
  if (!favList) return;

  if (favorites.length === 0) {
    favList.innerHTML = `
      <div style="text-align:center; padding: 60px 20px;">
        <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">❤️</div>
        <h4 style="color: var(--texto); margin-bottom: 10px;">¿Aún sin favoritos?</h4>
        <p style="font-size: 0.9rem; color: var(--texto-suave);">Guarda las fragancias que más te gusten para tenerlas siempre a mano.</p>
      </div>`;
    return;
  }

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding: 0 5px;">
      <span style="font-size:0.85rem; color:var(--texto-suave);">${favorites.length} fragancias guardadas</span>
      <button onclick="addAllFavsToCart()" style="background:var(--primario); color:white; border:none; padding:8px 16px; border-radius:12px; font-size:0.85rem; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(194, 126, 74, 0.2);">Agregar todas (50ml)</button>
    </div>
  `;

  favorites.forEach(prod => {
    const emoji = prod.genero === 'caballero' ? '🧔‍♂️' : '🌸';
    const imgSrc = prod.imgPath ? prod.imgPath.replace(/ /g, '%20') : '';
    const imgHtml = imgSrc ? `<img src="${imgSrc}" style="width:65px; height:65px; object-fit:contain; background:white; border-radius:12px; padding:4px;" onerror="this.style.display='none'">` : `<div style="width:65px; height:65px; background:white; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">${emoji}</div>`;

    html += `
      <div class="fav-item" style="background: rgba(255,255,255,0.7); border: 1px solid rgba(0,0,0,0.03); margin-bottom: 12px; padding: 12px; border-radius: 20px; display: flex; align-items: center; gap: 15px; position: relative; transition: all 0.3s ease;">
        <div onclick="openModalById(${prod.id})" style="cursor:pointer; display:flex; align-items:center; gap:15px; flex:1;">
          ${imgHtml}
          <div class="fav-item-info">
            <div class="fav-item-name" style="font-weight:700; font-size:0.95rem;">${escapeHtml(prod.nombre)}</div>
            <div style="font-size:0.75rem; color:var(--texto-suave);">${prod.genero === 'caballero' ? 'Caballero' : 'Dama'} · L. 250</div>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button onclick="addToCartFromFav(${prod.id})" style="background:white; border:1px solid rgba(0,0,0,0.05); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </button>
          <button class="remove-fav" onclick="event.stopPropagation(); removeFavorite(${prod.id})" style="background:rgba(255,71,87,0.1); color:#ff4757; border:none; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">&times;</button>
        </div>
      </div>`;
  });
  favList.innerHTML = html;
}

function addToCartFromFav(id) {
  const prod = allProducts.find(p => p.id === id);
  if (prod) {
    addToCart(prod, 50, 1);
    showToast(`🛍️ ${prod.nombre} agregado al carrito`);
  }
}

function addAllFavsToCart() {
  if (favorites.length === 0) return;
  favorites.forEach(prod => {
    addToCart(prod, 50, 1);
  });
  showToast(`✨ ${favorites.length} fragancias agregadas al carrito`);
  closeFavOverlay();
  openCartSidebar();
}

function removeFavorite(id) {
  favorites = favorites.filter(f => f.id !== id);
  saveFavorites();
  renderProductos();
}

function openModalById(id) {
  const product = allProducts.find(p => p.id === id);
  if (product) {
    closeFavOverlay();
    openModal(product);
  }
}

// ========== UTILIDADES ==========
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function sendOrderToWhatsapp() {
  if (cart.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }
  let mensaje = "🛍️ *NUEVO PEDIDO - GOTA MAESTRA HN*\n\n";
  let total = 0;
  cart.forEach(item => {
    const subtotal = item.cantidad * item.precio;
    total += subtotal;
    mensaje += `• *${item.nombre}* (${item.genero === 'caballero' ? 'Caballero' : 'Dama'}) ${item.ml}ml x${item.cantidad} = L. ${subtotal}\n`;
  });
  mensaje += `\n🧾 *TOTAL (Sin envío): L. ${total}*\n`;
  mensaje += `\n📍 *Información para envío:*\n- Nombre quien recibe:\n- Teléfono:\n- Dirección exacta:\n`;
  mensaje += `\n⚠️ _Nota: El costo de envío se calculará por separado_\n_y no está incluido en el total de arriba._\n\n¡Gracias!`;

  // Registrar pedido en Google Sheets
  const SHEET_URL = "https://script.google.com/macros/s/AKfycbwYp2izMTSZsrSmmtQxxbmNiAw30v3asWSZ3s_R_4qSRGDiunLoX5nrhSmPF5dLuz7DCw/exec";
  const orderData = {
    items: cart.map(item => ({
      id: item.id,
      nombre: item.nombre,
      genero: item.genero,
      ml: item.ml,
      cantidad: item.cantidad,
      precio: item.precio
    })),
    total: total
  };

  fetch(SHEET_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: new Blob([JSON.stringify(orderData)], { type: 'application/json' })
  }).catch(err => console.log("Error Sheets:", err));

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank');

  // Limpiar el carrito después de enviar el pedido
  cart = [];
  saveCart();
  renderCartSidebar();
  closeCartSidebar();
}

function closeMobile() {
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) mobileNav.style.display = 'none';
}

// ========== EVENT LISTENERS ==========
document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroGenero = btn.dataset.genero;
    renderProductos();
  });
});

const clearSearchBtn = document.getElementById('clearSearch');
searchInput.addEventListener('input', () => {
  if (searchInput.value.length > 0) {
    clearSearchBtn.style.display = 'block';
  } else {
    clearSearchBtn.style.display = 'none';
  }
  renderProductos();
});

clearSearchBtn?.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  renderProductos();
  searchInput.focus();
});

document.getElementById('cartIconBtn')?.addEventListener('click', openCartSidebar);
document.getElementById('closeCartBtn')?.addEventListener('click', closeCartSidebar);
cartOverlayEl?.addEventListener('click', closeCartSidebar);
document.getElementById('clearCartBtn')?.addEventListener('click', () => {
  cart = [];
  saveCart();
  updateCartUI();
  closeCartSidebar();
});
document.getElementById('sendWhatsappBtn')?.addEventListener('click', sendOrderToWhatsapp);
closeModalBtn?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

const hamburger = document.getElementById('hamburgerBtn');
const mobileNav = document.getElementById('mobileNav');
function toggleMobile() {
  mobileNav.style.display = mobileNav.style.display === 'flex' ? 'none' : 'flex';
}
hamburger?.addEventListener('click', toggleMobile);
document.getElementById('mobileCartLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  closeMobile();
  openCartSidebar();
});

// ========== INITIALIZATION ==========
loadCart();
loadFavorites();
renderProductos();

// ========== MOBILE BOTTOM NAV HANDLERS ==========
const mobileSearchBtn = document.getElementById('mobileSearchBtn');
const mobileSearchOverlay = document.getElementById('mobileSearchOverlay');
const closeMobileSearch = document.getElementById('closeMobileSearch');
const mobileSearchInput = document.getElementById('mobileSearchInput');

mobileSearchBtn?.addEventListener('click', () => {
  mobileSearchOverlay.style.display = 'flex';
  setTimeout(() => mobileSearchInput.focus(), 300); // Pequeño delay para asegurar que la animación comenzó
  document.body.style.overflow = 'hidden';
  setActiveNavItem('mobileSearchBtn');
});

closeMobileSearch?.addEventListener('click', () => {
  mobileSearchOverlay.style.display = 'none';
  document.body.style.overflow = '';
  setActiveNavItem('mobileHomeBtn');
});

mobileSearchInput?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase().trim();
  
  // Filtrar la grid principal directamente
  searchInput.value = term;
  renderProductos();

  // No mostramos lista de nombres, solo filtramos el fondo
  if (term.length > 0) {
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});



function closeMobileSearchOverlay() {
  mobileSearchOverlay.style.display = 'none';
  document.body.style.overflow = '';
  setActiveNavItem('mobileHomeBtn');
}

const mobileFavBtn = document.getElementById('mobileFavBtn');
const favOverlay = document.getElementById('favOverlay');
const closeFavBtn = document.getElementById('closeFavBtn');

mobileFavBtn?.addEventListener('click', () => {
  favOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setActiveNavItem('mobileFavBtn');
});

closeFavBtn?.addEventListener('click', closeFavOverlay);
favOverlay?.addEventListener('click', (e) => {
  if (e.target === favOverlay) closeFavOverlay();
});

const mobileNotifBtn = document.getElementById('mobileNotifBtn');
mobileNotifBtn?.addEventListener('click', () => {
  showToast("🔔 ¡Pronto! Tendremos ofertas especiales aquí.");
  setActiveNavItem('mobileNotifBtn');
  document.getElementById('notifDot').style.display = 'none';
  setTimeout(() => setActiveNavItem('mobileHomeBtn'), 2000);
});

// Simular una notificación después de 10 segundos
setTimeout(() => {
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = 'block';
}, 10000);

function closeFavOverlay() {
  favOverlay.style.display = 'none';
  document.body.style.overflow = '';
  setActiveNavItem('mobileHomeBtn');
}

function setActiveNavItem(id) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// ========== ANIMATIONS AND PREMIUM EFFECTS ==========
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  const currentScrollY = window.scrollY;
  
  // Header scrolled effect
  if (currentScrollY > 50) {
    header.classList.add('header-scrolled');
  } else {
    header.classList.remove('header-scrolled');
  }

  // Mobile Nav Label Hide on Scroll
  const homeBtn = document.getElementById('mobileHomeBtn');
  if (homeBtn && homeBtn.classList.contains('active')) {
    if (currentScrollY > 100) {
      homeBtn.classList.add('scrolled');
    } else {
      homeBtn.classList.remove('scrolled');
    }
  }

  lastScrollY = currentScrollY;
});


const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
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

// Intercept renderProductos to re-observe cards
const originalRenderProductos = renderProductos;
renderProductos = function () {
  originalRenderProductos();
  observeCards();
};

// ========== BACK BUTTON HANDLING (MOBILE) ==========
window.addEventListener('popstate', (e) => {
  if (modalOverlay.classList.contains('open')) {
    closeModal(true);
  }
  if (cartSidebar.classList.contains('open')) {
    closeCartSidebar(true);
  }
  if (favOverlay.style.display === 'flex') {
    closeFavOverlay();
  }
  if (mobileSearchOverlay.style.display === 'flex') {
    closeMobileSearchOverlay();
  }
});

// Activate for initial load
observeCards();