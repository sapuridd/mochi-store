/* =========================================================================
   MOCHI.OLED // Buyer Login & Registration - Script (js/login.js)
   ========================================================================= */

// =========================================================================
// 1. DATABASE AKUN PEMBELI (MOCHI_USERS_DB_V1) & SINKRONISASI TOKO
// =========================================================================
const STORAGE_KEY_PRODUCTS = 'MOCHI_SHARED_PRODUCTS_V3';
const STORAGE_KEY_LOGS = 'MOCHI_SHARED_SYNCLOGS_V1';
const STORAGE_KEY_USERS = 'MOCHI_USERS_DB_V1';
const STORAGE_KEY_AUTH_USER = 'MOCHI_AUTH_USER_V1';
const STOREFRONT_URL = 'wireframe_penjualan_ganci_mochi_oled (1).html';
const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('mochi_store_sync_channel') : null;

const defaultBuyers = [
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

function formatDateTimeNow() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function saveSharedSession(key, data) {
    const raw = JSON.stringify(data);
    try { localStorage.setItem(key, raw); } catch (e) {}
    try {
        let winBag = {};
        if (window.name && window.name.startsWith('__MOCHI_BAG__:')) {
            winBag = JSON.parse(window.name.replace('__MOCHI_BAG__:', ''));
        }
        winBag[key] = data;
        window.name = '__MOCHI_BAG__:' + JSON.stringify(winBag);
    } catch (e) {}
}

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

function getBuyersDB() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_USERS);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultBuyers));
        return JSON.parse(JSON.stringify(defaultBuyers));
    } catch (e) {
        return JSON.parse(JSON.stringify(defaultBuyers));
    }
}

function saveBuyersDB(buyersArray) {
    saveSharedSession(STORAGE_KEY_USERS, buyersArray);
    if (window.MochiCloud) window.MochiCloud.pushCollection(STORAGE_KEY_USERS, buyersArray);
    if (syncChannel) syncChannel.postMessage({ type: 'USERS_DB_UPDATED', timestamp: Date.now() });
    renderQuickBuyerButtons();
}

function renderQuickBuyerButtons() {
    const buyers = getBuyersDB();
    const countEl = document.getElementById('registered-buyers-count');
    if (countEl) countEl.textContent = buyers.length;

    const listEl = document.getElementById('quick-buyer-list');
    if (!listEl) return;

    listEl.innerHTML = buyers.map(u => `
        <button type="button" onclick="fillDemoBuyer('${u.email}', '${u.password}')" class="p-2 rounded-lg border border-slate-300 hover:border-slate-900 bg-slate-50 hover:bg-cyan-50 text-left transition">
            <div class="font-bold text-xs text-slate-900 truncate">${u.name}</div>
            <div class="font-mono-tech text-[10px] text-slate-500 truncate">${u.email}</div>
        </button>
    `).join('');
}

function pushSyncLog(msg, type = 'info') {
    try {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
        logs.unshift({
            time: new Date().toTimeString().split(' ')[0],
            msg,
            type
        });
        if (logs.length > 30) logs.pop();
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
        if (window.MochiCloud) window.MochiCloud.pushCollection(STORAGE_KEY_LOGS, logs);
        if (syncChannel) syncChannel.postMessage({ type: 'AUTH_ACTIVITY', timestamp: Date.now() });
    } catch (e) {}
}

// =========================================================================
// 2. MASKOT OLED INTERAKTIF
// =========================================================================
const expList = ['normal', 'happy', 'love', 'sleep', 'dizzy', 'angry'];
let expIdx = 0;

