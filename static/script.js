// ==================== STATE MANAGEMENT ====================
let allProducts = [];
let filteredProducts = [];
let currentView = 'grid';
const filters = {
    category: [],
    brand: [],
    size: [],
    color: [],
    inStock: false,
    search: ''
};

// ==================== DOM ELEMENTS ====================
const productsGrid = document.getElementById('productsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const brandFilter = document.getElementById('brandFilter');
const sizeFilter = document.getElementById('sizeFilter');
const colorFilter = document.getElementById('colorFilter');
const totalItemsSpan = document.getElementById('totalItems');
const totalValueSpan = document.getElementById('totalValue');
const viewBtns = document.querySelectorAll('.view-btn');
const resetBtn = document.querySelector('.btn-reset');
const availabilityCheckbox = document.querySelector('.availability-filter');
const modal = document.getElementById('productModal');
const modalClose = document.querySelector('.modal-close');
const productModal = document.getElementById('productModal');

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', async () => {
    await loadInventory();
    setupEventListeners();
});

// ==================== LOAD DATA ====================
async function loadInventory() {
    try {
        const response = await fetch('/inventory');
        if (!response.ok) throw new Error('Failed to load inventory');
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        populateFilters();
        renderProducts();
        updateStats();
    } catch (error) {
        console.error('Error loading inventory:', error);
        productsGrid.innerHTML = `
            <div class="loading" style="color: #EF4444;">
                ❌ Failed to load inventory. Please refresh the page.
            </div>
        `;
    }
}

// ==================== POPULATE FILTERS ====================
function populateFilters() {
    // Get unique values
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
    const sizes = [...new Set(allProducts.map(p => p.size).filter(Boolean))];
    const colors = [...new Set(allProducts.map(p => p.color).filter(Boolean))];

    // Populate category filter
    categoryFilter.innerHTML = categories.map(cat => `
        <label class="checkbox-label">
            <input type="checkbox" class="filter-checkbox" data-filter="category" value="${cat}">
            <span>${cat || 'Uncategorized'}</span>
        </label>
    `).join('');

    // Populate brand filter
    brandFilter.innerHTML = brands.map(brand => `
        <label class="checkbox-label">
            <input type="checkbox" class="filter-checkbox" data-filter="brand" value="${brand}">
            <span>${brand || 'Unknown Brand'}</span>
        </label>
    `).join('');

    // Populate size filter
    sizeFilter.innerHTML = sizes.map(size => `
        <label class="checkbox-label">
            <input type="checkbox" class="filter-checkbox" data-filter="size" value="${size}">
            <span>${size || 'N/A'}</span>
        </label>
    `).join('');

    // Populate color filter
    colorFilter.innerHTML = colors.map(color => `
        <label class="checkbox-label">
            <input type="checkbox" class="filter-checkbox" data-filter="color" value="${color}">
            <span>${color || 'Colorless'}</span>
        </label>
    `).join('');
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.toLowerCase();
        applyFilters();
    });

    // Filter checkboxes
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('filter-checkbox')) {
            const filterType = e.target.getAttribute('data-filter');
            const value = e.target.value;

            if (e.target.checked) {
                if (!filters[filterType].includes(value)) {
                    filters[filterType].push(value);
                }
            } else {
                filters[filterType] = filters[filterType].filter(v => v !== value);
            }
            applyFilters();
        }

        // Availability filter
        if (e.target.classList.contains('availability-filter')) {
            filters.inStock = e.target.checked;
            applyFilters();
        }
    });

    // View options
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.getAttribute('data-view');
            renderProducts();
        });
    });

    // Reset filters
    resetBtn.addEventListener('click', () => {
        filters.category = [];
        filters.brand = [];
        filters.size = [];
        filters.color = [];
        filters.inStock = false;
        filters.search = '';
        searchInput.value = '';
        
        document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
        availabilityCheckbox.checked = false;
        
        applyFilters();
    });

    // Modal close
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// ==================== APPLY FILTERS ====================
function applyFilters() {
    filteredProducts = allProducts.filter(product => {
        // Search filter
        if (filters.search) {
            const searchMatch = 
                product.name.toLowerCase().includes(filters.search) ||
                (product.brand && product.brand.toLowerCase().includes(filters.search)) ||
                (product.category && product.category.toLowerCase().includes(filters.search));
            if (!searchMatch) return false;
        }

        // Category filter
        if (filters.category.length > 0 && !filters.category.includes(product.category)) {
            return false;
        }

        // Brand filter
        if (filters.brand.length > 0 && !filters.brand.includes(product.brand)) {
            return false;
        }

        // Size filter
        if (filters.size.length > 0 && !filters.size.includes(product.size)) {
            return false;
        }

        // Color filter
        if (filters.color.length > 0 && !filters.color.includes(product.color)) {
            return false;
        }

        // Availability filter
        if (filters.inStock && product.quantity <= 0) {
            return false;
        }

        return true;
    });

    renderProducts();
    updateStats();
}

