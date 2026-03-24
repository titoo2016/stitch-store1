const STORAGE_KEYS = {
  products: "stitch_store_products_v4",
  orders: "stitch_store_orders_v4",
  admin: "stitch_store_admin_session_v4"
};

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "Stitch#201555256793";

const $ = (s) => document.querySelector(s);

function getProducts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || "[]");
}
function saveProducts(products) {
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
}
function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.orders) || "[]");
}
function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}
function formatPrice(value) {
  return `${Number(value).toLocaleString("ar-EG")} جنيه`;
}

function isLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.admin) === "true";
}
function showDashboard() {
  $("#loginView").classList.add("hidden");
  $("#dashboardView").classList.remove("hidden");
  renderStats();
  renderProducts();
  renderOrders();
}
function showLogin() {
  $("#loginView").classList.remove("hidden");
  $("#dashboardView").classList.add("hidden");
}

$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = $("#adminUsername").value.trim();
  const password = $("#adminPassword").value.trim();

  if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
    localStorage.setItem(STORAGE_KEYS.admin, "true");
    showDashboard();
  } else {
    alert("اسم المستخدم أو كلمة المرور غير صحيحة.");
  }
});

$("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEYS.admin);
  showLogin();
});

function renderStats() {
  const products = getProducts();
  const orders = getOrders();
  $("#productsCount").textContent = products.length.toLocaleString("ar-EG");
  $("#ordersCount").textContent = orders.length.toLocaleString("ar-EG");
  $("#newOrdersCount").textContent = orders.filter(o => o.status === "جديد").length.toLocaleString("ar-EG");
}

function resetForm() {
  $("#productId").value = "";
  $("#nameInput").value = "";
  $("#priceInput").value = "";
  $("#categoryInput").value = "هودي";
  $("#descriptionInput").value = "";
  $("#imageInput").value = "";
  $("#formTitle").textContent = "إضافة منتج جديد";
}

$("#productForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const id = $("#productId").value;
  const product = {
    id: id || crypto.randomUUID(),
    name: $("#nameInput").value.trim(),
    price: Number($("#priceInput").value),
    category: $("#categoryInput").value,
    description: $("#descriptionInput").value.trim(),
    image: $("#imageInput").value.trim()
  };

  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx >= 0) products[idx] = product;
  else products.unshift(product);

  saveProducts(products);
  resetForm();
  renderStats();
  renderProducts();
});

$("#resetFormBtn").addEventListener("click", resetForm);

function renderProducts() {
  const list = $("#adminProductsList");
  const products = getProducts();

  if (!products.length) {
    list.innerHTML = `<div class="empty">لا توجد منتجات.</div>`;
    return;
  }

  list.innerHTML = products.map((p) => `
    <div class="admin-item">
      <img src="${p.image}" alt="${p.name}">
      <div>
        <h4>${p.name}</h4>
        <p>${p.category} · ${formatPrice(p.price)}</p>
      </div>
      <div class="small-stack">
        <button class="btn btn-secondary" onclick="editProduct('${p.id}')">تعديل</button>
        <button class="btn btn-danger" onclick="deleteProduct('${p.id}')">حذف</button>
      </div>
    </div>
  `).join("");
}

function editProduct(id) {
  const p = getProducts().find((item) => item.id === id);
  if (!p) return;

  $("#productId").value = p.id;
  $("#nameInput").value = p.name;
  $("#priceInput").value = p.price;
  $("#categoryInput").value = p.category;
  $("#descriptionInput").value = p.description;
  $("#imageInput").value = p.image;
  $("#formTitle").textContent = "تعديل المنتج";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteProduct(id) {
  if (!confirm("هل تريد حذف هذا المنتج؟")) return;
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
  renderStats();
  renderProducts();
}

function renderOrders() {
  const list = $("#ordersList");
  const orders = getOrders();

  if (!orders.length) {
    list.innerHTML = `<div class="empty">لا توجد طلبات حتى الآن.</div>`;
    return;
  }

  list.innerHTML = orders.map((order) => `
    <div class="order-card">
      <div class="row-between">
        <h4>${order.id}</h4>
        <span class="badge ${order.status === "تم التواصل" ? "done" : ""}">${order.status}</span>
      </div>

      <div class="order-meta">
        <span>العميل: ${order.customerName}</span>
        <span>الهاتف: ${order.customerPhone}</span>
        <span>العنوان: ${order.customerAddress}</span>
        <span>الدفع: ${order.paymentMethod}</span>
        <span>الوقت: ${order.createdAt}</span>
        <span>الإجمالي: ${formatPrice(order.total)}</span>
        <span>ملاحظات: ${order.customerNotes || "لا يوجد"}</span>
      </div>

      <div class="order-items">
        ${order.items.map((item) => `<span>${item.name} × ${item.qty} — ${formatPrice(item.price * item.qty)}</span>`).join("")}
      </div>

      <div class="order-actions">
        <button class="btn btn-primary" onclick="markOrderDone('${order.id}')">تم التواصل</button>
        <button class="btn btn-danger" onclick="deleteOrder('${order.id}')">حذف الطلب</button>
      </div>
    </div>
  `).join("");
}

function markOrderDone(id) {
  const orders = getOrders().map((order) => order.id === id ? { ...order, status: "تم التواصل" } : order);
  saveOrders(orders);
  renderStats();
  renderOrders();
}

function deleteOrder(id) {
  if (!confirm("هل تريد حذف هذا الطلب؟")) return;
  saveOrders(getOrders().filter((order) => order.id !== id));
  renderStats();
  renderOrders();
}

$("#clearOrdersBtn").addEventListener("click", () => {
  if (!confirm("سيتم حذف كل الطلبات. هل أنت متأكد؟")) return;
  saveOrders([]);
  renderStats();
  renderOrders();
});

if (isLoggedIn()) showDashboard();
else showLogin();

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.markOrderDone = markOrderDone;
window.deleteOrder = deleteOrder;