function getOledFaceSVG(type) {
    switch (type) {
        case 'happy':
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow animate-pixel-bounce"><path d="M 18 36 Q 32 14 46 36" fill="none" stroke="#00f0ff" stroke-width="7" stroke-linecap="round"/><path d="M 74 36 Q 88 14 102 36" fill="none" stroke="#00f0ff" stroke-width="7" stroke-linecap="round"/><rect x="12" y="42" width="10" height="4" rx="2" fill="#ff2a6d"/><rect x="98" y="42" width="10" height="4" rx="2" fill="#ff2a6d"/><path d="M 54 40 Q 60 47 66 40" fill="none" stroke="#00f0ff" stroke-width="4" stroke-linecap="round"/></svg>`;
        case 'angry':
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow-red animate-pixel-bounce"><line x1="16" y1="14" x2="48" y2="24" stroke="#ff2a6d" stroke-width="6" stroke-linecap="round"/><line x1="104" y1="14" x2="72" y2="24" stroke="#ff2a6d" stroke-width="6" stroke-linecap="round"/><path d="M 18 26 H 46 V 38 Q 32 42 18 38 Z" fill="#ff2a6d"/><path d="M 74 26 H 102 V 38 Q 88 42 74 38 Z" fill="#ff2a6d"/></svg>`;
        case 'dizzy':
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow-green animate-pixel-bounce"><line x1="20" y1="18" x2="44" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/><line x1="44" y1="18" x2="20" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/><line x1="76" y1="18" x2="100" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/><line x1="100" y1="18" x2="76" y2="42" stroke="#05ffa1" stroke-width="6" stroke-linecap="round"/><path d="M 48 48 Q 54 42 60 48 T 72 48" fill="none" stroke="#05ffa1" stroke-width="4" stroke-linecap="round"/></svg>`;
        case 'love':
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow-red animate-pixel-bounce"><path d="M32 44 L18 30 A8 8 0 0 1 32 20 A8 8 0 0 1 46 30 Z" fill="#ff2a6d"/><path d="M88 44 L74 30 A8 8 0 0 1 88 20 A8 8 0 0 1 102 30 Z" fill="#ff2a6d"/></svg>`;
        case 'sleep':
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow"><path d="M 18 32 Q 32 42 46 32" fill="none" stroke="#00f0ff" stroke-width="6" stroke-linecap="round"/><path d="M 74 32 Q 88 42 102 32" fill="none" stroke="#00f0ff" stroke-width="6" stroke-linecap="round"/><text x="86" y="20" fill="#00f0ff" font-family="monospace" font-weight="bold" font-size="14" class="animate-zzz">Zzz</text></svg>`;
        default:
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow animate-blink"><rect x="20" y="14" width="24" height="32" rx="10" fill="#00f0ff"/><rect x="76" y="14" width="24" height="32" rx="10" fill="#00f0ff"/><circle cx="27" cy="22" r="3.5" fill="#050505"/><circle cx="83" cy="22" r="3.5" fill="#050505"/></svg>`;
    }
}

function setMascotState(exp, speechText) {
    document.getElementById('mascot-face').innerHTML = getOledFaceSVG(exp);
    document.getElementById('mascot-exp-tag').textContent = 'EXP: ' + exp.toUpperCase();
    if (speechText) {
        document.getElementById('mascot-speech').textContent = speechText;
    }
}

function cycleMascotExp() {
    expIdx = (expIdx + 1) % expList.length;
    const nextExp = expList[expIdx];
    setMascotState(nextExp, `"Ekspresi layar diubah ke mode ${nextExp.toUpperCase()}! Di halaman toko nanti ada lebih banyak varian seru."`);
}

function setMascotCasing(hex, label) {
    document.getElementById('mascot-casing').style.backgroundColor = hex;
    setMascotState('happy', `"Keren! Ini tampilan warna casing ${label}. Yuk login untuk cek stok dan harganya!"`);
}

function onIdentifierFocus() {
    setMascotState('happy', '"Halo Kak! Masukkan Email atau Nomor WhatsApp yang terdaftar ya."');
}

function onPasswordFocus() {
    setMascotState('sleep', '"Privasi aman! Mochi tutup mata dulu selama Kakak mengetik password..."');
}

