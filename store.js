const STORAGE_KEYS = {
  products: "stitch_store_products_v4",
  cart: "stitch_store_cart_v4",
  orders: "stitch_store_orders_v4"
};

const defaultProducts = [
  {
    id: crypto.randomUUID(),
    name: "هودي Stitch Urban",
    price: 780,
    category: "هودي",
    description: "هودي رجالي بخامة مريحة وطابع ستريت وير مناسب للاستخدام اليومي.",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: crypto.randomUUID(),
    name: "بنطال Cargo Stitch",
    price: 560,
    category: "بنطال",
    description: "بنطال كارجو عملي بستايل حضري عصري وقصة مريحة.",
    image: "https://images.unsplash.com/photo-1506629905607-d9a3171e3d16?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: crypto.randomUUID(),
    name: "جاكيت Bomber Stitch",
    price: 1150,
    category: "جاكيت",
    description: "جاكيت بومبر مميز بتفاصيل قوية ومظهر فاخر.",
    image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: crypto.randomUUID(),
    name: "تيشيرت Stitch Core",
    price: 320,
    category: "تيشيرت",
    description: "تيشيرت رجالي بخامة ناعمة وتصميم بسيط مناسب لكل يوم.",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: crypto.randomUUID(),
    name: "شورت Stitch Summer",
    price: 390,
    category: "شورت",
    description: "شورت مريح بخامة مناسبة للصيف وحركة أكثر.",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80"
  }
];

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function seedProducts() {
  if (!localStorage.getItem(STORAGE_KEYS.products)) {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(defaultProducts));
  }
}

function getProducts() {
  seedProducts();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || "[]");
}
function getCart() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
}
function saveCart(cart) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}
function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}
function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.orders) || "[]");
}
function formatPrice(value) {
  return `${Number(value).toLocaleString("ar-EG")} جنيه`;
}

const productsGrid = $("#productsGrid");
const searchInput = $("#searchInput");
const categoryFilter = $("#categoryFilter");

function renderProducts() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const products = getProducts().filter((p) => {
    const matchQ = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchC = cat === "all" || p.category === cat;
    return matchQ && matchC;
  });

  if (!products.length) {
    productsGrid.innerHTML = `<div class="empty">لا توجد منتجات مطابقة.</div>`;
    return;
  }

  productsGrid.innerHTML = products.map((p) => `
    <article class="product-card">
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <span class="category-tag">${p.category}</span>
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="row-between">
        <strong class="product-price">${formatPrice(p.price)}</strong>
        <button class="btn btn-primary" onclick="addToCart('${p.id}')">أضف للسلة</button>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const products = getProducts();
  const product = products.find((p) => p.id === id);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });

  saveCart(cart);
  renderCart();
  openCart();
}

function updateQty(id, delta) {
  const cart = getCart()
    .map((item) => item.id === id ? { ...item, qty: item.qty + delta } : item)
    .filter((item) => item.qty > 0);
  saveCart(cart);
  renderCart();
}

function removeFromCart(id) {
  saveCart(getCart().filter((item) => item.id !== id));
  renderCart();
}

function renderCart() {
  const cart = getCart();
  $("#cartCount").textContent = cart.reduce((sum, item) => sum + item.qty, 0);

  if (!cart.length) {
    $("#cartItems").innerHTML = `<div class="empty">السلة فارغة.</div>`;
    $("#cartTotal").textContent = "0 جنيه";
    return;
  }

  $("#cartItems").innerHTML = cart.map((item) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h4>${item.name}</h4>
        <p>${formatPrice(item.price)}</p>
        <div class="qty">
          <button onclick="updateQty('${item.id}', 1)">+</button>
          <span>${item.qty}</span>
          <button onclick="updateQty('${item.id}', -1)">−</button>
        </div>
      </div>
      <button class="remove-btn" onclick="removeFromCart('${item.id}')">حذف</button>
    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);
  $("#cartTotal").textContent = formatPrice(total);
}

function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#overlay").classList.add("show");
}
function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#overlay").classList.remove("show");
}

function openCheckout() {
  if (!getCart().length) {
    alert("السلة فارغة. أضف منتجات أولاً.");
    return;
  }
  $("#checkoutModal").classList.add("show");
}
function closeCheckout() {
  $("#checkoutModal").classList.remove("show");
}

$("#openCartBtn").addEventListener("click", openCart);
$("#closeCartBtn").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
$("#openCheckoutBtn").addEventListener("click", openCheckout);
$("#closeCheckoutBtn").addEventListener("click", closeCheckout);

$("#checkoutForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const cart = getCart();
  if (!cart.length) {
    alert("السلة فارغة.");
    return;
  }

  const order = {
    id: "ORD-" + Date.now(),
    customerName: $("#customerName").value.trim(),
    customerPhone: $("#customerPhone").value.trim(),
    customerAddress: $("#customerAddress").value.trim(),
    customerNotes: $("#customerNotes").value.trim(),
    paymentMethod: "الدفع عند الاستلام",
    status: "جديد",
    createdAt: new Date().toLocaleString("ar-EG"),
    items: cart,
    total: cart.reduce((sum, item) => sum + (item.qty * item.price), 0)
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);

  localStorage.removeItem(STORAGE_KEYS.cart);
  renderCart();
  closeCheckout();
  closeCart();
  $("#checkoutForm").reset();

  alert("تم تسجيل طلبك بنجاح. سنقوم بالتواصل معك لتأكيد الطلب.");
});

$("#menuBtn").addEventListener("click", () => {
  $("#mainNav").classList.toggle("open");
});
$$('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => $("#mainNav").classList.remove("open"));
});

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

renderProducts();
renderCart();

window.addToCart = addToCart;
window.updateQty = updateQty;
window.removeFromCart = removeFromCart;
