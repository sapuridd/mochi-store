/* =========================================================================
   MOCHI.ADMIN // Backoffice Dashboard & Inventory Control - Script (admin/js/admin-dashboard.js)
   ========================================================================= */

// =========================================================================
// 1. KONFIGURASI DATABASE BERSAMA (TERHUBUNG KE WEBSITE PENJUALAN)
// =========================================================================
const STORAGE_KEY_PRODUCTS = 'MOCHI_SHARED_PRODUCTS_V3';
const STORAGE_KEY_LOGS = 'MOCHI_SHARED_SYNCLOGS_V1';
const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('mochi_store_sync_channel') : null;

const defaultProducts = [
    {
        id: 'mochi-white',
        name: 'Ganci Mochi OLED - Classic White',
        category: 'standard',
        price: 189000,
        oldPrice: 229000,
        badge: 'TERLARIS',
        badgeColor: 'bg-cyan-400 text-slate-900',
        casingColor: '#f8fafc',
        borderColor: '#cbd5e1',
        oledAccent: '#00f0ff',
        defaultExp: 'normal',
        specs: ['Layar OLED 0.96" Tajam + Wi-Fi Bawaan', '6 Mini-Games (Flappy, Dino, Pong, Snake+)', 'Jam Meja Otomatis, Pomodoro & Stopwatch', '100+ Quotes + Efek Suara & Kabel Type-C'],
        stock: 24
    },
    {
        id: 'mochi-black',
        name: 'Ganci Mochi OLED - Stealth Black',
        category: 'standard',
        price: 189000,
        oldPrice: 229000,
        badge: 'FAVORIT',
        badgeColor: 'bg-slate-900 text-cyan-400',
        casingColor: '#1e293b',
        borderColor: '#0f172a',
        oledAccent: '#00f0ff',
        defaultExp: 'happy',
        specs: ['Casing Matte Stealth Black Elegan', '6 Mini-Games Retro + High Score Tersimpan', 'Jam Meja Wi-Fi Otomatis + Pomodoro Timer', '100+ Quotes Motivasi + Mode Silent'],
        stock: 19
    },
    {
        id: 'mochi-red',
        name: 'Ganci Mochi OLED - Mecha Red RX',
        category: 'special',
        price: 215000,
        oldPrice: 259000,
        badge: 'SPECIAL EDITION',
        badgeColor: 'bg-rose-500 text-white',
        casingColor: '#e11d48',
        borderColor: '#881337',
        oledAccent: '#ff2a6d',
        defaultExp: 'angry',
        specs: ['Edisi Mecha Red RX + Animasi Eksklusif', 'Layar OLED 0.96" Tajam + Efek Suara Buzzer', '6 Mini-Games + Jam Meja + Pomodoro', 'Bonus Carabiner Metal + Kabel USB Type-C'],
        stock: 8
    },
    {
        id: 'mochi-clear',
        name: 'Ganci Mochi OLED - Cyber Transparent',
        category: 'special',
        price: 225000,
        oldPrice: 269000,
        badge: 'LIMITED',
        badgeColor: 'bg-amber-400 text-slate-900',
        casingColor: '#e2e8f0',
        borderColor: '#64748b',
        oledAccent: '#05ffa1',
        defaultExp: 'dizzy',
        specs: ['Casing Transparan Estetik Edisi Terbatas', 'Layar OLED 0.96" Responsif + Suara Chiptune', '6 Mini-Games, Jam Meja, Pomodoro & Stopwatch', 'Bonus Kabel Type-C Braided + Stand Meja'],
        stock: 4
    },
    {
        id: 'mochi-sakura',
        name: 'Ganci Mochi OLED - Sakura Pink',
        category: 'standard',
        price: 195000,
        oldPrice: 235000,
        badge: 'CUTE EDITION',
        badgeColor: 'bg-pink-300 text-slate-900',
        casingColor: '#fbcfe8',
        borderColor: '#f472b6',
        oledAccent: '#ff2a6d',
        defaultExp: 'love',
        specs: ['Casing Pastel Sakura Pink Cantik', 'Animasi Mata Kawaii/Love + Efek Suara Imut', 'Pomodoro Timer Belajar & Jam Meja Otomatis', 'Bonus Strap Tas Silikon + Ring Ganci'],
        stock: 14
    },
    {
        id: 'mochi-atomic',
        name: 'Ganci Mochi OLED - Atomic Purple',
        category: 'special',
        price: 219000,
        oldPrice: 259000,
        badge: 'RETRO 90s',
        badgeColor: 'bg-purple-600 text-white',
        casingColor: '#7e22ce',
        borderColor: '#4c1d95',
        oledAccent: '#00f0ff',
        defaultExp: 'sleep',
        specs: ['Warna Retro GameBoy 90-an Transparan', '6 Game Klasik (Stacker 12/12, Breakout, Pong+)', 'Efek Suara Retro 8-Bit (Bisa Mode Silent)', 'Bonus Ring Ganci + Dudukan Meja Kerja'],
        stock: 11
    }
];

let products = [];
let syncLogs = [];
let simCart = [];

function loadDatabase() {
    try {
        const savedProds = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (savedProds) {
            products = JSON.parse(savedProds);
        } else {
            products = JSON.parse(JSON.stringify(defaultProducts));
            localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
        }

        const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
        if (savedLogs) {
            syncLogs = JSON.parse(savedLogs);
        } else {
            syncLogs = [
                { time: getTimeStr(), msg: 'Sistem Admin terhubung ke database Website Penjualan (MOCHI_STORE_DB_V1).', type: 'info' }
            ];
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(syncLogs));
        }
    } catch (e) {
        products = JSON.parse(JSON.stringify(defaultProducts));
    }
}

function saveAndSyncDatabase(logMessage, logType = 'sync') {
    try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
        if (logMessage) {
            syncLogs.unshift({ time: getTimeStr(), msg: logMessage, type: logType });
            if (syncLogs.length > 30) syncLogs.pop();
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(syncLogs));
        }
        if (window.MochiCloud) {
            window.MochiCloud.pushCollection(STORAGE_KEY_PRODUCTS, products);
            if (logMessage) window.MochiCloud.pushCollection(STORAGE_KEY_LOGS, syncLogs);
        }
        if (syncChannel) {
            syncChannel.postMessage({ type: 'DB_UPDATED', timestamp: Date.now() });
        }
    } catch (e) {
        console.error('Gagal menyimpan ke localStorage:', e);
    }

    document.getElementById('last-sync-time').textContent = 'Sinkronisasi Terakhir: ' + getTimeStr() + ' WIB';
    renderAll();
}

function getTimeStr() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

