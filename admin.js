const config = window.STITCH_SUPABASE_CONFIG || {};
const hasSupabaseConfig = Boolean(
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  !config.supabaseUrl.includes("ضع-") &&
  !config.supabaseAnonKey.includes("ضع-")
);

const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

const $ = (s) => document.querySelector(s);
let productsCache = [];
let ordersCache = [];

function formatPrice(value) {
  return `${Number(value).toLocaleString("ar-EG")} جنيه`;
}

function setStatus(message, type = "success") {
  const box = $("#saveStatus");
  box.textContent = message;
  box.className = `save-status ${type}`;
  box.hidden = false;
}

function clearStatus() {
  const box = $("#saveStatus");
  box.hidden = true;
  box.textContent = "";
  box.className = "save-status";
}

function isConfigured() {
  if (supabaseClient) return true;
  setStatus("أكمل بيانات Supabase داخل الملف supabase-config.js أولًا.", "error");
  return false;
}

async function getSession() {
  if (!supabaseClient) return null;
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

async function requireAuth() {
  const session = await getSession();
  if (session) {
    showDashboard();
    await refreshDashboard();
  } else {
    showLogin();
  }
}

function showDashboard() {
  $("#loginView").classList.add("hidden");
  $("#dashboardView").classList.remove("hidden");
}
function showLogin() {
  $("#loginView").classList.remove("hidden");
  $("#dashboardView").classList.add("hidden");
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearStatus();

  if (!isConfigured()) return;

  const email = $("#adminEmail").value.trim();
  const password = $("#adminPassword").value.trim();
  const button = e.submitter;
  button.disabled = true;
  button.textContent = "جاري الدخول...";

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  button.disabled = false;
  button.textContent = "دخول لوحة الإدارة";

  if (error) {
    setStatus("بيانات الدخول غير صحيحة أو لم يتم إنشاء المستخدم في Supabase Auth.", "error");
    return;
  }

  showDashboard();
  await refreshDashboard();
  setStatus("تم تسجيل الدخول بنجاح.");
});

$("#logoutBtn").addEventListener("click", async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  showLogin();
  clearStatus();
});

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("id, name, price, category, description, image")
    .order("created_at", { ascending: false });

  if (error) throw error;
  productsCache = (data || []).map((item) => ({ ...item, price: Number(item.price || 0) }));
}

async function loadOrders() {
  const { data, error } = await supabaseClient
    .from("orders")
    .select("id, customer_name, customer_phone, customer_address, customer_notes, payment_method, status, created_at, total, items")
    .order("created_at", { ascending: false });

  if (error) throw error;
  ordersCache = (data || []).map((item) => ({ ...item, total: Number(item.total || 0) }));
}

async function refreshDashboard() {
  if (!isConfigured()) return;
  try {
    await Promise.all([loadProducts(), loadOrders()]);
    renderStats();
    renderProducts();
    renderOrders();
  } catch (error) {
    console.error(error);
    setStatus("تعذر تحميل البيانات من Supabase. تأكد من تنفيذ ملف SQL وسياسات الصلاحيات.", "error");
  }
}

function renderStats() {
  $("#productsCount").textContent = productsCache.length.toLocaleString("ar-EG");
  $("#ordersCount").textContent = ordersCache.length.toLocaleString("ar-EG");
  $("#newOrdersCount").textContent = ordersCache.filter(o => o.status === "جديد").length.toLocaleString("ar-EG");
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

$("#productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearStatus();

  if (!isConfigured()) return;

  const id = $("#productId").value;
  const payload = {
    name: $("#nameInput").value.trim(),
    price: Number($("#priceInput").value),
    category: $("#categoryInput").value,
    description: $("#descriptionInput").value.trim(),
    image: $("#imageInput").value.trim()
  };

  const button = e.submitter;
  button.disabled = true;
  button.textContent = "جاري الحفظ...";

  const query = id
    ? supabaseClient.from("products").update(payload).eq("id", id)
    : supabaseClient.from("products").insert(payload);

  const { error } = await query;

  button.disabled = false;
  button.textContent = "حفظ التعديلات";

  if (error) {
    console.error(error);
    setStatus("فشل حفظ المنتج. تأكد من صلاحيات المنتجات في Supabase.", "error");
    return;
  }

  resetForm();
  await refreshDashboard();
  setStatus("تم حفظ التعديلات بنجاح، والمنتج أصبح ظاهرًا لكل الناس.");
});

