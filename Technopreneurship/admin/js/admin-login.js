/* =========================================================================
   MOCHI.ADMIN // Admin Auth Portal - Script (admin/js/admin-login.js)
   ========================================================================= */

const STORAGE_KEY_AUTH_ADMIN = 'MOCHI_AUTH_ADMIN_V1';
const STORAGE_KEY_LOGS = 'MOCHI_SHARED_SYNCLOGS_V1';
const STORAGE_KEY_FAIL_ADMIN = 'MOCHI_ADMIN_FAIL_V1';
const ADMIN_PANEL_URL = 'dashboard.html';
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FAIL_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;
const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('mochi_store_sync_channel') : null;

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

function getGuardSVG(state) {
    switch (state) {
        case 'mask':
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow-amber"><path d="M 18 32 Q 32 42 46 32" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><path d="M 74 32 Q 88 42 102 32" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><text x="42" y="20" fill="#fbbf24" font-family="monospace" font-weight="bold" font-size="10">ENCRYPT</text></svg>`;
        case 'granted':
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow-green"><path d="M 18 36 Q 32 14 46 36" fill="none" stroke="#05ffa1" stroke-width="7" stroke-linecap="round"/><path d="M 74 36 Q 88 14 102 36" fill="none" stroke="#05ffa1" stroke-width="7" stroke-linecap="round"/><path d="M 52 40 L 58 46 L 70 34" fill="none" stroke="#05ffa1" stroke-width="4" stroke-linecap="round"/></svg>`;
        case 'denied':
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow-red"><line x1="16" y1="14" x2="48" y2="24" stroke="#ff2a6d" stroke-width="6" stroke-linecap="round"/><line x1="104" y1="14" x2="72" y2="24" stroke="#ff2a6d" stroke-width="6" stroke-linecap="round"/><path d="M 18 26 H 46 V 38 Q 32 42 18 38 Z" fill="#ff2a6d"/><path d="M 74 26 H 102 V 38 Q 88 42 74 38 Z" fill="#ff2a6d"/></svg>`;
        default:
            return `<svg viewBox="0 0 120 60" class="w-28 h-16 oled-glow-amber animate-blink"><rect x="20" y="14" width="24" height="32" rx="8" fill="#fbbf24"/><rect x="76" y="14" width="24" height="32" rx="8" fill="#fbbf24"/><circle cx="27" cy="22" r="3.5" fill="#050505"/><circle cx="83" cy="22" r="3.5" fill="#050505"/></svg>`;
    }
}

function setGuardState(state, badgeText, modeLabel, msg) {
    document.getElementById('guard-oled-face').innerHTML = getGuardSVG(state);
    document.getElementById('guard-badge').textContent = badgeText;
    document.getElementById('guard-mode-label').textContent = modeLabel;
    if (msg) document.getElementById('guard-message').textContent = msg;
}

function onAdminInputFocus() {
    setGuardState('standby', 'SCANNING_ID', 'VERIFY', 'Memeriksa identitas pengelola... Masukkan username atau email resmi toko.');
}

function onAdminPasswordFocus() {
    setGuardState('mask', 'SEC_MASK', 'MASKED', 'Sensor privasi aktif. Ketik password otorisasi Admin dengan aman.');
}

function onAdminPasswordBlur() {
    setGuardState('standby', 'READY', 'LOCKED', 'Klik tombol Masuk ke Panel Manajemen Admin untuk memverifikasi sesi.');
}

function onAdminPinFocus() {
    setGuardState('mask', 'PIN_2FA', 'VERIFY', 'Verifikasi 2-Faktor aktif. Masukkan 6 digit PIN Keamanan rahasia Anda.');
}

function toggleAdminPass() {
    const input = document.getElementById('admin-password');
    const icon = document.getElementById('eye-admin');
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

function togglePinVisibility() {
    const input = document.getElementById('admin-pin');
    const icon = document.getElementById('eye-pin');
    if (!input || !icon) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

function getFailState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_FAIL_ADMIN);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                count: Number(parsed.count || 0),
                lockedUntil: Number(parsed.lockedUntil || 0)
            };
        }
    } catch (e) {}
    return { count: 0, lockedUntil: 0 };
}

function saveFailState(state) {
    try { localStorage.setItem(STORAGE_KEY_FAIL_ADMIN, JSON.stringify(state)); } catch (e) {}
}

function clearFailState() {
    try { localStorage.removeItem(STORAGE_KEY_FAIL_ADMIN); } catch (e) {}
}

function getLockoutRemainingSeconds() {
    const st = getFailState();
    const diff = st.lockedUntil - Date.now();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
}

function isAdminSessionValid(session) {
    if (!session || !session.name || !session.loginAt) return false;
    const age = Date.now() - new Date(session.loginAt).getTime();
    return !Number.isNaN(age) && age >= 0 && age <= ADMIN_SESSION_TTL_MS;
}

function showAdminAlert(msg, type = 'error') {
    const el = document.getElementById('admin-alert');
    el.classList.remove('hidden', 'bg-rose-50', 'border-rose-600', 'text-rose-900', 'bg-emerald-50', 'border-emerald-600', 'text-emerald-900');
    if (type === 'error') {
        el.classList.add('bg-rose-50', 'border-rose-600', 'text-rose-900');
        el.innerHTML = `<i data-lucide="shield-alert" class="w-4 h-4 shrink-0 mt-0.5 text-rose-600"></i><span>${msg}</span>`;
        const card = document.getElementById('admin-auth-card');
        card.classList.remove('animate-shake');
        void card.offsetWidth;
        card.classList.add('animate-shake');
    } else {
        el.classList.add('bg-emerald-50', 'border-emerald-600', 'text-emerald-900');
        el.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 shrink-0 mt-0.5 text-emerald-600"></i><span>${msg}</span>`;
    }
    lucide.createIcons();
}

