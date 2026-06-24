let slideIndex = 1;
if (document.querySelector('.mySlides')) {
  showSlides(slideIndex);
}
 
function plusSlides(n: number):void { showSlides(slideIndex += n); }
function currentSlide(n: number):void { showSlides(slideIndex = n); }
 
function showSlides(n: number): void{
  const slides = document.getElementsByClassName('mySlides') as HTMLCollectionOf<HTMLElement>;
  if (slides.length === 0) return;
  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = 'none';
  }
  slides[slideIndex - 1].style.display = 'block';
}
 

//  SHARED STATE

let allProducts = [];
let allCategories = [];
let currentPage = 1;
const PRODUCTS_PER_PAGE = 8;
 

function showError(message: string): void{
  const banner = document.getElementById('error-banner');
  if (!banner) return;
  banner.textContent = message;
  banner.classList.remove('hidden');
}
 

//  LOAD DATA 

async function loadData() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch('https://ecommerce.routemisr.com/api/v1/products'),
      fetch('https://ecommerce.routemisr.com/api/v1/categories')
    ]);
 
    // Check HTTP errors
    if (!productsRes.ok) throw new Error(`Products API error: ${productsRes.status}`);
    if (!categoriesRes.ok) throw new Error(`Categories API error: ${categoriesRes.status}`);
 
    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();
 
    allProducts = productsData.data;
    allCategories = categoriesData.data;
 
    // index.html has category cards ans the shop.html does not
    if (document.getElementById('category-cards')) {
      renderCategoryCards();
    }
 
    renderFilterTabs();
    renderProducts(allProducts);
 /* no connection */
  } catch (err) {
    console.error('Failed to load data:', err);
    showError('⚠️ Could not load products. Please check your connection and try again.');
 
    const grid = document.getElementById('products-grid');
    if (grid) {
      grid.innerHTML = '<p class="text-center text-red-400 py-10 col-span-4">Failed to load products.</p>';
    }
  }
}
 

//  CATEGORY CARDS  (index.html only)

function renderCategoryCards() {
  const container = document.getElementById('category-cards');
  if (!container) return;
 
  const featured = allCategories.slice(0, 3);
  container.innerHTML = featured.map((cat, i) => `
    <div
      class="relative overflow-hidden rounded cursor-pointer h-[220px] md:h-[300px] bg-[#f5f5f5] ${i === 0 ? 'bg-[#7b7fcf]' : ''}"
      onclick="filterAndGoShop('${cat._id}')"
      style="transition: transform 0.3s;"
    >
      <img
        src="${cat.image}" alt="${cat.name}"
        class="w-full h-full object-cover"
        style="transition: transform 0.3s;"
      >
      <div class="absolute top-5 left-5">
        <h3 class="text-lg md:text-[22px] font-bold ${i === 0 ? 'text-white' : 'text-[#222]'}">${cat.name}</h3>
        <p class="text-sm mt-1 ${i === 0 ? 'text-white' : 'text-[#555]'}">New Collection</p>
        ${i === 0 ? '<span class="inline-block mt-8 md:mt-[140px] text-white font-bold text-xs border-b-2 border-white pb-[2px]">SHOP NOW</span>' : ''}
      </div>
    </div>
  `).join('');
}
 
// Go to shop.html filtered by category
function filterAndGoShop(categoryId: string): void {
  localStorage.setItem('shopCategory', categoryId);
  window.location.href = 'shop.html';
}
 

//  FILTER TABS

function renderFilterTabs() {
  const tabs = document.getElementById('filter-tabs');
  if (!tabs) return;
 
  const categoryButtons = allCategories.map(cat => `
    <button class="tab-btn bg-transparent border-none border-b-2 border-transparent px-[6px] py-[10px] text-sm text-[#555] cursor-pointer transition-all"
      onclick="filterProducts('${cat._id}', event)">${cat.name}</button>
  `).join('');
 
  tabs.innerHTML = `
    <button class="tab-btn active bg-transparent border-none border-b-2 border-transparent px-[6px] py-[10px] text-sm text-[#555] cursor-pointer transition-all"
      onclick="filterProducts('all', event)">All Products</button>
    ${categoryButtons}
  `;
}

