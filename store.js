const STORAGE_KEYS = {
  cart: "stitch_store_cart_v5"
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

let productsCache = [...defaultProducts];

function getCart() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
}
function saveCart(cart) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}
function formatPrice(value) {
  return `${Number(value).toLocaleString("ar-EG")} جنيه`;
}
function syncCartWithProducts() {
  const cart = getCart().filter((item) => productsCache.some((p) => p.id === item.id));
  saveCart(cart);
}
function normalizeProduct(product) {
  return {
    ...product,
    price: Number(product.price || 0)
  };
}

async function loadProducts() {
  if (!supabaseClient) {
    productsCache = [...defaultProducts];
    renderProducts();
    renderCart();
    return;
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select("id, name, price, category, description, image")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    productsCache = [...defaultProducts];
    showStoreNotice("تعذر تحميل المنتجات من قاعدة البيانات. يتم عرض النسخة التجريبية مؤقتًا.", true);
  } else {
    productsCache = (data || []).map(normalizeProduct);
  }

  syncCartWithProducts();
  renderProducts();
  renderCart();
}

function showStoreNotice(message, isError = false) {
  const notice = $("#storeNotice");
  if (!notice) return;
  notice.textContent = message;
  notice.className = `store-notice${isError ? " error" : ""}`;
  notice.hidden = false;
}

const productsGrid = $("#productsGrid");
const searchInput = $("#searchInput");
const categoryFilter = $("#categoryFilter");

function renderProducts() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const products = productsCache.filter((p) => {
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
  const product = productsCache.find((p) => p.id === id);
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

$("#checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!supabaseClient) {
    alert("أكمل ربط Supabase أولًا ثم أعد رفع الموقع.");
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    alert("السلة فارغة.");
    return;
  }

  const submitBtn = e.submitter;
  submitBtn.disabled = true;
  submitBtn.textContent = "جاري إرسال الطلب...";

  const order = {
    id: "ORD-" + Date.now(),
    customer_name: $("#customerName").value.trim(),
    customer_phone: $("#customerPhone").value.trim(),
    customer_address: $("#customerAddress").value.trim(),
    customer_notes: $("#customerNotes").value.trim(),
    payment_method: "الدفع عند الاستلام",
    status: "جديد",
    items: cart,
    total: cart.reduce((sum, item) => sum + (item.qty * item.price), 0)
  };

  const { error } = await supabaseClient.from("orders").insert(order);

  submitBtn.disabled = false;
  submitBtn.textContent = "تأكيد الطلب الآن";

  if (error) {
    console.error(error);
    alert("حدث خطأ أثناء تسجيل الطلب. تأكد من إعداد Supabase ثم حاول مرة أخرى.");
    return;
  }

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

loadProducts();
renderCart();

window.addToCart = addToCart;
window.updateQty = updateQty;
window.removeFromCart = removeFromCart;
