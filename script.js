let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) { showSlides(slideIndex += n); }
function currentSlide(n) { showSlides(slideIndex = n); }

function showSlides(n) { /* this put the images as slide show added it from w3school*/ 
  let slides = document.getElementsByClassName("mySlides");
  if (slides.length === 0) return;  
  if (n > slides.length) { slideIndex = 1 }
  if (n < 1) { slideIndex = slides.length }
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slides[slideIndex - 1].style.display = "block";
}

let allProducts = [];
let allCategories = [];

async function loadData() {
  const [productsRes, categoriesRes] = await Promise.all([ /* pauses the function until the fetch request finishes and the data comes back promise that they both work at the same time insted of one after the other */
    fetch('https://ecommerce.routemisr.com/api/v1/products'),
    fetch('https://ecommerce.routemisr.com/api/v1/categories')
  ]);
  const productsData = await productsRes.json();
  const categoriesData = await categoriesRes.json();
  allProducts = productsData.data;
  allCategories = categoriesData.data;
  renderCategoryCards();
  renderFilterTabs();
  renderProducts(allProducts);
}

function renderCategoryCards() {
  const container = document.getElementById('category-cards'); 
  const featured = allCategories.slice(0, 3); /*  Takes only the first 3 categories from the API */
  container.innerHTML = featured.map((cat, i) => `
    <div class="category-card ${i === 0 ? 'featured' : ''}" onclick="filterProducts('${cat._id}')">
      <img src="${cat.image}" alt="${cat.name}">
      <div class="category-info">
        <h3>${cat.name}</h3>
        <p>New Collection</p>
        ${i === 0 ? '<span class="shop-now">SHOP NOW</span>' : ''}
      </div>
    </div>
  `).join(''); /* Only adds the "SHOP NOW" text to the first card */
}

function renderFilterTabs() {
  const tabs = document.getElementById('filter-tabs');
  const categoryButtons = allCategories.map(cat => `
    <button class="tab-btn" onclick="filterProducts('${cat._id}')">${cat.name}</button>
  `).join('');
  tabs.innerHTML = `<button class="tab-btn active" onclick="filterProducts('all')">All Products</button>` + categoryButtons;
}

function filterProducts(categoryId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  const filtered = categoryId === 'all'
    ? allProducts
    : allProducts.filter(p => p.category._id === categoryId);
  renderProducts(filtered);
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (products.length === 0) {
    grid.innerHTML = '<p class="no-results">No products found.</p>';
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="goToProduct('${p.id}')">
      <div class="product-img-wrap">
        <img src="${p.imageCover}" alt="${p.title}">
        <button class="wish-btn"><i class="fa-regular fa-heart"></i></button>
      </div>
      <div class="product-info">
        <p class="product-category">${p.category.name}</p>
        <h4 class="product-title">${p.title}</h4>
        <div class="product-bottom">
          <span class="product-price">${p.priceAfterDiscount
            ? `<span class="old-price">${p.price} EGP</span> ${p.priceAfterDiscount} EGP`
            : `${p.price} EGP`}
          </span>
          <span class="product-rating">⭐ ${p.ratingsAverage}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function goToProduct(id) {
  // create overlay element instead of using innerHTML +=
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);  // ← safely adds it without breaking existing HTML

  const product = allProducts.find(p => p.id === id);
  localStorage.setItem('selectedProduct', JSON.stringify(product));

  setTimeout(() => {
    window.location.href = 'product.html?id=' + id;
  }, 600);
}

// ---- run the right function based on which page we're on ----
if (document.getElementById('products-grid')) {
  loadData();   // home page
}

if (document.getElementById('product-details')) {
  loadProduct();  // product details page
}

async function loadProduct() {
  const saved = localStorage.getItem('selectedProduct');
  let p = saved ? JSON.parse(saved) : null;

  if (!p) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const res = await fetch(`https://ecommerce.routemisr.com/api/v1/products/${id}`);
    const data = await res.json();
    p = data.data;
  }

  if (!p) {
    document.getElementById('product-details').innerHTML = '<p>Product not found.</p>';
    return;
  }

  document.title = p.title;
  document.getElementById('product-details').innerHTML = `
    <div class="product-details">
      <div class="details-images">
        <img id="main-img" src="${p.imageCover}" alt="${p.title}">
        <div class="thumbnails">
          ${p.images.map(img => `
            <img src="${img}" onclick="document.getElementById('main-img').src='${img}'" alt="thumb">
          `).join('')}
        </div>
      </div>
      <div class="details-info">
        <p class="details-category">${p.category.name}</p>
        <h1 class="details-title">${p.title}</h1>
        <div class="details-rating">⭐ ${p.ratingsAverage} <span>(${p.ratingsQuantity} reviews)</span></div>
        <div class="details-price">
          ${p.priceAfterDiscount
            ? `<span class="old-price">${p.price} EGP</span> <span class="new-price">${p.priceAfterDiscount} EGP</span>`
            : `<span class="new-price">${p.price} EGP</span>`}
        </div>
        <p class="details-description">${p.description}</p>
        <p class="details-stock">In Stock: ${p.quantity} items</p>
        <div class="details-actions">
          <button class="btn-cart"><i class="fa-solid fa-cart-shopping"></i> Add to Cart</button>
          <button class="btn-wish"><i class="fa-regular fa-heart"></i></button>
        </div>
        <p class="details-brand">Brand: <strong>${p.brand?.name || 'N/A'}</strong></p>
      </div>
    </div>
  `;
}
function searchProducts() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const filtered = allProducts.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.category.name.toLowerCase().includes(query) ||
    p.brand.name.toLowerCase().includes(query)
  );
  renderProducts(filtered);
}
function navigate(page) {
  if (page === 'shop') {
    document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
  }
}