//  FILTER PRODUCTS

function filterProducts(categoryId: string, event: MouseEvent): void {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) (event.target as HTMLElement).classList.add('active');
 
  const filtered = categoryId === 'all'
    ? allProducts
    : allProducts.filter(p => p.category._id === categoryId);
 
  currentPage = 1;
  renderProducts(filtered);
}
 

//  RENDER PRODUCTS  

function renderProducts(products:any[]):void {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
 
  if (products.length === 0) {
    grid.innerHTML = '<p class="text-center text-[#999] py-10 col-span-4">No products found.</p>';
    renderPagination(0, products);
    return;
  }
 
  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginated = products.slice(start, start + PRODUCTS_PER_PAGE);
 
  grid.innerHTML = paginated.map(p => `
    <div class="product-card bg-white rounded overflow-hidden cursor-pointer transition-shadow"
      onclick="goToProduct('${p.id}')">
      <div class="relative bg-[#f5f5f5] h-[200px] md:h-[280px]">
        <img src="${p.imageCover}" alt="${p.title}" class="w-full h-full object-cover">
        <button class="wish-btn absolute top-2 right-2 bg-white border-none rounded-full w-[34px] h-[34px] cursor-pointer flex items-center justify-center shadow-md opacity-0 transition-opacity">
          <i class="fa-regular fa-heart text-sm"></i>
        </button>
      </div>
      <div class="p-3">
        <p class="text-[11px] text-[#999] uppercase mb-1">${p.category.name}</p>
        <h4 class="product-title text-sm font-semibold mb-2">${p.title}</h4>
        <div class="flex justify-between items-center">
          <span class="text-sm font-bold">
            ${p.priceAfterDiscount
              ? `<span class="line-through text-[#aaa] font-normal text-xs mr-1"> $${p.price} </span> $${p.priceAfterDiscount} `
              : ` $${p.price} `}
          </span>
          <span class="text-sm text-[#666]">⭐ ${p.ratingsAverage}</span>
        </div>
      </div>
    </div>
  `).join('');
 
  renderPagination(products.length, products);
}
 

//  PAGINATION divide to small and mangepable pages 

function renderPagination(totalCount: number, products:any[]): void {
  const container = document.getElementById('pagination');
  if (!container) return;
 
  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);
  if (totalPages <= 1) { container.innerHTML = ''; return; }
 
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage;
    html += `
      <button
        onclick="goToPage(${i}, event)"
        class="w-9 h-9 rounded text-sm font-medium transition-colors cursor-pointer border
          ${isActive ? 'bg-black text-white border-black' : 'bg-white text-[#555] border-[#ddd] hover:border-black'}"
      >${i}</button>
    `;
  }
  container.innerHTML = html;
  container.dataset.products = JSON.stringify(products);
}
 
function goToPage(page: number, event: MouseEvent): void{
  currentPage = page;
  // Re-render with current search/filter results
  const query = (document.getElementById('search-input') as HTMLInputElement)?.value?.toLowerCase() || '';
  const filtered = query
    ? allProducts.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.category.name.toLowerCase().includes(query) ||
        p.brand?.name?.toLowerCase().includes(query)
      )
    : allProducts;
  renderProducts(filtered);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

//  GO TO PRODUCT

function goToProduct(id: string):void {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-white/80 flex items-center justify-center z-[9999]';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
 
  const product = allProducts.find(p => p.id === id);
  if (product) localStorage.setItem('selectedProduct', JSON.stringify(product));
 
  setTimeout(() => {
    window.location.href = 'product.html?id=' + id;
  }, 600);
}
 

//  SEARCH

function searchProducts():void {
  const query = (document.getElementById('search-input') as HTMLInputElement).value.toLowerCase();
  const filtered = allProducts.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.category.name.toLowerCase().includes(query) ||
    p.brand?.name?.toLowerCase().includes(query)
  );
  currentPage = 1;
  renderProducts(filtered);
}
 

//  LOAD PRODUCT DETAIL  (product.html)