// ==================== GET CATEGORY EMOJI ====================
function getCategoryEmoji(category) {
    const emojiMap = {
        'footwear': '👟',
        'apparel': '👕',
        'equipment': '⚽',
        'accessories': '🧢',
        'bags': '🎒',
        'shoes': '👟',
        'clothing': '👕',
        'gear': '⚙️',
        'accessories': '🎽'
    };

    if (category) {
        const key = category.toLowerCase();
        for (let [match, emoji] of Object.entries(emojiMap)) {
            if (key.includes(match)) return emoji;
        }
    }

    const defaultEmojis = ['⚽', '🏀', '⚾', '🎾', '🏐', '🏈', '⛳', '🏸', '🥊'];
    return defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
}

// ==================== GET STOCK STATUS ====================
function getStockStatus(quantity) {
    if (quantity === 0) return { badge: 'out-of-stock', text: 'Out of Stock' };
    if (quantity < 10) return { badge: 'low-stock', text: 'Low Stock' };
    return { badge: 'in-stock', text: 'In Stock' };
}

// ==================== RENDER PRODUCTS ====================
function renderProducts() {
    // Clear grid
    productsGrid.innerHTML = '';

    // Add grid class based on view
    if (currentView === 'list') {
        productsGrid.classList.add('list-view');
    } else {
        productsGrid.classList.remove('list-view');
    }

    // Show empty state if no products
    if (filteredProducts.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Render products
    filteredProducts.forEach(product => {
        const stockStatus = getStockStatus(product.quantity);
        const emoji = getCategoryEmoji(product.category);

        const productCard = document.createElement('div');
        productCard.className = `product-card ${currentView === 'list' ? 'list-view' : ''}`;
        productCard.innerHTML = `
            <div class="product-image ${currentView === 'list' ? 'list-view' : ''}">
                ${emoji}
                <div class="badge ${stockStatus.badge}">${stockStatus.text}</div>
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand || 'Unknown Brand'}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-meta">
                    ${product.category ? `<div class="meta-item">📂 ${product.category}</div>` : ''}
                    ${product.size ? `<div class="meta-item">📏 ${product.size}</div>` : ''}
                    ${product.color ? `<div class="meta-item">🎨 ${product.color}</div>` : ''}
                </div>
                <div class="product-stock">
                    <span class="stock-label">In Stock:</span>
                    <span class="stock-count">${product.quantity}</span>
                </div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="btn-primary" onclick="viewDetails(${product.id})">View Details</button>
                    <button class="btn-secondary" onclick="addToCart(${product.id})">Add</button>
                </div>
            </div>
        `;

        productsGrid.appendChild(productCard);
    });
}

// ==================== VIEW PRODUCT DETAILS ====================
function viewDetails(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const stockStatus = getStockStatus(product.quantity);
    const emoji = getCategoryEmoji(product.category);

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-image">${emoji}</div>
        <div class="modal-title">${product.name}</div>
        <div class="modal-subtitle">${product.brand || 'Unknown Brand'}</div>
        
        <div class="modal-details">
            ${product.category ? `
                <div class="detail-item">
                    <div class="detail-label">Category</div>
                    <div class="detail-value">${product.category}</div>
                </div>
            ` : ''}
            ${product.size ? `
                <div class="detail-item">
                    <div class="detail-label">Size</div>
                    <div class="detail-value">${product.size}</div>
                </div>
            ` : ''}
            ${product.color ? `
                <div class="detail-item">
                    <div class="detail-label">Color</div>
                    <div class="detail-value">${product.color}</div>
                </div>
            ` : ''}
            <div class="detail-item">
                <div class="detail-label">Quantity</div>
                <div class="detail-value" style="color: ${product.quantity > 0 ? '#10B981' : '#EF4444'}">
                    ${product.quantity} items
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value" style="color: ${product.quantity > 0 ? '#10B981' : '#EF4444'}">
                    ${stockStatus.text}
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Price per Unit</div>
                <div class="modal-price">$${product.price.toFixed(2)}</div>
            </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button class="btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
            <button class="btn-secondary" onclick="closeModal()">Close</button>
        </div>
    `;

    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

// ==================== ADD TO CART ====================
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // Show feedback
    alert(`✅ Added "${product.name}" to cart!\n\nPrice: $${product.price.toFixed(2)}`);
    closeModal();
}

// ==================== UPDATE STATISTICS ====================
function updateStats() {
    const totalQuantity = filteredProducts.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = filteredProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);

    totalItemsSpan.textContent = totalQuantity.toLocaleString();
    totalValueSpan.textContent = `$${totalValue.toFixed(2)}`;
}