function handleAdminLogin(e) {
    e.preventDefault();

    const lockRem = getLockoutRemainingSeconds();
    if (lockRem > 0) {
        setGuardState('denied', 'LOCKED_OUT', 'BLOCKED', `Terlalu banyak percobaan gagal! Coba lagi dalam ${lockRem} detik.`);
        showAdminAlert(`Akses dikunci sementara (${lockRem} detik tersisa) karena salah memasukkan kredensial 5 kali.`, 'error');
        return;
    }

    const userRaw = document.getElementById('admin-username').value.trim().toLowerCase();
    const passRaw = document.getElementById('admin-password').value;
    const pinRaw = document.getElementById('admin-pin').value.trim();

    if (!/^\d{6}$/.test(pinRaw)) {
        setGuardState('denied', 'PIN_FORMAT', 'ALERT', 'PIN Keamanan wajib berupa 6 digit angka.');
        showAdminAlert('PIN Keamanan harus terdiri dari tepat 6 digit angka (contoh: 000000).', 'error');
        return;
    }

    const cloudApi = window.MochiCloud;
    const accounts = cloudApi ? cloudApi.getAdminAccounts() : [];
    const passHash = cloudApi ? cloudApi.hashAdminSecret(passRaw) : '';
    const pinHash = cloudApi ? cloudApi.hashAdminSecret(pinRaw) : '';

    const matched = accounts.find(a =>
        (String(a.email || '').toLowerCase() === userRaw || String(a.username || '').toLowerCase() === userRaw) &&
        a.passwordHash === passHash &&
        a.pinHash === pinHash
    );

    if (!matched) {
        const fail = getFailState();
        const nextCount = (fail.lockedUntil && Date.now() > fail.lockedUntil ? 0 : fail.count) + 1;
        let lockedUntil = 0;
        if (nextCount >= MAX_FAIL_ATTEMPTS) {
            lockedUntil = Date.now() + LOCKOUT_MS;
        }
        saveFailState({ count: nextCount, lockedUntil });

        if (lockedUntil > 0) {
            setGuardState('denied', 'LOCKED_60S', 'BLOCKED', 'BRUTE-FORCE GUARD AKTIF: Login dikunci 60 detik!');
            showAdminAlert(`Gagal 5 kali berturut-turut! Form login dikunci otomatis selama 60 detik.`, 'error');
        } else {
            const left = MAX_FAIL_ATTEMPTS - nextCount;
            setGuardState('denied', 'ACCESS_DENIED', 'ALERT', 'OTORISASI DITOLAK: Username, Password, atau PIN 6-Digit tidak cocok!');
            showAdminAlert(`Username, Password, atau PIN salah! Sisa percobaan sebelum terkunci: ${left}x.`, 'error');
        }
        return;
    }

    clearFailState();

    const sessionPayload = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        loginAt: new Date().toISOString()
    };

    saveSharedSession(STORAGE_KEY_AUTH_ADMIN, sessionPayload);

    try {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
        logs.unshift({
            time: new Date().toTimeString().split(' ')[0],
            msg: `OTORISASI ADMIN (2FA PIN): "${matched.name}" (${matched.role}) masuk ke Dashboard Backoffice.`,
            type: 'info'
        });
        if (logs.length > 30) logs.pop();
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
        if (cloudApi) cloudApi.pushCollection(STORAGE_KEY_LOGS, logs);
        if (syncChannel) syncChannel.postMessage({ type: 'ADMIN_LOGIN', timestamp: Date.now() });
    } catch (err) {}

    setGuardState('granted', 'ACCESS_GRANTED', 'UNLOCKED', `Selamat bertugas, ${matched.name}! Membuka Dashboard Manajemen Stok...`);
    showAdminAlert(`Otorisasi Password & PIN berhasil! Mengalihkan ke Panel Admin...`, 'success');

    setTimeout(() => {
        window.location.href = ADMIN_PANEL_URL;
    }, 650);
}

function clearAdminSession() {
    removeSharedSession(STORAGE_KEY_AUTH_ADMIN);
    document.getElementById('active-admin-banner').classList.add('hidden');
    showToast('Sesi Admin telah diakhiri.');
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'wf-box-sm px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-mono-tech flex items-center gap-2.5 shadow-lg pointer-events-auto transition-all duration-300';
    toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

window.onload = async function () {
    setGuardState('standby', 'STANDBY', 'LOCKED');

    const activeAdmin = readSharedSession(STORAGE_KEY_AUTH_ADMIN);
    if (isAdminSessionValid(activeAdmin)) {
        document.getElementById('active-admin-name').textContent = `${activeAdmin.name} (${activeAdmin.role})`;
        document.getElementById('active-admin-banner').classList.remove('hidden');
    } else if (activeAdmin) {
        removeSharedSession(STORAGE_KEY_AUTH_ADMIN);
    }

    const cloudApi = window.MochiCloud;
    const badgeEl = document.getElementById('cloud-admin-badge');
    if (cloudApi) {
        const cfg = cloudApi.getCloudConfig();
        if (badgeEl && (cfg.firebaseDatabaseUrl || cfg.googleSheetsWebAppUrl)) {
            badgeEl.textContent = cfg.firebaseDatabaseUrl && cfg.googleSheetsWebAppUrl
                ? 'FIREBASE + SHEETS'
                : (cfg.firebaseDatabaseUrl ? 'FIREBASE CLOUD' : 'GOOGLE SHEETS');
        }
        try {
            await cloudApi.pullAll();
        } catch (err) {}
    }

    lucide.createIcons();
};