async function loadProduct() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
 
    // Try localStorage first (faster)
    const saved = localStorage.getItem('selectedProduct');
    let p = saved ? JSON.parse(saved) : null;
 
    // If no localStorage match, fetch from API
    if (!p || p.id !== id) {
      if (!id) throw new Error('No product ID in URL');
 
      const res = await fetch(`https://ecommerce.routemisr.com/api/v1/products/${id}`);
      if (!res.ok) throw new Error(`Product API error: ${res.status}`);
 
      const data = await res.json();
      p = data.data;
    }
 
    if (!p) throw new Error('Product not found');
 
    // Update breadcrumb title
    const breadcrumb = document.getElementById('breadcrumb-title');
    if (breadcrumb) breadcrumb.textContent = p.title;
    document.title = `${p.title} – Coza`;
 
    document.getElementById('product-details').innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-[60px] items-start">
 
        <!-- Images -->
        <div>
          <img id="main-img" src="${p.imageCover}" alt="${p.title}"
            class="w-full h-[280px] md:h-[450px] object-cover rounded bg-[#f5f5f5]">
          <div class="flex gap-2 mt-3 flex-wrap">
            ${(p.images || []).map(img => `
              <img src="${img}"
                class="thumb-img w-[60px] h-[60px] md:w-[70px] md:h-[70px] object-cover rounded cursor-pointer border-2 border-transparent"
                onclick="document.getElementById('main-img').src='${img}'" alt="thumb">
            `).join('')}
          </div>
        </div>
 
        <!-- Info -->
        <div>
          <p class="text-xs text-[#999] uppercase mb-2">${p.category.name}</p>
          <h1 class="text-2xl md:text-[28px] font-bold mb-3">${p.title}</h1>
          <div class="text-sm text-[#555] mb-4">
            ⭐ ${p.ratingsAverage}
            <span class="text-[#aaa] text-xs ml-1">(${p.ratingsQuantity} reviews)</span>
          </div>
          <div class="mb-5">
            ${p.priceAfterDiscount
              ? `<span class="line-through text-[#aaa] text-base mr-2"> $${p.price} </span>
                 <span class="text-2xl font-bold text-[#111]"> $${p.priceAfterDiscount} </span>`
              : `<span class="text-2xl font-bold text-[#111]"> $${p.price} </span>`}
          </div>
          <p class="text-sm text-[#666] leading-relaxed mb-4 whitespace-pre-line">${p.description}</p>
          <p class="text-xs text-[#888] mb-6">In Stock: ${p.quantity} items</p>
          <div class="flex gap-3 mb-5">
            <button class="bg-[#111] text-white border-none px-7 py-3 text-sm cursor-pointer rounded hover:bg-[#333] transition-colors flex items-center gap-2">
              <i class="fa-solid fa-cart-shopping"></i> Add to Cart
            </button>
            <button class="border border-[#ccc] bg-white px-4 py-3 text-lg cursor-pointer rounded hover:border-[#111] transition-colors">
              <i class="fa-regular fa-heart"></i>
            </button>
          </div>
          <p class="text-sm text-[#555]">Brand: <strong>${p.brand?.name || 'N/A'}</strong></p>
        </div>
 
      </div>
    `;
 
  } catch (err) {
    console.error('Failed to load product:', err);
    showError('⚠️ Could not load this product. Please go back and try again.');
    document.getElementById('product-details').innerHTML = `
      <div class="text-center py-20">
        <p class="text-[#999] mb-4">Product could not be loaded.</p>
        <button onclick="window.location.href='shop.html'"
          class="bg-[#111] text-white px-6 py-3 rounded text-sm cursor-pointer hover:bg-[#333] transition-colors">
          ← Back to Shop
        </button>
      </div>
    `;
  }
}

//  INIT — decide which page we're on

window.addEventListener('DOMContentLoaded', () => {
 
  // index.html or shop.html
  if (document.getElementById('products-grid')) {
    loadData().then(() => {
      // If shop.html was opened from a category card, auto-filter
      const savedCategory = localStorage.getItem('shopCategory');
      if (savedCategory) {
        localStorage.removeItem('shopCategory');
        const btn = document.querySelector(`.tab-btn[onclick*="${savedCategory}"]`) as HTMLElement;
        if (btn) btn.click();
      }
    });
  }
 
  // product.html
  if (document.getElementById('product-details')) {
    loadProduct();
  }
});