function formatRupiah(num) {
    return 'Rp ' + Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// =========================================================================
// 2. GENERATOR SVG EKSPRESI MATA OLED
// =========================================================================
function getOledFaceSVG(type) {
    switch (type) {
        case 'happy':
            return `<svg viewBox="0 0 120 60" class="w-24 h-12 oled-glow"><path d="M 18 36 Q 32 14 46 36" fill="none" stroke="#00f0ff" stroke-width="7" stroke-linecap="round"/><path d="M 74 36 Q 88 14 102 36" fill="none" stroke="#00f0ff" stroke-width="7" stroke-linecap="round"/><rect x="12" y="42" width="10" height="4" rx="2" fill="#ff2a6d"/><rect x="98" y="42" width="10" height="4" rx="2" fill="#ff2a6d"/><path d="M 54 40 Q 60 47 66 40" fill="none" stroke="#00f0ff" stroke-width="4" stroke-linecap="round"/></svg>`;
        case 'angry':
            return `<svg viewBox="0 0 120 60" class="w-24 h-12 oled-glow-red"><line x1="16" y1="14" x2="48" y2="24" stroke="#ff2a6d" stroke-width="6" stroke-linecap="round"/><line x1="104" y1="14" x2="72" y2="24" stroke="#ff2a6d" stroke-width="6" stroke-linecap="round"/><path d="M 18 26 H 46 V 38 Q 32 42 18 38 Z" fill="#ff2a6d"/><path d="M 74 26 H 102 V 38 Q 88 42 74 38 Z" fill="#ff2a6d"/></svg>`;
        case 'dizzy':
            return `<svg viewBox="0 0 120 60" class="w-24 h-12 oled-glow-green"><line x1="20" y1="18" x2="44" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/><line x1="44" y1="18" x2="20" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/><line x1="76" y1="18" x2="100" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/><line x1="100" y1="18" x2="76" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/><path d="M 48 48 Q 54 42 60 48 T 72 48" fill="none" stroke="#05ffa1" stroke-width="4" stroke-linecap="round"/></svg>`;
        case 'love':
            return `<svg viewBox="0 0 120 60" class="w-24 h-12 oled-glow-red"><path d="M32 44 L18 30 A8 8 0 0 1 32 20 A8 8 0 0 1 46 30 Z" fill="#ff2a6d"/><path d="M88 44 L74 30 A8 8 0 0 1 88 20 A8 8 0 0 1 102 30 Z" fill="#ff2a6d"/></svg>`;
        case 'sleep':
            return `<svg viewBox="0 0 120 60" class="w-24 h-12 oled-glow"><path d="M 18 32 Q 32 42 46 32" fill="none" stroke="#00f0ff" stroke-width="6" stroke-linecap="round"/><path d="M 74 32 Q 88 42 102 32" fill="none" stroke="#00f0ff" stroke-width="6" stroke-linecap="round"/><text x="88" y="20" fill="#00f0ff" font-family="monospace" font-weight="bold" font-size="14">Zzz</text></svg>`;
        default:
            return `<svg viewBox="0 0 120 60" class="w-24 h-12 oled-glow"><rect x="20" y="14" width="24" height="32" rx="10" fill="#00f0ff"/><rect x="76" y="14" width="24" height="32" rx="10" fill="#00f0ff"/><circle cx="27" cy="22" r="3.5" fill="#050505"/><circle cx="83" cy="22" r="3.5" fill="#050505"/></svg>`;
    }
}

// =========================================================================
// 3. MANAJEMEN STOK CEPAT (TAMBAH / KURANGI STOK BARANG)
// =========================================================================
function adjustStock(productId, delta) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const oldStock = prod.stock;
    const newStock = Math.max(0, oldStock + delta);
    prod.stock = newStock;

    const actionWord = delta > 0 ? `ditambah (+${delta})` : `dikurangi (${delta})`;
    saveAndSyncDatabase(
        `Stok "${prod.name}" ${actionWord} dari ${oldStock} -> ${newStock} unit. Tersinkronisasi ke Storefront.`,
        delta > 0 ? 'add' : 'sub'
    );
    showToast(`Stok ${prod.name}: ${newStock} unit`);
}

function setDirectStock(productId, inputValue) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const parsed = Math.max(0, parseInt(inputValue, 10) || 0);
    const oldStock = prod.stock;
    prod.stock = parsed;

    saveAndSyncDatabase(
        `Stok "${prod.name}" diatur manual dari ${oldStock} -> ${parsed} unit.`,
        'sync'
    );
    showToast(`Stok "${prod.name}" disimpan: ${parsed} unit`);
}

function getStockBadgeHTML(stock) {
    if (stock <= 0) {
        return `<span class="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-rose-100 text-rose-800 border border-rose-800">HABIS (0)</span>`;
    }
    if (stock <= 5) {
        return `<span class="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-amber-100 text-amber-900 border border-amber-800">MENIPIS (${stock})</span>`;
    }
    return `<span class="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-emerald-100 text-emerald-900 border border-emerald-800">TERSEDIA (${stock})</span>`;
}

// =========================================================================
// 4. TAMBAH PRODUK TERBARU & EDIT / HAPUS PRODUK
// =========================================================================
function setPresetColor(hex) {
    document.getElementById('prod-color').value = hex;
    updateNewProductPreview();
}

function updateNewProductPreview() {
    const name = document.getElementById('prod-name').value.trim() || 'Ganci Mochi OLED Baru';
    const price = parseInt(document.getElementById('prod-price').value, 10) || 0;
    const stock = parseInt(document.getElementById('prod-stock').value, 10) || 0;
    const badge = document.getElementById('prod-badge').value.trim() || 'NEW';
    const exp = document.getElementById('prod-exp').value;
    const color = document.getElementById('prod-color').value;

    document.getElementById('preview-new-title').textContent = name;
    document.getElementById('preview-new-price').textContent = formatRupiah(price);
    document.getElementById('preview-new-badge').textContent = badge;
    document.getElementById('preview-new-stock').textContent = `Stok: ${stock}`;
    document.getElementById('preview-new-casing').style.backgroundColor = color;
    document.getElementById('preview-new-oled').innerHTML = getOledFaceSVG(exp);
}

function handleSaveProduct(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-product-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const price = Math.max(0, parseInt(document.getElementById('prod-price').value, 10) || 189000);
    const oldPrice = Math.max(price, parseInt(document.getElementById('prod-old-price').value, 10) || (price + 35000));
    const stock = Math.max(0, parseInt(document.getElementById('prod-stock').value, 10) || 0);
    const category = document.getElementById('prod-category').value;
    const badge = (document.getElementById('prod-badge').value.trim() || 'NEW RELEASE').toUpperCase();
    const defaultExp = document.getElementById('prod-exp').value;
    const casingColor = document.getElementById('prod-color').value;
    const specsRaw = document.getElementById('prod-specs').value;
    const specs = specsRaw.split(',').map(s => s.trim()).filter(Boolean);

    if (editId) {
        // Mode Edit Produk
        const idx = products.findIndex(p => p.id === editId);
        if (idx !== -1) {
            products[idx] = {
                ...products[idx],
                name,
                price,
                oldPrice,
                stock,
                category,
                badge,
                defaultExp,
                casingColor,
                specs: specs.length ? specs : products[idx].specs
            };
            saveAndSyncDatabase(`Detail produk "${name}" diperbarui oleh Admin -> Tersinkronisasi ke Storefront.`, 'info');
            showToast(`Produk "${name}" berhasil diperbarui!`);
        }
        cancelEditMode();
    } else {
        // Mode Tambah Produk Baru
        const newId = 'mochi-custom-' + Date.now().toString().slice(-4);
        const newProduct = {
            id: newId,
            name,
            category,
            price,
            oldPrice,
            badge,
            badgeColor: 'bg-amber-400 text-slate-900',
            casingColor,
            borderColor: '#0f172a',
            oledAccent: '#00f0ff',
            defaultExp,
            specs: specs.length ? specs : ['Layar OLED 0.96"', 'Baterai 24 Jam Type-C', '35+ Animasi Ekspresi'],
            stock
        };

        products.unshift(newProduct);
        saveAndSyncDatabase(`Produk baru "${name}" (Stok: ${stock}) ditambahkan & dipublikasikan ke Storefront!`, 'add');
        showToast(`Produk baru "${name}" berhasil ditambahkan ke Storefront!`);

        // Reset ke preset berikutnya agar mudah tambah lagi
        document.getElementById('prod-name').value = 'Ganci Mochi OLED - Cyber Gold';
        document.getElementById('prod-color').value = '#facc15';
        document.getElementById('prod-stock').value = '12';
        updateNewProductPreview();
    }
}