$("#resetFormBtn").addEventListener("click", resetForm);

function renderProducts() {
  const list = $("#adminProductsList");

  if (!productsCache.length) {
    list.innerHTML = `<div class="empty">لا توجد منتجات.</div>`;
    return;
  }

  list.innerHTML = productsCache.map((p) => `
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
  const p = productsCache.find((item) => item.id === id);
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

async function deleteProduct(id) {
  if (!confirm("هل تريد حذف هذا المنتج؟")) return;
  clearStatus();

  const { error } = await supabaseClient.from("products").delete().eq("id", id);
  if (error) {
    console.error(error);
    setStatus("فشل حذف المنتج.", "error");
    return;
  }

  await refreshDashboard();
  setStatus("تم حذف المنتج بنجاح، واختفى من المتجر عند كل الزوار.");
}

function renderOrders() {
  const list = $("#ordersList");

  if (!ordersCache.length) {
    list.innerHTML = `<div class="empty">لا توجد طلبات حتى الآن.</div>`;
    return;
  }

  list.innerHTML = ordersCache.map((order) => `
    <div class="order-card">
      <div class="row-between">
        <h4>${order.id}</h4>
        <span class="badge ${order.status === "تم التواصل" ? "done" : ""}">${order.status}</span>
      </div>

      <div class="order-meta">
        <span>العميل: ${order.customer_name}</span>
        <span>الهاتف: ${order.customer_phone}</span>
        <span>العنوان: ${order.customer_address}</span>
        <span>الدفع: ${order.payment_method}</span>
        <span>الوقت: ${new Date(order.created_at).toLocaleString("ar-EG")}</span>
        <span>الإجمالي: ${formatPrice(order.total)}</span>
        <span>ملاحظات: ${order.customer_notes || "لا يوجد"}</span>
      </div>

      <div class="order-items">
        ${(order.items || []).map((item) => `<span>${item.name} × ${item.qty} — ${formatPrice(item.price * item.qty)}</span>`).join("")}
      </div>

      <div class="order-actions">
        <button class="btn btn-primary" onclick="markOrderDone('${order.id}')">تم التواصل</button>
        <button class="btn btn-danger" onclick="deleteOrder('${order.id}')">حذف الطلب</button>
      </div>
    </div>
  `).join("");
}

async function markOrderDone(id) {
  const { error } = await supabaseClient.from("orders").update({ status: "تم التواصل" }).eq("id", id);
  if (error) {
    console.error(error);
    setStatus("فشل تحديث حالة الطلب.", "error");
    return;
  }
  await refreshDashboard();
  setStatus("تم تحديث حالة الطلب.");
}

async function deleteOrder(id) {
  if (!confirm("هل تريد حذف هذا الطلب؟")) return;
  const { error } = await supabaseClient.from("orders").delete().eq("id", id);
  if (error) {
    console.error(error);
    setStatus("فشل حذف الطلب.", "error");
    return;
  }
  await refreshDashboard();
  setStatus("تم حذف الطلب بنجاح.");
}

$("#clearOrdersBtn").addEventListener("click", async () => {
  if (!confirm("سيتم حذف كل الطلبات. هل أنت متأكد؟")) return;
  const ids = ordersCache.map((order) => order.id);
  if (!ids.length) return;
  const { error } = await supabaseClient.from("orders").delete().in("id", ids);
  if (error) {
    console.error(error);
    setStatus("فشل حذف كل الطلبات.", "error");
    return;
  }
  await refreshDashboard();
  setStatus("تم حذف كل الطلبات.");
});

requireAuth();

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.markOrderDone = markOrderDone;
window.deleteOrder = deleteOrder;