function onPasswordBlur() {
    setMascotState('normal', '"Siap! Klik tombol Masuk untuk lanjut ke katalog Ganci Mochi OLED."');
}

// =========================================================================
// 3. LOGIKA LOGIN & PEMBUATAN AKUN PEMBELI KE DATABASE
// =========================================================================
function switchAuthTab(mode) {
    const loginForm = document.getElementById('form-buyer-login');
    const regForm = document.getElementById('form-buyer-register');
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    hideAlert();

    const activeClasses = ['bg-cyan-400', 'text-slate-900', 'border-2', 'border-slate-900', 'shadow-[2px_2px_0px_#0f172a]', 'font-extrabold'];
    const inactiveClasses = ['text-slate-600', 'font-bold'];

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        tabLogin.classList.add(...activeClasses);
        tabLogin.classList.remove(...inactiveClasses);
        tabReg.classList.remove(...activeClasses);
        tabReg.classList.add(...inactiveClasses);
        setMascotState('normal', '"Silakan masuk dengan akun pembeli Anda untuk mulai berbelanja."');
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        tabReg.classList.add(...activeClasses);
        tabReg.classList.remove(...inactiveClasses);
        tabLogin.classList.remove(...activeClasses);
        tabLogin.classList.add(...inactiveClasses);
        setMascotState('happy', '"Asyik, member baru! Isi data singkatnya supaya tersimpan di database pembeli kami."');
    }
}

function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

function showAlert(msg, type = 'error') {
    const el = document.getElementById('auth-alert');
    el.classList.remove('hidden', 'bg-rose-50', 'border-rose-600', 'text-rose-900', 'bg-emerald-50', 'border-emerald-600', 'text-emerald-900');
    if (type === 'error') {
        el.classList.add('bg-rose-50', 'border-rose-600', 'text-rose-900');
        el.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 shrink-0 mt-0.5 text-rose-600"></i><span>${msg}</span>`;
        const card = document.getElementById('auth-card');
        card.classList.remove('animate-shake');
        void card.offsetWidth;
        card.classList.add('animate-shake');
    } else {
        el.classList.add('bg-emerald-50', 'border-emerald-600', 'text-emerald-900');
        el.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 shrink-0 mt-0.5 text-emerald-600"></i><span>${msg}</span>`;
    }
    lucide.createIcons();
}

function hideAlert() {
    document.getElementById('auth-alert').classList.add('hidden');
}

function fillDemoBuyer(email, password) {
    switchAuthTab('login');
    document.getElementById('login-identifier').value = email;
    document.getElementById('login-password').value = password;
    setMascotState('happy', `"Akun (${email}) berhasil dimuat dari database! Klik 'Masuk & Mulai Belanja'."`);
    showToast(`Akun ${email} dimuat dari database!`);
}

function handleBuyerLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const buyers = getBuyersDB();
    const idx = buyers.findIndex(u =>
        (u.email.toLowerCase() === identifier || u.wa === identifier || u.name.toLowerCase() === identifier) &&
        u.password === password
    );

    if (idx === -1) {
        setMascotState('dizzy', '"Waduh! Email/No. WA atau password belum cocok di database. Silakan klik Buat Akun Baru jika belum terdaftar!"');
        showAlert('Akun tidak ditemukan atau kata sandi salah. Silakan daftar di tab Buat Akun Baru.', 'error');
        return;
    }

    buyers[idx].lastLogin = formatDateTimeNow();
    saveBuyersDB(buyers);

    completeBuyerLogin(buyers[idx], `Pembeli "${buyers[idx].name}" (${buyers[idx].email}) login ke Storefront.`);
}

function handleBuyerRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const wa = document.getElementById('reg-wa').value.trim();
    const address = document.getElementById('reg-address').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-password-confirm').value;

    if (password !== confirmPassword) {
        setMascotState('angry', '"Konfirmasi password belum sama nih, Kak! Pastikan kedua kolom password cocok ya."');
        showAlert('Konfirmasi password tidak cocok!', 'error');
        return;
    }

    const buyers = getBuyersDB();
    if (buyers.some(u => u.email.toLowerCase() === email || u.wa === wa)) {
        setMascotState('dizzy', '"Email atau Nomor WhatsApp ini sudah terdaftar di database! Silakan langsung login ya."');
        showAlert('Email atau No. WhatsApp sudah terdaftar di database.', 'error');
        return;
    }

    const nowStr = formatDateTimeNow();
    const newBuyer = {
        id: 'usr-' + String(buyers.length + 1).padStart(3, '0') + '-' + Date.now().toString().slice(-2),
        name,
        email,
        wa,
        address,
        password,
        createdAt: nowStr,
        lastLogin: nowStr
    };

    buyers.push(newBuyer);
    saveBuyersDB(buyers);

    completeBuyerLogin(newBuyer, `DATABASE PEMBELI BARU: "${newBuyer.name}" (${newBuyer.email} / ${newBuyer.wa}) berhasil dibuat & login.`);
}

function loginAsGuestBuyer() {
    const guestUser = {
        id: 'guest-' + Math.floor(100 + Math.random() * 900),
        name: 'Pembeli Tamu',
        email: 'tamu@mochi.oled',
        wa: '',
        address: '',
        isGuest: true
    };
    completeBuyerLogin(guestUser, 'Pengunjung masuk ke Storefront sebagai Pembeli Tamu.');
}

function completeBuyerLogin(userObj, logText) {
    const sessionPayload = {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        wa: userObj.wa || '',
        address: userObj.address || '',
        isGuest: !!userObj.isGuest,
        role: 'buyer',
        loginAt: new Date().toISOString()
    };

    saveSharedSession(STORAGE_KEY_AUTH_USER, sessionPayload);
    pushSyncLog(logText, 'add');

    setMascotState('love', `"Yeay! Selamat datang ${userObj.name}! Membuka katalog Ganci Mochi OLED..."`);
    showAlert(`Akun terverifikasi! Selamat datang ${userObj.name}, mengalihkan ke toko...`, 'success');

    setTimeout(() => {
        window.location.href = STOREFRONT_URL;
    }, 650);
}

function clearBuyerSession() {
    removeSharedSession(STORAGE_KEY_AUTH_USER);
    document.getElementById('active-session-banner').classList.add('hidden');
    showToast('Sesi pembeli berhasil dikeluarkan.');
}

function loadLiveStockSummary() {
    const ticker = document.getElementById('live-stock-ticker');
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (raw) {
            const prods = JSON.parse(raw);
            const totalUnits = prods.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
            ticker.textContent = `KATALOG AKTIF: ${prods.length} VARIAN (${totalUnits} UNIT TERSEDIA)`;
        } else {
            ticker.textContent = 'KATALOG AKTIF: 6 VARIAN (80 UNIT TERSEDIA)';
        }
    } catch (e) {
        ticker.textContent = 'KATALOG AKTIF: READY STOCK';
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'wf-box-sm px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-mono-tech flex items-center gap-2.5 shadow-lg pointer-events-auto transition-all duration-300';
    toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_PRODUCTS) loadLiveStockSummary();
    if (e.key === STORAGE_KEY_USERS) renderQuickBuyerButtons();
});
if (syncChannel) {
    syncChannel.onmessage = () => {
        loadLiveStockSummary();
        renderQuickBuyerButtons();
    };
}

window.onload = function () {
    setMascotState('normal');
    loadLiveStockSummary();
    renderQuickBuyerButtons();

    const activeUser = readSharedSession(STORAGE_KEY_AUTH_USER);
    if (activeUser && activeUser.name) {
        document.getElementById('active-session-name').textContent = activeUser.name;
        document.getElementById('active-session-banner').classList.remove('hidden');
    }

    if (window.MochiCloud) {
        window.MochiCloud.startAutoSync(() => {
            loadLiveStockSummary();
            renderQuickBuyerButtons();
        });
    }

    lucide.createIcons();
};