function startEditProduct(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    document.getElementById('edit-product-id').value = prod.id;
    document.getElementById('prod-name').value = prod.name;
    document.getElementById('prod-price').value = prod.price;
    document.getElementById('prod-old-price').value = prod.oldPrice || (prod.price + 30000);
    document.getElementById('prod-stock').value = prod.stock;
    document.getElementById('prod-category').value = prod.category;
    document.getElementById('prod-badge').value = prod.badge;
    document.getElementById('prod-exp').value = prod.defaultExp;
    document.getElementById('prod-color').value = prod.casingColor;
    document.getElementById('prod-specs').value = (prod.specs || []).join(', ');

    document.getElementById('form-panel-title').textContent = 'Edit Produk: ' + prod.name;
    document.getElementById('btn-submit-text').textContent = 'Simpan Perubahan Produk';
    document.getElementById('btn-cancel-edit').classList.remove('hidden');

    updateNewProductPreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEditMode() {
    document.getElementById('edit-product-id').value = '';
    document.getElementById('form-panel-title').textContent = 'Tambah Produk Ganci Terbaru';
    document.getElementById('btn-submit-text').textContent = 'Publikasikan Produk ke Storefront';
    document.getElementById('btn-cancel-edit').classList.add('hidden');

    document.getElementById('prod-name').value = 'Ganci Mochi OLED - Neon Green';
    document.getElementById('prod-price').value = '210000';
    document.getElementById('prod-stock').value = '15';
    document.getElementById('prod-color').value = '#10b981';
    updateNewProductPreview();
}

function deleteProduct(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    products = products.filter(p => p.id !== productId);
    saveAndSyncDatabase(`Varian "${prod.name}" dihapus dari katalog Storefront.`, 'sub');
    showToast(`Produk "${prod.name}" dihapus.`);
}

function resetToDefaultDB() {
    products = JSON.parse(JSON.stringify(defaultProducts));
    saveAndSyncDatabase('Database di-reset ke 6 produk bawaan (Default).', 'info');
    showToast('Data inventaris berhasil di-reset ke awal!');
}

// =========================================================================
// 5. RENDER UI ADMIN PANEL & KPI
// =========================================================================
function renderKPIs() {
    const totalSku = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowOrOut = products.filter(p => p.stock <= 5).length;
    const totalVal = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    document.getElementById('kpi-total-sku').textContent = `${totalSku} SKU`;
    document.getElementById('kpi-total-stock').textContent = `${totalStock} Unit`;
    document.getElementById('kpi-low-stock').textContent = `${lowOrOut} Varian`;
    document.getElementById('kpi-inventory-value').textContent = formatRupiah(totalVal);
}

function renderAdminInventory() {
    const listEl = document.getElementById('admin-inventory-list');
    const filterVal = document.getElementById('admin-stock-filter').value;

    const filtered = products.filter(p => {
        if (filterVal === 'available') return p.stock > 5;
        if (filterVal === 'low') return p.stock >= 1 && p.stock <= 5;
        if (filterVal === 'out') return p.stock <= 0;
        return true;
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="p-8 text-center border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500">
                Tidak ada produk dengan filter stok tersebut.
            </div>
        `;
        return;
    }

    listEl.innerHTML = filtered.map(prod => `
        <div class="p-4 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <!-- Info Kiri: Mini Visual OLED & Nama Produk -->
            <div class="flex items-center gap-3.5">
                <div style="background-color: ${prod.casingColor};" class="w-16 h-14 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center p-1.5 shrink-0">
                    <div class="oled-screen w-full h-full rounded-lg flex items-center justify-center">
                        <div class="scale-50">${getOledFaceSVG(prod.defaultExp)}</div>
                    </div>
                </div>
                <div>
                    <div class="flex flex-wrap items-center gap-1.5 mb-0.5">
                        ${getStockBadgeHTML(prod.stock)}
                        <span class="font-mono-tech text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-400 rounded">${prod.badge}</span>
                    </div>
                    <h4 class="font-extrabold text-sm sm:text-base text-slate-900">${prod.name}</h4>
                    <div class="flex items-center gap-3 text-xs font-mono-tech text-slate-600">
                        <span class="font-bold text-slate-900">${formatRupiah(prod.price)}</span>
                        <span>•</span>
                        <span>OLED: ${prod.defaultExp.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <!-- Kontrol Kanan: Tombol Tambah / Kurangi Stok Cepat + Edit/Hapus -->
            <div class="flex flex-wrap sm:flex-nowrap items-center justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                <div class="flex items-center gap-1">
                    <button onclick="adjustStock('${prod.id}', -5)" title="Kurangi 5" class="wf-btn px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-mono-tech font-bold text-xs">-5</button>
                    <button onclick="adjustStock('${prod.id}', -1)" title="Kurangi 1" class="wf-btn px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-mono-tech font-bold text-xs">-1</button>

                    <input type="number" min="0" value="${prod.stock}" onchange="setDirectStock('${prod.id}', this.value)" class="w-14 text-center py-1.5 rounded-lg border-2 border-slate-900 font-mono-tech font-extrabold text-sm bg-white" title="Ketik Stok Langsung">

                    <button onclick="adjustStock('${prod.id}', 1)" title="Tambah 1" class="wf-btn px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-mono-tech font-bold text-xs">+1</button>
                    <button onclick="adjustStock('${prod.id}', 5)" title="Tambah 5" class="wf-btn px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono-tech font-bold text-xs">+5</button>
                    <button onclick="adjustStock('${prod.id}', 10)" title="Tambah 10" class="wf-btn px-2 py-1.5 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-900 font-mono-tech font-bold text-xs">+10</button>
                </div>

                <!-- Aksi Edit & Hapus -->
                <div class="flex items-center gap-1 ml-1">
                    <button onclick="startEditProduct('${prod.id}')" title="Edit Detail Produk" class="p-2 rounded-lg border border-slate-300 hover:border-slate-900 bg-white text-slate-700">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="deleteProduct('${prod.id}')" title="Hapus Produk" class="p-2 rounded-lg border border-slate-300 hover:border-rose-600 bg-white text-rose-600">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function renderSyncLogs() {
    const container = document.getElementById('sync-log-container');
    container.innerHTML = syncLogs.map(item => {
        let badgeColor = 'text-cyan-400';
        if (item.type === 'add') badgeColor = 'text-emerald-400';
        if (item.type === 'sub') badgeColor = 'text-rose-400';
        return `
            <div class="flex items-start gap-2 border-b border-slate-800 pb-1.5">
                <span class="text-slate-500 shrink-0">[${item.time}]</span>
                <span class="${badgeColor} font-bold">●</span>
                <span>${item.msg}</span>
            </div>
        `;
    }).join('');
}

function clearSyncLogs() {
    syncLogs = [{ time: getTimeStr(), msg: 'Log dibersihkan oleh Admin.', type: 'info' }];
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(syncLogs));
    renderSyncLogs();
}

// =========================================================================
// 6. SIMULASI STOREFRONT & MANAJEMEN DATABASE PEMBELI (MOCHI_USERS_DB_V1)
// =========================================================================
const STORAGE_KEY_USERS = 'MOCHI_USERS_DB_V1';
const defaultBuyersDB = [
    {
        id: 'usr-001',
        name: 'Budi Santoso',
        email: 'budi@pembeli.com',
        wa: '081234567890',
        address: 'Jl. Sudirman No. 45, Kec. Kebayoran Baru, Jakarta Selatan 12190 (Pagar Hitam)',
        password: 'pembeli123',
        createdAt: '2026-11-01 09:30:00',
        lastLogin: '2026-11-02 19:15:00'
    },
    {
        id: 'usr-002',
        name: 'Siti Rahmawati',
        email: 'siti@pembeli.com',
        wa: '085712349876',
        address: 'Jl. Dago Asri No. 18, Kec. Coblong, Kota Bandung 40135',
        password: 'pembeli123',
        createdAt: '2026-11-01 14:20:00',
        lastLogin: '2026-11-02 20:05:00'
    }
];

function getBuyersDatabase() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_USERS);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultBuyersDB));
        return JSON.parse(JSON.stringify(defaultBuyersDB));
    } catch (e) {
        return JSON.parse(JSON.stringify(defaultBuyersDB));
    }
}

function saveBuyersDatabase(buyersList, logMessage, logType = 'info') {
    try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(buyersList));
        if (logMessage) {
            syncLogs.unshift({ time: getTimeStr(), msg: logMessage, type: logType });
            if (syncLogs.length > 30) syncLogs.pop();
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(syncLogs));
        }
        if (window.MochiCloud) {
            window.MochiCloud.pushCollection(STORAGE_KEY_USERS, buyersList);
            if (logMessage) window.MochiCloud.pushCollection(STORAGE_KEY_LOGS, syncLogs);
        }
        if (syncChannel) {
            syncChannel.postMessage({ type: 'USERS_DB_UPDATED', timestamp: Date.now() });
        }
    } catch (e) {}
    renderBuyersDatabaseTable();
    renderSyncLogs();
}

function renderBuyersDatabaseTable() {
    const buyers = getBuyersDatabase();
    const navBadge = document.getElementById('nav-buyers-count');
    const totalLabel = document.getElementById('buyer-table-total');
    const tbody = document.getElementById('admin-buyers-tbody');
    const searchInput = document.getElementById('search-buyer-input');

    if (navBadge) navBadge.textContent = buyers.length;
    if (totalLabel) totalLabel.textContent = buyers.length;
    if (!tbody) return;

    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const filtered = buyers.filter(u =>
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.wa && u.wa.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400 font-mono-tech">Tidak ada akun pembeli yang cocok dengan pencarian.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(u => `
        <tr class="hover:bg-slate-50 transition">
            <td class="py-3 px-3 align-top">
                <span class="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono-tech text-[10px] font-bold">${u.id}</span>
                <div class="font-extrabold text-slate-900 text-xs mt-1">${u.name}</div>
            </td>
            <td class="py-3 px-3 align-top font-mono-tech">
                <div class="text-cyan-700 font-bold">${u.email}</div>
                <div class="text-slate-600 text-[11px]">WA: ${u.wa || '-'}</div>
                <div class="text-slate-500 text-[10px] mt-0.5">Pass: <span class="px-1 bg-slate-100 border border-slate-300 rounded text-slate-800">${u.password}</span></div>
            </td>
            <td class="py-3 px-3 align-top max-w-[220px]">
                <p class="text-slate-600 text-xs leading-snug">${u.address || '-'}</p>
            </td>
            <td class="py-3 px-3 align-top font-mono-tech text-[10px] text-slate-500">
                <div>Daftar: <span class="text-slate-800">${u.createdAt || '-'}</span></div>
                <div class="mt-0.5">Login: <span class="text-emerald-700 font-bold">${u.lastLogin || 'Belum pernah'}</span></div>
            </td>
            <td class="py-3 px-3 align-top text-right">
                <div class="inline-flex items-center gap-1">
                    <button onclick="startEditBuyer('${u.id}')" title="Edit Akun Pembeli" class="p-1.5 rounded-lg border border-slate-300 hover:border-slate-900 bg-white text-slate-700">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="deleteBuyerFromDB('${u.id}')" title="Hapus Akun Pembeli" class="p-1.5 rounded-lg border border-slate-300 hover:border-rose-600 bg-white text-rose-600">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    lucide.createIcons();
}

function handleAdminSaveBuyer(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-buyer-id').value;
    const name = document.getElementById('adm-buyer-name').value.trim();
    const email = document.getElementById('adm-buyer-email').value.trim().toLowerCase();
    const wa = document.getElementById('adm-buyer-wa').value.trim();
    const password = document.getElementById('adm-buyer-password').value;
    const address = document.getElementById('adm-buyer-address').value.trim();

    const buyers = getBuyersDatabase();
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (editId) {
        const idx = buyers.findIndex(b => b.id === editId);
        if (idx !== -1) {
            buyers[idx] = { ...buyers[idx], name, email, wa, password, address };
            saveBuyersDatabase(buyers, `Data akun pembeli "${name}" (${email}) diperbarui oleh Admin.`, 'info');
            showToast(`Akun pembeli "${name}" berhasil diperbarui!`);
        }
        cancelBuyerEdit();
    } else {
        if (buyers.some(b => b.email.toLowerCase() === email)) {
            showToast('Email pembeli tersebut sudah terdaftar di database!');
            return;
        }
        const newBuyer = {
            id: 'usr-' + String(buyers.length + 1).padStart(3, '0') + '-' + Date.now().toString().slice(-2),
            name,
            email,
            wa,
            address,
            password,
            createdAt: nowStr,
            lastLogin: '-'
        };
        buyers.push(newBuyer);
        saveBuyersDatabase(buyers, `Akun pembeli baru "${name}" (${email}) ditambahkan ke Database oleh Admin.`, 'add');
        showToast(`Akun pembeli "${name}" ditambahkan ke database!`);
        document.getElementById('form-admin-buyer').reset();
        document.getElementById('adm-buyer-password').value = 'pembeli123';
    }
}

function startEditBuyer(buyerId) {
    const buyers = getBuyersDatabase();
    const target = buyers.find(b => b.id === buyerId);
    if (!target) return;

    document.getElementById('edit-buyer-id').value = target.id;
    document.getElementById('adm-buyer-name').value = target.name;
    document.getElementById('adm-buyer-email').value = target.email;
    document.getElementById('adm-buyer-wa').value = target.wa || '';
    document.getElementById('adm-buyer-password').value = target.password || '';
    document.getElementById('adm-buyer-address').value = target.address || '';

    document.getElementById('buyer-form-title').textContent = 'Edit Akun: ' + target.name;
    document.getElementById('btn-save-buyer-text').textContent = 'Update Akun Pembeli';
    document.getElementById('btn-cancel-buyer-edit').classList.remove('hidden');
}

function cancelBuyerEdit() {
    document.getElementById('edit-buyer-id').value = '';
    document.getElementById('form-admin-buyer').reset();
    document.getElementById('adm-buyer-password').value = 'pembeli123';
    document.getElementById('buyer-form-title').textContent = 'Tambah Akun Pembeli Baru';
    document.getElementById('btn-save-buyer-text').textContent = 'Simpan ke Database Pembeli';
    document.getElementById('btn-cancel-buyer-edit').classList.add('hidden');
}

function deleteBuyerFromDB(buyerId) {
    let buyers = getBuyersDatabase();
    const target = buyers.find(b => b.id === buyerId);
    if (!target) return;
    buyers = buyers.filter(b => b.id !== buyerId);
    saveBuyersDatabase(buyers, `Akun pembeli "${target.name}" (${target.email}) dihapus dari Database.`, 'sub');
    showToast(`Akun "${target.name}" telah dihapus.`);
}

function exportBuyersJSON() {
    const buyers = getBuyersDatabase();
    const blob = new Blob([JSON.stringify(buyers, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database_akun_pembeli_mochi.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('File JSON Database Pembeli berhasil diunduh!');
}

function exportBuyersSQL() {
    const buyers = getBuyersDatabase();
    const esc = (s) => String(s || '').replace(/'/g, "''");
    let sql = `-- DATABASE AKUN PEMBELI MOCHI.OLED\nCREATE TABLE IF NOT EXISTS pembeli (\n  id_pembeli VARCHAR(20) PRIMARY KEY,\n  nama_lengkap VARCHAR(100) NOT NULL,\n  email VARCHAR(120) NOT NULL UNIQUE,\n  no_whatsapp VARCHAR(25) NOT NULL,\n  alamat_pengiriman TEXT,\n  password_hash VARCHAR(255) NOT NULL,\n  created_at DATETIME,\n  last_login DATETIME\n);\n\n`;
    buyers.forEach(u => {
        sql += `INSERT INTO pembeli VALUES ('${esc(u.id)}', '${esc(u.name)}', '${esc(u.email)}', '${esc(u.wa)}', '${esc(u.address)}', '${esc(u.password)}', '${esc(u.createdAt)}', '${esc(u.lastLogin)}');\n`;
    });
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database_pembeli_mochi_oled.sql';
    a.click();
    URL.revokeObjectURL(url);
    showToast('File SQL Database Pembeli berhasil diunduh!');
}

const STORAGE_KEY_PAYMENT_CFG = 'MOCHI_PAYMENT_CONFIG_V3';
const STORAGE_KEY_ORDERS = 'MOCHI_ORDERS_DB_V1';
const defaultPaymentConfig = {
    holderName: 'Dede Sapuriyandika',
    adminWa: '6283871535128',
    qrisMerchant: 'DS Store (NMID: ID1026590649467)',
    qrisImageDataUrl: 'qris_ds_store.jpg',
    ewalletNumber: '083871535128',
    banks: {
        seabank: '901768637410'
    }
};
let paymentConfig = JSON.parse(JSON.stringify(defaultPaymentConfig));

function loadPaymentConfig() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PAYMENT_CFG);
        if (raw) {
            const parsed = JSON.parse(raw);
            paymentConfig = {
                ...defaultPaymentConfig,
                ...parsed,
                banks: { ...defaultPaymentConfig.banks, ...(parsed.banks || {}) }
            };
        } else {
            localStorage.setItem(STORAGE_KEY_PAYMENT_CFG, JSON.stringify(paymentConfig));
        }
    } catch (e) {
        paymentConfig = JSON.parse(JSON.stringify(defaultPaymentConfig));
    }
    populatePaymentConfigForm();
}

function populatePaymentConfigForm() {
    const holderEl = document.getElementById('cfg-holder-name');
    if (!holderEl) return;
    holderEl.value = paymentConfig.holderName || 'Dede Sapuriyandika';
    document.getElementById('cfg-ewallet-num').value = paymentConfig.ewalletNumber || '083871535128';
    document.getElementById('cfg-admin-wa').value = paymentConfig.adminWa || '6283871535128';
    document.getElementById('cfg-qris-merchant').value = paymentConfig.qrisMerchant || 'MOCHI.OLED // DEDE SAPURIYANDIKA';
    const seabankEl = document.getElementById('cfg-bank-seabank');
    if (seabankEl) seabankEl.value = (paymentConfig.banks && paymentConfig.banks.seabank) || '901768637410';

    const previewBox = document.getElementById('cfg-qris-preview-box');
    if (previewBox) {
        if (paymentConfig.qrisImageDataUrl) previewBox.classList.remove('hidden');
        else previewBox.classList.add('hidden');
    }
}

function handleUploadQrisImage(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        paymentConfig.qrisImageDataUrl = ev.target.result;
        document.getElementById('cfg-qris-preview-box').classList.remove('hidden');
        showToast('Gambar QRIS siap disimpan! Klik tombol Simpan Rekening.');
    };
    reader.readAsDataURL(file);
}

function removeCustomQrisImage() {
    paymentConfig.qrisImageDataUrl = '';
    const fileInput = document.getElementById('cfg-qris-file');
    if (fileInput) fileInput.value = '';
    document.getElementById('cfg-qris-preview-box').classList.add('hidden');
    showToast('Gambar QRIS kustom dihapus.');
}

function handleSavePaymentConfig(e) {
    e.preventDefault();
    paymentConfig.holderName = document.getElementById('cfg-holder-name').value.trim();
    paymentConfig.ewalletNumber = document.getElementById('cfg-ewallet-num').value.trim();
    paymentConfig.adminWa = document.getElementById('cfg-admin-wa').value.trim();
    paymentConfig.qrisMerchant = document.getElementById('cfg-qris-merchant').value.trim();
    paymentConfig.banks = {
        seabank: document.getElementById('cfg-bank-seabank').value.trim()
    };

    try {
        localStorage.setItem(STORAGE_KEY_PAYMENT_CFG, JSON.stringify(paymentConfig));
        if (window.MochiCloud) {
            window.MochiCloud.pushCollection(STORAGE_KEY_PAYMENT_CFG, paymentConfig);
        }
        saveAndSyncDatabase(
            `Pengaturan Rekening Tujuan diperbarui ke a.n "${paymentConfig.holderName}" (SeaBank: ${paymentConfig.banks.seabank}, E-Wallet: ${paymentConfig.ewalletNumber}).`,
            'info'
        );
    } catch (err) {}
    showToast('Rekening tujuan berhasil disimpan & disinkronkan ke halaman pembeli!');
}

function getOrdersList() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || '[]');
    } catch (e) {
        return [];
    }
}

function renderAdminOrders() {
    const orders = getOrdersList();
    const navBadge = document.getElementById('nav-orders-count');
    const totalEl = document.getElementById('orders-total-count');
    const listEl = document.getElementById('admin-orders-list');

    if (navBadge) navBadge.textContent = orders.length;
    if (totalEl) totalEl.textContent = orders.length;
    if (!listEl) return;

    if (orders.length === 0) {
        listEl.innerHTML = `<div class="p-8 text-center border-2 border-dashed border-slate-300 rounded-xl text-xs font-mono-tech text-slate-400">Belum ada transaksi masuk dari Payment Gateway pembeli.</div>`;
        return;
    }

    listEl.innerHTML = orders.map((o, idx) => {
        const statusStr = String(o.status || '');
        const isPaid = statusStr.includes('LUNAS') || statusStr.includes('SELESAI');
        const badgeClass = isPaid
            ? 'bg-emerald-100 text-emerald-900 border-emerald-700'
            : 'bg-amber-100 text-amber-900 border-amber-700';

        return `
            <div class="p-4 rounded-xl border-2 border-slate-900 bg-slate-50 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 font-mono-tech text-xs font-bold">${o.orderId || '#ORD'}</span>
                        <span class="font-mono-tech text-[10px] text-slate-500">${o.createdAt || ''}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded border font-mono-tech text-[10px] font-bold ${badgeClass}">${o.status}</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                        <div class="text-slate-500 text-[10px] font-mono-tech">PEMBELI &amp; PRODUK:</div>
                        <div class="font-bold text-slate-900">${o.buyerName} (${o.buyerWa})</div>
                        <div class="text-slate-700 mt-0.5">${o.items}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5 truncate">${o.address || ''}</div>
                    </div>
                    <div class="sm:text-right">
                        <div class="text-slate-500 text-[10px] font-mono-tech">TUJUAN REKENING &amp; NOMINAL:</div>
                        <div class="font-mono-tech font-extrabold text-sm text-cyan-700">${o.total}</div>
                        <div class="font-mono-tech text-[11px] font-bold text-slate-800">${o.destinationAccount || o.method}</div>
                        <div class="text-[11px] text-slate-500">Pengirim: ${o.senderNote || '-'}</div>
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 pt-1">
                    ${!isPaid ? `
                        <button onclick="markOrderVerified(${idx})" class="wf-btn px-3 py-1.5 rounded-lg bg-emerald-400 text-slate-900 font-bold text-xs flex items-center gap-1">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            <span>Verifikasi Lunas</span>
                        </button>
                    ` : ''}
                    <button onclick="deleteOrderRecord(${idx})" class="px-2.5 py-1.5 rounded-lg border border-rose-300 hover:border-rose-600 bg-white text-rose-600 font-mono-tech text-xs font-bold">
                        Hapus
                    </button>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function markOrderVerified(index) {
    const orders = getOrdersList();
    if (!orders[index]) return;
    orders[index].status = 'LUNAS (VERIFIED)';
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    if (window.MochiCloud) window.MochiCloud.pushCollection(STORAGE_KEY_ORDERS, orders);
    saveAndSyncDatabase(`Pembayaran ${orders[index].orderId} (${orders[index].buyerName} - ${orders[index].total}) telah diverifikasi LUNAS oleh Admin.`, 'add');
    renderAdminOrders();
    showToast(`Transaksi ${orders[index].orderId} diverifikasi LUNAS!`);
}

function deleteOrderRecord(index) {
    const orders = getOrdersList();
    if (!orders[index]) return;
    orders.splice(index, 1);
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    if (window.MochiCloud) window.MochiCloud.pushCollection(STORAGE_KEY_ORDERS, orders);
    renderAdminOrders();
    showToast('Data transaksi dihapus.');
}

function clearCompletedOrders() {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify([]));
    if (window.MochiCloud) window.MochiCloud.pushCollection(STORAGE_KEY_ORDERS, []);
    renderAdminOrders();
    showToast('Riwayat transaksi dibersihkan.');
}

function switchAdminView(viewName) {
    const invView = document.getElementById('admin-view-inventory');
    const sfView = document.getElementById('admin-view-storefront');
    const buyView = document.getElementById('admin-view-buyers');
    const payView = document.getElementById('admin-view-payments');
    const cloudView = document.getElementById('admin-view-cloud');
    const btnInv = document.getElementById('tab-btn-inventory');
    const btnSf = document.getElementById('tab-btn-storefront');
    const btnBuy = document.getElementById('tab-btn-buyers');
    const btnPay = document.getElementById('tab-btn-payments');
    const btnCloud = document.getElementById('tab-btn-cloud');

    [invView, sfView, buyView, payView, cloudView].forEach(v => v && v.classList.add('hidden'));
    [btnInv, btnSf, btnBuy, btnPay, btnCloud].forEach(b => {
        if (b) {
            b.classList.remove('bg-amber-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-sky-400');
            b.classList.add('bg-white');
        }
    });

    if (viewName === 'inventory') {
        invView.classList.remove('hidden');
        btnInv.classList.remove('bg-white');
        btnInv.classList.add('bg-amber-400');
    } else if (viewName === 'buyers') {
        buyView.classList.remove('hidden');
        btnBuy.classList.remove('bg-white');
        btnBuy.classList.add('bg-emerald-400');
        renderBuyersDatabaseTable();
    } else if (viewName === 'payments') {
        payView.classList.remove('hidden');
        btnPay.classList.remove('bg-white');
        btnPay.classList.add('bg-amber-400');
        loadPaymentConfig();
        renderAdminOrders();
    } else if (viewName === 'cloud') {
        if (cloudView) cloudView.classList.remove('hidden');
        if (btnCloud) {
            btnCloud.classList.remove('bg-white');
            btnCloud.classList.add('bg-sky-400');
        }
        loadCloudAndSecurityPanel();
    } else {
        sfView.classList.add('block');
        sfView.classList.remove('hidden');
        btnSf.classList.remove('bg-white');
        btnSf.classList.add('bg-cyan-400');
        renderConnectedStorefront();
    }
    lucide.createIcons();
}

function renderConnectedStorefront() {
    const grid = document.getElementById('connected-storefront-grid');
    document.getElementById('storefront-count-label').textContent = `${products.length} Varian di Katalog`;

    grid.innerHTML = products.map(prod => {
        const isOut = prod.stock <= 0;
        return `
            <div class="wf-box rounded-xl p-4 bg-white flex flex-col justify-between ${isOut ? 'opacity-75' : ''}">
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold border border-slate-900 ${prod.badgeColor}">
                            ${prod.badge}
                        </span>
                        ${getStockBadgeHTML(prod.stock)}
                    </div>

                    <div class="h-32 rounded-xl bg-slate-100 border-2 border-slate-900 flex items-center justify-center mb-3">
                        <div style="background-color: ${prod.casingColor};" class="w-28 h-20 rounded-2xl border-2 border-slate-900 shadow-[0_4px_0_#0f172a] flex items-center justify-center p-2">
                            <div class="oled-screen w-full h-full rounded-lg flex items-center justify-center">
                                <div class="scale-75">${getOledFaceSVG(prod.defaultExp)}</div>
                            </div>
                        </div>
                    </div>

                    <h5 class="font-extrabold text-sm mb-1">${prod.name}</h5>
                    <div class="font-mono-tech font-extrabold text-base text-slate-900 mb-3">${formatRupiah(prod.price)}</div>
                </div>

                <button onclick="addToSimCart('${prod.id}')" ${isOut ? 'disabled' : ''} class="wf-btn w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 ${isOut ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-cyan-400 hover:bg-slate-800'}">
                    <span>${isOut ? 'Stok Habis (Tidak Bisa Dibeli)' : '+ Masukkan Keranjang Pelanggan'}</span>
                </button>
            </div>
        `;
    }).join('');

    renderSimCart();
}

function addToSimCart(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod || prod.stock <= 0) return;

    const existing = simCart.find(i => i.id === productId);
    const currentInCart = existing ? existing.qty : 0;

    if (currentInCart + 1 > prod.stock) {
        showToast(`Stok tidak cukup! Tersisa ${prod.stock} unit.`);
        return;
    }

    if (existing) {
        existing.qty += 1;
    } else {
        simCart.push({ id: productId, qty: 1 });
    }
    renderSimCart();
}

function renderSimCart() {
    const container = document.getElementById('sim-cart-items');
    const badge = document.getElementById('sim-cart-badge');
    const totalEl = document.getElementById('sim-cart-total');

    // Bersihkan item jika produk dihapus atau stok kurang
    simCart = simCart.filter(item => {
        const p = products.find(prod => prod.id === item.id);
        if (!p || p.stock <= 0) return false;
        if (item.qty > p.stock) item.qty = p.stock;
        return true;
    });

    const totalQty = simCart.reduce((s, i) => s + i.qty, 0);
    badge.textContent = totalQty;

    if (simCart.length === 0) {
        container.innerHTML = `<div class="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-300 rounded-lg">Belum ada produk dipilih pelanggan.</div>`;
        totalEl.textContent = 'Rp 0';
        return;
    }

    let subtotal = 0;
    container.innerHTML = simCart.map(item => {
        const prod = products.find(p => p.id === item.id);
        subtotal += prod.price * item.qty;
        return `
            <div class="p-2.5 rounded-lg border border-slate-900 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                    <div class="font-bold">${prod.name}</div>
                    <div class="font-mono-tech text-slate-500">${item.qty} x ${formatRupiah(prod.price)}</div>
                </div>
                <span class="font-mono-tech font-bold">${formatRupiah(prod.price * item.qty)}</span>
            </div>
        `;
    }).join('');

    totalEl.textContent = formatRupiah(subtotal);
}

function simulateCustomerCheckout() {
    if (simCart.length === 0) {
        showToast('Pilih minimal 1 produk di katalog simulasi terlebih dahulu!');
        return;
    }

    const method = document.getElementById('sim-payment-method').value;
    const summaryItems = [];

    simCart.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
            prod.stock = Math.max(0, prod.stock - item.qty);
            summaryItems.push(`${item.qty}x ${prod.name}`);
        }
    });

    simCart = [];
    saveAndSyncDatabase(
        `PESANAN PELANGGAN MASUK (${method}): ${summaryItems.join(', ')}. Stok otomatis dikurangi!`,
        'sub'
    );
    showToast('Checkout pelanggan berhasil! Stok Admin otomatis berkurang.');
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'wf-box-sm px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-mono-tech flex items-center gap-2.5 shadow-lg pointer-events-auto transition-all duration-300';
    toast.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2600);
}

function renderAll() {
    renderKPIs();
    renderAdminInventory();
    renderSyncLogs();
    renderConnectedStorefront();
    renderBuyersDatabaseTable();
    renderAdminOrders();
}

// Dengarkan perubahan dari tab Website Penjualan (Storefront / Index Pembeli) secara real-time
window.addEventListener('storage', (event) => {
    if (
        event.key === STORAGE_KEY_PRODUCTS ||
        event.key === STORAGE_KEY_LOGS ||
        event.key === STORAGE_KEY_USERS ||
        event.key === STORAGE_KEY_ORDERS ||
        event.key === STORAGE_KEY_PAYMENT_CFG
    ) {
        loadDatabase();
        loadPaymentConfig();
        renderAll();
        showToast('Sinkronisasi otomatis diterima dari Website Pembeli!');
    }
});

if (syncChannel) {
    syncChannel.onmessage = () => {
        loadDatabase();
        loadPaymentConfig();
        renderAll();
    };
}

// =========================================================================
// 7. OTORISASI SESI ADMIN (TERHUBUNG KE LOGIN_ADMIN.HTML)
// =========================================================================
const STORAGE_KEY_AUTH_ADMIN = 'MOCHI_AUTH_ADMIN_V1';
let currentAdmin = null;

function readSharedSession(key) {
    try {
        const localVal = localStorage.getItem(key);
        if (localVal) return JSON.parse(localVal);
    } catch (e) {}
    try {
        if (window.name && window.name.startsWith('__MOCHI_BAG__:')) {
            const winBag = JSON.parse(window.name.replace('__MOCHI_BAG__:', ''));
            if (winBag[key]) {
                try { localStorage.setItem(key, JSON.stringify(winBag[key])); } catch (e) {}
                return winBag[key];
            }
        }
    } catch (e) {}
    return null;
}

function removeSharedSession(key) {
    try { localStorage.removeItem(key); } catch (e) {}
    try {
        if (window.name && window.name.startsWith('__MOCHI_BAG__:')) {
            const winBag = JSON.parse(window.name.replace('__MOCHI_BAG__:', ''));
            delete winBag[key];
            window.name = '__MOCHI_BAG__:' + JSON.stringify(winBag);
        }
    } catch (e) {}
}

const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function isValidAdminSession(session) {
    if (!session || !session.name || !session.loginAt) return false;
    const age = Date.now() - new Date(session.loginAt).getTime();
    return !Number.isNaN(age) && age >= 0 && age <= ADMIN_SESSION_TTL_MS;
}

function verifyAdminAuth() {
    currentAdmin = readSharedSession(STORAGE_KEY_AUTH_ADMIN);
    if (!isValidAdminSession(currentAdmin)) {
        removeSharedSession(STORAGE_KEY_AUTH_ADMIN);
        window.location.replace('index.html');
        return false;
    }
    const badge = document.getElementById('admin-name-badge');
    if (badge) badge.textContent = currentAdmin.name;
    return true;
}

function logoutAdmin() {
    const adminName = currentAdmin ? currentAdmin.name : 'Admin';
    removeSharedSession(STORAGE_KEY_AUTH_ADMIN);
    try {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
        logs.unshift({
            time: getTimeStr(),
            msg: `Admin "${adminName}" keluar (logout) dari Backoffice.`,
            type: 'info'
        });
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
        if (window.MochiCloud) window.MochiCloud.pushCollection(STORAGE_KEY_LOGS, logs);
        if (syncChannel) syncChannel.postMessage({ type: 'ADMIN_LOGOUT', timestamp: Date.now() });
    } catch (e) {}
    window.location.href = 'index.html';
}

// =========================================================================
// 8. PENGATURAN CLOUD (FIREBASE & GOOGLE SHEETS) + KEAMANAN PIN ADMIN
// =========================================================================
function updateCloudStatusBadges(lastPullInfo) {
    const cloudApi = window.MochiCloud;
    if (!cloudApi) return;
    const cfg = cloudApi.getCloudConfig();

    const fbBadge = document.getElementById('cloud-status-firebase');
    const shBadge = document.getElementById('cloud-status-sheets');
    const navDot = document.getElementById('nav-cloud-dot');
    const footerStatus = document.getElementById('footer-db-status');
    const lastSyncEl = document.getElementById('cloud-last-sync');

    if (fbBadge) {
        if (cfg.firebaseDatabaseUrl) {
            fbBadge.textContent = 'Firebase: TERHUBUNG';
            fbBadge.className = 'px-2 py-0.5 bg-emerald-400 text-slate-900 font-mono-tech text-[10px] font-bold rounded';
        } else {
            fbBadge.textContent = 'Firebase: Belum Diatur';
            fbBadge.className = 'px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-mono-tech text-[10px] rounded';
        }
    }

    if (shBadge) {
        if (cfg.googleSheetsWebAppUrl) {
            shBadge.textContent = 'Google Sheets: TERHUBUNG';
            shBadge.className = 'px-2 py-0.5 bg-emerald-400 text-slate-900 font-mono-tech text-[10px] font-bold rounded';
        } else {
            shBadge.textContent = 'Google Sheets: Belum Diatur';
            shBadge.className = 'px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-mono-tech text-[10px] rounded';
        }
    }

    const anyCloud = !!(cfg.firebaseDatabaseUrl || cfg.googleSheetsWebAppUrl);
    if (navDot) {
        navDot.className = anyCloud
            ? 'w-2 h-2 rounded-full bg-emerald-500'
            : 'w-2 h-2 rounded-full bg-slate-400';
    }
    if (footerStatus) {
        footerStatus.textContent = anyCloud
            ? `[STATUS DATABASE: CLOUD SYNC (${cfg.firebaseDatabaseUrl ? 'FIREBASE' : ''}${cfg.firebaseDatabaseUrl && cfg.googleSheetsWebAppUrl ? ' + ' : ''}${cfg.googleSheetsWebAppUrl ? 'SHEETS' : ''})]`
            : '[STATUS DATABASE: MODE LOKAL]';
    }

    if (lastSyncEl && lastPullInfo) {
        const errText = lastPullInfo.errors && lastPullInfo.errors.length
            ? ` | Catatan: ${lastPullInfo.errors.join(', ')}`
            : '';
        lastSyncEl.textContent = `Sinkronisasi Cloud (${lastPullInfo.source.toUpperCase()}): ${getTimeStr()} WIB${errText}`;
    }
}

function showCloudTestResult(message, isOk) {
    const box = document.getElementById('cloud-test-result');
    if (!box) return;
    box.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-600', 'text-emerald-900', 'bg-rose-50', 'border-rose-600', 'text-rose-900');
    if (isOk) {
        box.classList.add('bg-emerald-50', 'border-emerald-600', 'text-emerald-900');
    } else {
        box.classList.add('bg-rose-50', 'border-rose-600', 'text-rose-900');
    }
    box.textContent = message;
}

function loadCloudAndSecurityPanel() {
    const cloudApi = window.MochiCloud;
    if (!cloudApi) return;
    const cfg = cloudApi.getCloudConfig();

    const fbInput = document.getElementById('cfg-firebase-url');
    const tokInput = document.getElementById('cfg-firebase-token');
    const shInput = document.getElementById('cfg-sheets-url');
    if (fbInput) fbInput.value = cfg.firebaseDatabaseUrl || '';
    if (tokInput) tokInput.value = cfg.firebaseAuthToken || '';
    if (shInput) shInput.value = cfg.googleSheetsWebAppUrl || '';

    const targetSelect = document.getElementById('sec-admin-target');
    if (targetSelect) {
        const accounts = cloudApi.getAdminAccounts();
        targetSelect.innerHTML = accounts.map(acc =>
            `<option value="${acc.id}">${acc.name} (${acc.email} — ${acc.role})</option>`
        ).join('');
    }

    updateCloudStatusBadges();
}

function handleSaveCloudConfig(e) {
    e.preventDefault();
    const cloudApi = window.MochiCloud;
    if (!cloudApi) return;

    const fbUrl = document.getElementById('cfg-firebase-url').value.trim();
    const fbToken = document.getElementById('cfg-firebase-token').value.trim();
    const shUrl = document.getElementById('cfg-sheets-url').value.trim();

    cloudApi.saveCloudOverride({
        firebaseDatabaseUrl: fbUrl,
        firebaseAuthToken: fbToken,
        googleSheetsWebAppUrl: shUrl
    });

    updateCloudStatusBadges();
    showCloudTestResult('Konfigurasi Cloud disimpan di browser ini. Klik "Push Lokal ke Cloud" atau "Download js/cloud-config.js" sebelum deploy.', true);
    showToast('Konfigurasi Cloud disimpan!');
}

async function testFirebaseConnection() {
    const cloudApi = window.MochiCloud;
    if (!cloudApi) return;
    const fbUrl = document.getElementById('cfg-firebase-url').value.trim();
    const fbToken = document.getElementById('cfg-firebase-token').value.trim();
    try {
        await cloudApi.testFirebase(fbUrl, fbToken);
        showCloudTestResult('BERHASIL: Firebase Realtime Database merespons dengan baik (200 OK).', true);
        showToast('Koneksi Firebase berhasil!');
    } catch (err) {
        showCloudTestResult('GAGAL FIREBASE: ' + err.message, false);
        showToast('Koneksi Firebase gagal.');
    }
}

async function testSheetsConnection() {
    const cloudApi = window.MochiCloud;
    if (!cloudApi) return;
    const shUrl = document.getElementById('cfg-sheets-url').value.trim();
    try {
        const res = await cloudApi.testGoogleSheets(shUrl);
        const sheetName = (res.info && res.info.spreadsheet) ? res.info.spreadsheet : 'Google Spreadsheet';
        showCloudTestResult(`BERHASIL: Google Sheets Web App aktif (${sheetName}).`, true);
        showToast('Koneksi Google Sheets berhasil!');
    } catch (err) {
        showCloudTestResult('GAGAL GOOGLE SHEETS: ' + err.message, false);
        showToast('Koneksi Google Sheets gagal.');
    }
}

async function pullAllDataFromCloud() {
    const cloudApi = window.MochiCloud;
    if (!cloudApi) return;
    try {
        const res = await cloudApi.pullAll();
        updateCloudStatusBadges(res);
        if (res.errors.length) {
            showCloudTestResult('Pull selesai dengan catatan: ' + res.errors.join(' | '), false);
        } else if (!res.firebaseActive && !res.sheetsActive) {
            showCloudTestResult('Belum ada URL Cloud yang diisi. Saat ini berjalan pada Mode Lokal browser.', false);
        } else {
            loadDatabase();
            loadPaymentConfig();
            renderAll();
            showCloudTestResult(`Data berhasil ditarik dari ${res.source.toUpperCase()} & disinkronkan ke tampilan Dashboard.`, true);
            showToast('Sinkronisasi tarik data cloud selesai!');
        }
    } catch (err) {
        showCloudTestResult('Error saat menarik data: ' + err.message, false);
    }
}

async function pushAllDataToCloud() {
    const cloudApi = window.MochiCloud;
    if (!cloudApi) return;

    // Pastikan nilai terbaru dari input form juga ikut tersimpan lebih dulu
    const fbInput = document.getElementById('cfg-firebase-url');
    const tokInput = document.getElementById('cfg-firebase-token');
    const shInput = document.getElementById('cfg-sheets-url');
    if (fbInput || shInput) {
        cloudApi.saveCloudOverride({
            firebaseDatabaseUrl: fbInput ? fbInput.value.trim() : '',
            firebaseAuthToken: tokInput ? tokInput.value.trim() : '',
            googleSheetsWebAppUrl: shInput ? shInput.value.trim() : ''
        });
    }

    try {
        const res = await cloudApi.pushAllFromLocal();
        updateCloudStatusBadges({ source: 'push', errors: res.warnings || [] });
        if (res.warnings && res.warnings.length > 0) {
            showCloudTestResult('Push sebagian berhasil, peringatan: ' + res.warnings.join(' | '), false);
        } else {
            showCloudTestResult('SUKSES: Seluruh Produk, Stok, Pesanan, Pembeli & Payment Config berhasil di-upload ke Cloud!', true);
        }
        showToast('Upload data lokal ke Cloud berhasil!');
    } catch (err) {
        showCloudTestResult('GAGAL PUSH CLOUD: ' + err.message, false);
        showToast('Gagal upload data ke Cloud.');
    }
}

function resetCloudConfigOverride() {
    if (!window.MochiCloud) return;
    window.MochiCloud.clearCloudOverride();
    loadCloudAndSecurityPanel();
    showCloudTestResult('Override konfigurasi browser dihapus; kembali membaca js/cloud-config.js bawaan.', true);
    showToast('Override Cloud di-reset.');
}

function downloadGeneratedCloudConfig() {
    if (!window.MochiCloud) return;
    const content = window.MochiCloud.generateCloudConfigFileContent();
    const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloud-config.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('File cloud-config.js berhasil diunduh! Simpan ke folder js/ sebelum hosting.');
}

async function copyGeneratedCloudConfig() {
    if (!window.MochiCloud) return;
    const content = window.MochiCloud.generateCloudConfigFileContent();
    try {
        await navigator.clipboard.writeText(content);
        showToast('Isi js/cloud-config.js disalin ke clipboard!');
    } catch (err) {
        downloadGeneratedCloudConfig();
    }
}

async function handleChangeAdminSecurity(e) {
    e.preventDefault();
    const cloudApi = window.MochiCloud;
    if (!cloudApi) return;

    const targetId = document.getElementById('sec-admin-target').value;
    const curPass = document.getElementById('sec-current-password').value;
    const curPin = document.getElementById('sec-current-pin').value.trim();
    const newPass = document.getElementById('sec-new-password').value;
    const newPin = document.getElementById('sec-new-pin').value.trim();

    if (!newPass && !newPin) {
        showToast('Isi minimal Password Baru atau PIN 6-Digit Baru.');
        return;
    }
    if (newPin && !/^\d{6}$/.test(newPin)) {
        showToast('PIN Baru wajib terdiri dari tepat 6 digit angka!');
        return;
    }

    const accounts = cloudApi.getAdminAccounts();
    const idx = accounts.findIndex(a => a.id === targetId);
    if (idx === -1) return;

    const curPassHash = cloudApi.hashAdminSecret(curPass);
    const curPinHash = cloudApi.hashAdminSecret(curPin);
    if (accounts[idx].passwordHash !== curPassHash || accounts[idx].pinHash !== curPinHash) {
        showCloudTestResult('VERIFIKASI GAGAL: Password atau PIN saat ini tidak cocok untuk akun yang dipilih!', false);
        showToast('Password atau PIN saat ini salah!');
        return;
    }

    if (newPass) accounts[idx].passwordHash = cloudApi.hashAdminSecret(newPass);
    if (newPin) accounts[idx].pinHash = cloudApi.hashAdminSecret(newPin);

    await cloudApi.saveAdminAccounts(accounts);
    document.getElementById('form-admin-security').reset();

    saveAndSyncDatabase(`Keamanan Password/PIN untuk akun "${accounts[idx].email}" diperbarui (Hash SHA-256).`, 'info');
    showCloudTestResult(
        `Password/PIN "${accounts[idx].email}" diperbarui! Jika memakai hosting statis tanpa Firebase, jangan lupa Download & timpa js/cloud-config.js.`,
        true
    );
    showToast('Password & PIN Admin berhasil diperbarui!');
}

function resetAdminBruteForceLock() {
    try { localStorage.removeItem('MOCHI_ADMIN_FAIL_V1'); } catch (e) {}
    showToast('Penghitung gagal login & lockout Admin di browser ini telah di-reset.');
}

window.onload = function () {
    if (!verifyAdminAuth()) return;
    loadDatabase();
    loadPaymentConfig();
    updateNewProductPreview();
    renderAll();
    updateCloudStatusBadges();

    if (window.MochiCloud) {
        window.MochiCloud.startAutoSync((pullInfo) => {
            loadDatabase();
            loadPaymentConfig();
            renderAll();
            updateCloudStatusBadges(pullInfo);
        });
    }

    lucide.createIcons();
};
