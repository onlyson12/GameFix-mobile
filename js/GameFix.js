// ===============================================================
//                  INISIALISASI FIREBASE
// ===============================================================

// Konfigurasi Firebase Anda.
const firebaseConfig = {
    apiKey: "AIzaSyCRs7NCCfl6odj7j34xGYZdt6wUj3OpBS8",
    authDomain: "gamefik-pro-app.firebaseapp.com",
    projectId: "gamefik-pro-app",
    storageBucket: "gamefik-pro-app.appspot.com",
    messagingSenderId: "37500431220",
    appId: "1:37500431220:web:97df517fbc11b6da119a21"
};
// Inisialisasi aplikasi Firebase.
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===============================================================
//                  MODIFIKASI KODE IKLAN
// ===============================================================

let adShownForSession = false; // Flag untuk memastikan iklan hanya muncul sekali

function showInterstitialAd() {
    if (adShownForSession) return; 

    console.log("Menampilkan iklan interstisial BARU...");
    try {
        // INI ADALAH KODE PEMICU IKLAN YANG BARU
        InterstitialTsAd({
            spot: "98c52e8421eb4b93994b0c3e1b284c81",
            countdown: 15
        });

        adShownForSession = true; 
    } catch (error) {
        // Cek jika error karena library belum termuat
        if (typeof InterstitialTsAd === 'undefined') {
            console.error("Error: Library iklan (interstitial.ts.js) sepertinya belum termuat.");
        } else {
            console.error("Gagal menampilkan iklan:", error);
        }
    }
}


// ===============================================================
//                    URL IKLAN FOTO
// ===============================================================
        
// Kumpulan URL gambar untuk ditampilkan di slider.
const imageUrls = [
    // Ganti URL ini dengan URL gambar Anda (sebaiknya landscape)
    
"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjnP-flqz9LQSZZo2fFoik25VjA0buRN4oC0SJNoebs0uleQWJa8PhxsGp8eI4XsMIlQRHSWzsXQqZkd0bNxtX0mahq_D3BokyYxlML2AW-53Kn1sOjCDUgqe2XMrDUp2AjHj9YUh1lVMmrzzsRtEU61DziDhJOrWEmTntdvMXzDQymM3n2Uy_ZNnTZzGM/s1600/1751363891-picsay3.jpg",


"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj_6w1Ad2LmOn65FBaRZUHotE8gGobaDOZqE-Jfw2OvLF8ksfJznlRQp5kCShkQMu6ZjWfboixhAFatoPD0X2nxCqYX4rE7vAWKwDrZ8QP_bDYNf0yZPlWFH4N-WFeuxpNU1Zf2ajulrgpMQqPpyRYxHiRu4hnTNq_k16t0GKd68EsDGeE-k5hx7QwvtwA/s1600/1751363891-picsay2.jpg",



"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgzfu0zIVCcYHzc_aGJgFaGQGOU3qvzhlCndYHqoMgtqfsqp_qfwyxamVIKFfPVHO7xeHeqmuLeR4xJ_9ttqDAuJ_ipGWl5NkSdYXF44eaTpfmIKkbYjZ3ZqhpsMCEUlnMBjmabkTVVWKGywnkiD2-U1OzLVaz2ioz7QC9fJu7gvsZEKa9DXq32Y2GyZlk/s1600/1751363891-picsay.jpg", 
  
  
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwX1ExZzP9x4M8IKaVswr-rHSNkry-t-NY88_RtnhRqzMsDHLdAOjrq8c&s=10", 
  
  
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTm9ydGF96KjKdUQsGv708eD91TOuf0We4n4ZGkKTJ3Ze3Z2vCNacTlboU&s=10", 
  
    // Tambahkan URL gambar lainnya di sini...
];


        
let users = {}; // Objek untuk menyimpan data pengguna yang sedang aktif.
let globalSettings = {}; // Objek untuk menyimpan pengaturan global dari Firestore.
let currentLoggedInUserKey = null; // Menyimpan ID pengguna yang sedang login.
let isTelegramMode = false; // Flag untuk menandakan apakah aplikasi dibuka via Telegram.

// Variabel terkait status permainan.
let currentGameData = {}; // Menyimpan data game yang sedang dimainkan.
let isGamePlaying = false; // Status apakah game sedang berjalan.
let gameRewardPending = false; // Status apakah reward game tertunda.
let gameCountdownInterval = null; // Interval untuk timer game.
let gameTimeRemaining = 0; // Sisa waktu bermain game.

let confirmCallback = null; // Callback untuk popup konfirmasi.

// Variabel untuk slider iklan.
let currentSlide = 0;
let sliderInterval;
const autoSlideInterval = 5000; // 8 detik per slide.

// Variabel untuk listener Firestore agar bisa dihentikan.
let unsubscribeUser, unsubscribeSettings, unsubscribeNotif;

let currentLeaderboardType = 'dailyEarned'; // Tipe leaderboard default.
const APP_URL = 'https://www.webflik.my.id/2025/06/daily-reward.html'; // URL aplikasi utama untuk link referal.
let achievementsList = {}; // Akan diisi dengan daftar pencapaian dari database.

// ===============================================================
//                  FUNGSI UTAMA & ALUR APLIKASI
// ===============================================================

/**
 * Memeriksa parameter URL untuk kode referal saat aplikasi dimuat.
 */
function handleReferralLinkOnLoad() {
    if (isTelegramMode) return; // Jangan jalankan di mode Telegram
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');
        if (referralCode) {
            // Simpan kode di localStorage untuk diproses setelah login.
            localStorage.setItem('pendingReferralCode', referralCode);
            // Hapus parameter dari URL agar tidak terlihat.
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (e) {
        console.error("Error handling referral link:", e);
    }
}

/**
 * Fungsi yang dijalankan saat halaman dimuat (window.onload).
 * Menginisialisasi alur login berdasarkan platform (Browser atau Telegram).
 */
window.onload = function() {
    handleReferralLinkOnLoad();
    
    // Cek apakah aplikasi dijalankan di dalam Telegram Web App.
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        isTelegramMode = true;
        initializeTelegramLogin();
    } else {
        isTelegramMode = false;
        initializeBrowserLogin();
    }
    
    setupEventListeners(); // Menyiapkan semua event listener yang diperlukan.
};

/**
 * Memulai alur login jika dibuka dari Telegram.
 */
function initializeTelegramLogin() {
    try {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        const tgUser = tg.initDataUnsafe.user;

        if (tgUser && tgUser.id) {
            const userId = tgUser.id.toString();
            const referredByCode = tg.initDataUnsafe.start_param || null;
            startUserSession(userId, { type: 'telegram', data: tgUser }, referredByCode);
            showInterstitialAd(); // PANGGIL IKLAN SAAT MASUK DARI TELEGRAM
        } else {
            handleAccessDenied("Gagal mendapatkan ID Pengguna dari Telegram.");
        }
    } catch (error) {
        console.error("Error saat inisialisasi Telegram:", error);
        handleAccessDenied(error.message);
    }
}

/**
 * Memulai alur login jika dibuka dari browser biasa.
 */
function initializeBrowserLogin() {
    showSection('auth-container'); // Tampilkan form otentikasi.
    document.getElementById('login-form').style.display = 'block';
    
    // Listener status otentikasi dari Firebase.
    auth.onAuthStateChanged(user => {
        if (user) {
            // Jika ada pengguna yang login, mulai sesi.
            startUserSession(user.uid, { type: 'browser', data: user });
            showInterstitialAd(); // PANGGIL IKLAN SAAT AUTO LOGIN
        } else {
            // Jika tidak ada, hentikan sesi.
            stopUserSession();
        }
    });
}

/**
 * Fungsi utama untuk memulai sesi pengguna setelah login berhasil.
 * @param {string} userId - ID unik pengguna.
 * @param {object} authInfo - Informasi otentikasi (tipe dan data).
 * @param {string} telegramReferralCode - Kode referal jika ada dari parameter start Telegram.
 */
async function startUserSession(userId, authInfo, telegramReferralCode = null) {
    currentLoggedInUserKey = userId;
    
    // Hentikan listener sebelumnya untuk menghindari duplikasi.
    if (unsubscribeUser) unsubscribeUser();
    if (unsubscribeSettings) unsubscribeSettings();
    if (unsubscribeNotif) unsubscribeNotif();
    
    // Mulai listener baru untuk pengaturan global, data pengguna, dan notifikasi.
    unsubscribeSettings = db.collection('settings').doc('global').onSnapshot(handleGlobalSettings);
    
    db.collection('achievements').onSnapshot(snapshot => {
        achievementsList = {};
        snapshot.forEach(doc => {
            achievementsList[doc.id] = doc.data();
        });
    });

    // Ambil kode referal dari parameter URL (jika ada)
    const referredByCode = isTelegramMode ? telegramReferralCode : localStorage.getItem('pendingReferralCode');
    
    // Listener untuk data pengguna secara real-time.
    unsubscribeUser = db.collection('users').doc(currentLoggedInUserKey).onSnapshot((doc) => handleUserSnapshot(doc, authInfo, referredByCode));
    
    // Listener untuk notifikasi yang belum dibaca.
    unsubscribeNotif = db.collection('notifications').where('userId', '==', currentLoggedInUserKey).where('read', '==', false).onSnapshot(handleNotificationSnapshot);
}

/**
 * Menghentikan sesi pengguna (saat logout).
 */
function stopUserSession() {
    // Hentikan semua listener.
    if (unsubscribeUser) unsubscribeUser();
    if (unsubscribeSettings) unsubscribeSettings();
    if (unsubscribeNotif) unsubscribeNotif();
    
    // Reset variabel global.
    unsubscribeUser = null;
    unsubscribeSettings = null;
    unsubscribeNotif = null;
    currentLoggedInUserKey = null;
    users = {};
    adShownForSession = false; // Reset flag iklan saat logout
    
    // Kembali ke halaman otentikasi.
    showSection('auth-container');
}

/**
 * Callback yang dipanggil saat data pengguna dari Firestore berubah.
 * @param {object} doc - Dokumen snapshot dari Firestore.
 * @param {object} authInfo - Informasi otentikasi.
 * @param {string} referredByCode - Kode referal jika ada.
 */
async function handleUserSnapshot(doc, authInfo, referredByCode = null) {
    // Cek status maintenance.
    if (globalSettings.maintenance) {
        showMaintenanceScreen();
        return;
    }

    // Jika pengguna baru (dokumen tidak ada).
    if (!doc.exists) {
        const newUser = {
            coins: 0,
            lastLogin: null,
            loginStreak: 0,
            gamesPlayed: 0,
            tasksCompleted: 0,
            paymentMethod: null,
            paymentNumber: null,
            isBanned: false,
            completedTasks: [],
            dailyCheckinClaimedDays: {},
            lastCheckinDate: null,
            checkinStreak: 0,
            totalCoinsEarned: 0,
            dailyEarned: 0,
            weeklyEarned: 0,
            lastEarnedTimestamp: null,
            level: 1,
            xp: 0,
            referralCode: generateReferralCode(),
            referredBy: referredByCode || null,
            referralsCount: 0,
            totalCoinsWithdrawn: 0,
            unlockedAchievements: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (authInfo.type === 'telegram') {
            newUser.username = authInfo.data.first_name || 'User ' + authInfo.data.id;
            newUser.telegram_username = authInfo.data.username || null;
        } else {
            // Ambil username yang disimpan sementara
            const pendingUsername = localStorage.getItem('pendingUsername');

            // Prioritaskan username dari form, baru fallback ke yg lain
            newUser.username = pendingUsername || authInfo.data.displayName || 'Pengguna Baru';
            newUser.email = authInfo.data.email;

            // Setelah digunakan, hapus data sementara agar bersih
            if (pendingUsername) {
                localStorage.removeItem('pendingUsername');
            }
        }

        await db.collection('users').doc(currentLoggedInUserKey).set(newUser);
        
        if (referredByCode) {
            await processReferral(currentLoggedInUserKey, referredByCode);
        }
        
        if (localStorage.getItem('pendingReferralCode')) {
            localStorage.removeItem('pendingReferralCode');
        }
        return;
    }
    
    // Jika pengguna sudah ada.
    const userData = doc.data();
    users[currentLoggedInUserKey] = userData;
    
    // Cek apakah akun diblokir.
    if (userData.isBanned) {
        showBanScreen();
        return;
    }
    // =========================

    hideFullScreenOverlays();
    await checkDailyLoginAndStats();

    // Tampilkan dashboard jika belum terlihat.
    if (document.getElementById('dashboard').style.display === 'none') {
        showSection('dashboard');
        fetchAndRenderContent();
    }

    updateAllViews();
}

/**
 * Memuat konten dinamis seperti game dan tugas.
 */
function fetchAndRenderContent() {
    fetchAndRenderGames();
    fetchAndRenderTasks();
}

// ===============================================================
//                       FUNGSI-FUNGSI FITUR
// ===============================================================

/**
 * Memproses bonus untuk pengguna baru dan pengundangnya.
 * @param {string} newUserId - ID pengguna baru.
 * @param {string} referrerCode - Kode referal dari pengundang.
 */
async function processReferral(newUserId, referrerCode) {
    const bonusAmount = globalSettings.referralBonus || 500;
    const referrerQuery = await db.collection('users').where('referralCode', '==', referrerCode).limit(1).get();

    if (!referrerQuery.empty) {
        const referrerDoc = referrerQuery.docs[0];
        const referrerId = referrerDoc.id;
        const referrerData = referrerDoc.data();
        
        if (referrerId === newUserId) return; // Tidak bisa mereferensikan diri sendiri.
        
        try {
            const newUsername = users[newUserId]?.username || 'user baru';
            // Beri bonus ke pengundang.
            await db.collection('users').doc(referrerId).update({
                coins: firebase.firestore.FieldValue.increment(bonusAmount),
                referralsCount: firebase.firestore.FieldValue.increment(1)
            });
            await logTransaction(`Bonus referal dari ${newUsername}`, bonusAmount, 'credit', referrerId);
            
            // Beri bonus ke pengguna baru.
            await db.collection('users').doc(newUserId).update({
                coins: firebase.firestore.FieldValue.increment(bonusAmount)
            });
            await logTransaction(`Bonus undangan dari ${referrerData.username}`, bonusAmount, 'credit', newUserId);
            
            customAlert("Bonus Referal!", `Selamat! Anda dan teman yang mengundang Anda sama-sama mendapatkan bonus Rp.${bonusAmount.toLocaleString()}!`);
            
            // Cek pencapaian untuk pengundang.
            const updatedReferrerData = { ...referrerData, referralsCount: (referrerData.referralsCount || 0) + 1 };
            await checkAndAwardAchievements(updatedReferrerData, referrerId);

        } catch (error) {
            console.error("Error processing referral bonus:", error);
        }
    }
}

/**
 * Memeriksa apakah pengguna mencapai target untuk membuka pencapaian.
 * @param {object} userData - Data pengguna saat ini.
 * @param {string} userIdToCheck - ID pengguna yang diperiksa (opsional).
 */
async function checkAndAwardAchievements(userData, userIdToCheck) {
    const targetUserId = userIdToCheck || currentLoggedInUserKey;
    const userAchievements = userData.unlockedAchievements || [];

    for (const id in achievementsList) {
        if (!userAchievements.includes(id)) {
            const achievement = achievementsList[id];
            const userValue = userData[achievement.targetField] || 0;
            
            if (userValue >= achievement.targetValue) {
                await db.collection('users').doc(targetUserId).update({
                    unlockedAchievements: firebase.firestore.FieldValue.arrayUnion(id)
                });
                if (targetUserId === currentLoggedInUserKey) {
                    showAchievementUnlockedPopup(achievement);
                }
                await db.collection('notifications').add({
                    userId: targetUserId,
                    message: `Pencapaian Terbuka: ${achievement.title}!`,
                    read: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    }
}

/**
 * Memeriksa apakah pengguna naik level setelah mendapatkan XP.
 * @param {object} userData - Data pengguna saat ini.
 */
async function checkLevelUp(userData) {
    const userRef = db.collection('users').doc(currentLoggedInUserKey);
    const currentLevel = userData.level || 1;
    const currentXp = userData.xp || 0;
    const xpForNextLevel = currentLevel * (globalSettings.xpMultiplier || 100);

    if (currentXp >= xpForNextLevel) {
        const newLevel = currentLevel + 1;
        const newXp = currentXp - xpForNextLevel; // Sisa XP.
        const rewardCoins = newLevel * 50; // Bonus naik level.
        try {
            await userRef.update({
                level: newLevel,
                xp: newXp
            });
            await processCoinGain(rewardCoins, 0, `Bonus Naik ke Level ${newLevel}`);
            customAlert("LEVEL UP!", `Selamat, Anda telah mencapai Level ${newLevel}! Anda mendapatkan bonus Rp.${rewardCoins.toLocaleString()}!`);
        } catch (error) {
            console.error("Error on level up:", error);
        }
    }
}

/**
 * Memberikan reward setelah game selesai dan mereset status.
 */
async function giveRewardAndReset() {
    if (currentLoggedInUserKey && gameRewardPending) {
        const rewardAmount = currentGameData.reward;
        const gameTitle = currentGameData.title;
        const gameId = currentGameData.id;
        
        if (gameId) {
            await db.collection('games').doc(gameId).set({ playCount: firebase.firestore.FieldValue.increment(1) }, { merge: true });
        }

        await processCoinGain(rewardAmount, 25, `Game: ${gameTitle}`, {
            gamesPlayed: firebase.firestore.FieldValue.increment(1)
        });
        gameRewardPending = false;
    }
}

/**
 * Menangani klik pada item tugas.
 * @param {string} taskId - ID tugas.
 * @param {string} taskUrl - URL tujuan tugas.
 * @param {number} reward - Hadiah koin.
 * @param {boolean} isOneTime - Apakah tugas hanya bisa sekali.
 */
async function handleTaskClick(taskId, taskUrl, reward, isOneTime) {
    const user = users[currentLoggedInUserKey];
    if (!user) return;
    
    if (user.completedTasks && user.completedTasks.includes(taskId)) {
        return customAlert("Selesai", "Anda sudah menyelesaikan tugas ini.");
    }
    
    customAlert("Verifikasi Tugas", "Anda akan dialihkan. Selesaikan tugas untuk mendapatkan reward setelah 7 detik.");
    window.open(taskUrl, "_blank");

    setTimeout(async () => {
        let updateData = {
            tasksCompleted: firebase.firestore.FieldValue.increment(1)
        };
        if (isOneTime) {
            updateData.completedTasks = firebase.firestore.FieldValue.arrayUnion(taskId);
        }
        await db.collection('users').doc(currentLoggedInUserKey).update(updateData);
        await processCoinGain(reward, 15, `Tugas: ${taskId.split('_').join(' ')}`);
    }, 7000); // Verifikasi setelah 7 detik.
}

/**
 * Memeriksa dan memperbarui streak login harian pengguna.
 */
async function checkDailyLoginAndStats() {
    if (!currentLoggedInUserKey) return;
    const userRef = db.collection('users').doc(currentLoggedInUserKey);
    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) return;
        
        let userData = userDoc.data();
        const lastLoginTimestamp = userData.lastLogin;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let updates = {};

        if (lastLoginTimestamp) {
            const lastLoginDate = lastLoginTimestamp.toDate();
            lastLoginDate.setHours(0, 0, 0, 0);
            const timeDiff = today.getTime() - lastLoginDate.getTime();
            const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
            
            if (dayDiff === 1) { // Login di hari berikutnya.
                updates.loginStreak = firebase.firestore.FieldValue.increment(1);
                updates.lastLogin = firebase.firestore.Timestamp.now();
            } else if (dayDiff > 1) { // Streak putus.
                updates.loginStreak = 1;
                updates.lastLogin = firebase.firestore.Timestamp.now();
            }
        } else { // Login pertama kali.
            updates.loginStreak = 1;
            updates.lastLogin = firebase.firestore.Timestamp.now();
        }

        if (Object.keys(updates).length > 0) {
            await userRef.update(updates);
            // Cek pencapaian setelah update streak.
            const updatedDoc = await userRef.get();
            await checkAndAwardAchievements(updatedDoc.data());
        }
    } catch (error) {
        console.error("Gagal memeriksa login harian:", error);
    }
}

/**
 * Memproses penambahan koin dan XP, mencatat transaksi, dan memeriksa pencapaian/level up.
 * @param {number} amount - Jumlah koin yang didapat.
 * @param {number} xpGain - Jumlah XP yang didapat.
 * @param {string} description - Deskripsi sumber pendapatan.
 * @param {object} updatedStats - Statistik tambahan yang perlu diupdate (misal: gamesPlayed).
 */
async function processCoinGain(amount, xpGain, description, updatedStats = {}) {
    if (!currentLoggedInUserKey) return;
    const userRef = db.collection('users').doc(currentLoggedInUserKey);

    try {
        let finalUpdatedUserData; // Untuk menyimpan data setelah update
        
        // Gunakan transaksi Firestore untuk memastikan integritas data.
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw "User not found";
            
            const userData = userDoc.data();
            const now = new Date();
            const lastUpdate = userData.lastEarnedTimestamp ? userData.lastEarnedTimestamp.toDate() : null;
            
            // Reset statistik harian/mingguan jika perlu.
            let daily = userData.dailyEarned || 0;
            let weekly = userData.weeklyEarned || 0;
            if (!lastUpdate || lastUpdate.toDateString() !== now.toDateString()) { daily = 0; }
            if (!lastUpdate || getWeekNumber(lastUpdate) !== getWeekNumber(now)) { weekly = 0; }
            
            const updatePayload = {
                ...updatedStats,
                coins: firebase.firestore.FieldValue.increment(amount),
                xp: firebase.firestore.FieldValue.increment(xpGain),
                totalCoinsEarned: firebase.firestore.FieldValue.increment(amount),
                dailyEarned: daily + amount,
                weeklyEarned: weekly + amount,
                lastEarnedTimestamp: firebase.firestore.Timestamp.now()
            };
            
            transaction.update(userRef, updatePayload);
            
            // Simulasikan data yang diupdate untuk pemeriksaan level/achievement.
            finalUpdatedUserData = { ...userData, ...updatedStats, xp: (userData.xp || 0) + xpGain, level: userData.level || 1};
            for(const key in updatedStats) {
                if(updatedStats[key].constructor.name === 'FieldValue') { 
                    finalUpdatedUserData[key] = (userData[key] || 0) + 1; // Increment simulasi
                }
            }
        });
        
        await logTransaction(description, amount, 'credit');
        let message = `Selamat! Anda dapat Rp.${amount.toLocaleString()}`;
        if (xpGain > 0) {
            message += ` dan ${xpGain} XP`;
        }
        message += ` dari ${description}!`;
        showCoinEarnedPopup(message);
        
        // Cek pencapaian dan level up setelah data diperbarui.
        await checkAndAwardAchievements(finalUpdatedUserData); 
        await checkLevelUp(finalUpdatedUserData);

    } catch (error) {
        console.error("Error processing coin/XP gain:", error);
        customAlert("Gagal", "Gagal memproses penambahan koin Anda.");
    }
}

/**
 * Mengklaim hadiah check-in harian.
 */
async function claimDailyReward() {
    if (!currentLoggedInUserKey) return;
    const user = users[currentLoggedInUserKey];
    const today = new Date();
    
    // Cek apakah sudah klaim hari ini.
    if (user.lastCheckinDate && new Date(user.lastCheckinDate).toDateString() === today.toDateString()) {
        return customAlert("Informasi", "Anda sudah klaim reward hari ini!");
    }
    
    const processReward = async () => {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        let isConsecutive = user.lastCheckinDate && new Date(user.lastCheckinDate).toDateString() === yesterday.toDateString();
        const rewards = [100, 120, 140, 160, 180]; // Hadiah untuk hari 1-5.
        const newStreak = isConsecutive ? (user.checkinStreak || 0) + 1 : 1;
        const currentStreakIndex = (newStreak - 1) % rewards.length;
        const rewardAmount = rewards[currentStreakIndex];
        
        // Reset tanda check-in jika streak kembali ke hari pertama.
        const newDailyCheckinDays = (newStreak % rewards.length === 1 && newStreak > 1) ? {} : (user.dailyCheckinClaimedDays || {});
        newDailyCheckinDays[`day_${currentStreakIndex + 1}`] = true;

        // Update data pengguna di Firestore.
        await db.collection('users').doc(currentLoggedInUserKey).update({
            lastCheckinDate: today.toDateString(),
            checkinStreak: newStreak,
            dailyCheckinClaimedDays: newDailyCheckinDays
        });

        // Proses penambahan koin dan XP.
        await processCoinGain(rewardAmount, 10, "Check-in Harian");

        updateCheckinView();
        updateDashboardView();
    };
    
    // Jalankan proses pemberian reward.
    await processReward();
    
    // Coba tampilkan iklan (tidak memblokir reward jika gagal).
    try {
        await show_9454683({
            type: 'inApp',
            inAppSettings: {
                frequency: 1,
                capping: 0.1,
                interval: 0,
                timeout: 0,
                everyPage: true
            }
        });
    } catch (error) {
        console.log("Iklan gagal dimuat, namun reward tetap diberikan.");
    }
}

/**
 * Mengajukan permintaan penarikan dana.
 */
async function submitWithdrawal() {
    if (!currentLoggedInUserKey || !users[currentLoggedInUserKey]) {
        return customAlert("Peringatan", "Anda harus login.");
    }
    const user = users[currentLoggedInUserKey];
    const amount = parseInt(document.getElementById("amount").value);
    const minWd = globalSettings.minimumWithdrawal || 100000;
    
    // Validasi input.
    if (!user.paymentMethod || !user.paymentNumber) {
        return customAlert("Error", "Metode penarikan belum diatur.");
    }
    if (isNaN(amount) || amount < minWd) {
        return customAlert("Peringatan", `Minimal penarikan Rp.${minWd.toLocaleString()}.`);
    }
    if (amount > user.coins) {
        return customAlert("Peringatan", `Uang tidak cukup.`);
    }
    
    // Konfirmasi sebelum melanjutkan.
    customConfirm(`Tarik Rp.${amount.toLocaleString()} ke ${user.paymentMethod.toUpperCase()} (${user.paymentNumber})?`, async () => {
        try {
            const withdrawalRef = db.collection('withdrawals').doc();
            let updatedUserData;

            // Gunakan transaksi untuk mengurangi koin dan mencatat penarikan secara atomik.
            await db.runTransaction(async (transaction) => {
                const userRef = db.collection('users').doc(currentLoggedInUserKey);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error("User tidak ditemukan.");
                
                const currentData = userDoc.data();
                const currentCoins = currentData.coins || 0;
                if (amount > currentCoins) throw new Error("Saldo tidak cukup.");

                const totalWithdrawn = (currentData.totalCoinsWithdrawn || 0) + amount;
                updatedUserData = { ...currentData, totalCoinsWithdrawn: totalWithdrawn };

                // Kurangi koin pengguna dan update total penarikan.
                transaction.update(userRef, {
                    coins: currentCoins - amount,
                    totalCoinsWithdrawn: totalWithdrawn
                });
                
                // Buat dokumen baru di koleksi 'withdrawals'.
                transaction.set(withdrawalRef, {
                    userId: currentLoggedInUserKey,
                    username: user.username,
                    amount: amount,
                    paymentMethod: user.paymentMethod,
                    accountNumber: user.paymentNumber,
                    status: 'Pending', // Status awal.
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await logTransaction(`Penarikan ke ${user.paymentMethod}`, amount, 'debit');
            await checkAndAwardAchievements(updatedUserData); 
            document.getElementById("amount").value = "";
            showWithdrawalSuccessPopup();
        } catch (error) {
            customAlert("Gagal", error.message);
        }
    });
}


// ===============================================================
//                         FUNGSI TAMPILAN (VIEW)
// ===============================================================

/**
 * Fungsi sentral untuk menampilkan bagian/halaman tertentu dan menyembunyikan yang lain.
 * @param {string} sectionId - ID dari kontainer yang ingin ditampilkan.
 */
function showSection(sectionId) {
    const sections = ["dashboard", "tugas-container", "tarik-container", "profil-container", "auth-container", "telegram-login-container", "riwayat-container", "peringkat-container", "penarikan-riwayat-container", "offerwall-container"];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'flex';
    }
    
    // Tampilkan/sembunyikan navigasi bawah berdasarkan halaman.
    const isAuthSection = sectionId === 'auth-container' || sectionId === 'telegram-login-container';
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = isAuthSection ? 'none' : 'flex';
    }
    
    // Inisialisasi slider hanya saat dashboard pertama kali ditampilkan.
    if (sectionId === 'dashboard' && !document.querySelector('.ads-container').dataset.initialized) {
        initializeSlider();
        document.querySelector('.ads-container').dataset.initialized = 'true';
    }
    
    // Muat data untuk halaman tertentu saat dibuka.
    if (sectionId === 'riwayat-container') { updateHistoryView(); }
    if (sectionId === 'peringkat-container') { updateLeaderboardView(currentLeaderboardType); }
    if (sectionId === 'penarikan-riwayat-container') { updateWithdrawalHistoryView(); }
    
    // Atur status 'active' pada item navigasi bawah.
    if (!isAuthSection) {
        document.querySelectorAll(".bottom-nav .nav-item").forEach(item => item.classList.remove("active"));
        let navItemId = sectionId.replace('-container', '');
        if (sectionId === 'penarikan-riwayat-container') navItemId = 'profil';
        if (sectionId === 'offerwall-container') navItemId = 'tugas';
        const navItem = document.getElementById(`nav-${navItemId}`);
        if (navItem) navItem.classList.add("active");
    }
}

/**
 * Memperbarui semua tampilan yang bergantung pada data pengguna.
 */
function updateAllViews() {
    updateDashboardView();
    updateCheckinView();
    updateTarikView();
    updateProfileView();
}

/**
 * Memperbarui tampilan dashboard (username dan koin).
 */
function updateDashboardView() {
    // --- Kode untuk Header Lama (Biarkan saja jika ingin sebagai cadangan) ---
    const usernameEl = document.getElementById("dashboardUsername");
    const coinsEl = document.getElementById("dashboardCoins");
    if (usernameEl && coinsEl && currentLoggedInUserKey && users[currentLoggedInUserKey]) {
        const user = users[currentLoggedInUserKey];
        usernameEl.textContent = user.username;
        coinsEl.textContent = `Pendapatan : Rp.${(user.coins || 0).toLocaleString()}`;
    }

    // --- Kode untuk Header Baru ---
    const headerBaruUsernameEl = document.getElementById("headerBaruUsername");
    const headerBaruLevelEl = document.getElementById("headerBaruLevel");
    const headerBaruCoinsEl = document.getElementById("headerBaruCoins");
    if (headerBaruUsernameEl && headerBaruLevelEl && headerBaruCoinsEl && currentLoggedInUserKey && users[currentLoggedInUserKey]) {
        const user = users[currentLoggedInUserKey];
        headerBaruUsernameEl.textContent = user.username;
        headerBaruLevelEl.textContent = `Lv. ${user.level || 1}`;
        headerBaruCoinsEl.textContent = `Rp.${(user.coins || 0).toLocaleString()}`;
    }
}
        
/**
 * Memperbarui tampilan halaman profil.
 */
function updateProfileView() {
    const user = users[currentLoggedInUserKey];
    if (!user) return;
    
    // Info dasar
    document.getElementById("profileUsername").textContent = user.username;
    if (isTelegramMode) {
        document.getElementById("profileEmail").textContent = user.telegram_username ? `@${user.telegram_username}` : `ID: ${currentLoggedInUserKey}`;
    } else {
        document.getElementById("profileEmail").textContent = user.email || `ID: ${currentLoggedInUserKey}`;
    }
    
    // XP dan Level
    const currentLevel = user.level || 1;
    const currentXp = user.xp || 0;
    const xpForNextLevel = currentLevel * (globalSettings.xpMultiplier || 100);
    document.getElementById('profileLevel').textContent = `Level ${currentLevel}`;
    document.getElementById('profileXpProgress').textContent = `${currentXp.toLocaleString()} / ${xpForNextLevel.toLocaleString()} XP`;
    const xpPercentage = Math.min((currentXp / xpForNextLevel) * 100, 100);
    document.getElementById('profileXpBar').style.width = `${xpPercentage}%`;

    // Statistik
    document.getElementById("statTotalGame").textContent = (user.gamesPlayed || 0).toLocaleString();
    document.getElementById("statHariAktif").textContent = (user.loginStreak || 0).toLocaleString();
    document.getElementById("statTotalKoin").textContent = `Rp.${(user.totalCoinsEarned || 0).toLocaleString()}`;
    document.getElementById("statKoinDitarik").textContent = `Rp.${(user.totalCoinsWithdrawn || 0).toLocaleString()}`;
    
    // Kode Referal
    document.getElementById('referral-code-display').textContent = user.referralCode || '...';
    document.querySelector("#referral-card p.text-gray-400").textContent = `Undang teman dan dapatkan bonus Rp.${(globalSettings.referralBonus || 500).toLocaleString()} untuk kalian berdua!`;

    // Galeri Pencapaian
    const galleryContainer = document.getElementById('achievement-gallery-container');
    let galleryHtml = '';
    const userAchievements = user.unlockedAchievements || [];
    for (const id in achievementsList) {
        const achievement = achievementsList[id];
        const isUnlocked = userAchievements.includes(id);
        galleryHtml += `
            <div class="achievement-item text-center">
                <div class="achievement-badge ${isUnlocked ? 'unlocked' : ''}">
                    <i class="fas ${achievement.icon}"></i>
                </div>
                <h4 class="achievement-title ${isUnlocked ? 'text-white' : 'text-gray-400'}">${achievement.title}</h4>
                <p class="achievement-description">${achievement.description}</p>
            </div>`;
    }
    galleryContainer.innerHTML = galleryHtml || '<p class="text-xs text-gray-400 col-span-full text-center">Belum ada data pencapaian.</p>';

    // Informasi Pembayaran
    const paymentCard = document.getElementById('payment-info-card');
    if (user.paymentMethod && user.paymentNumber) {
        const maskedNumber = user.paymentNumber.length > 8 ? user.paymentNumber.slice(0, 4) + 'XXXX' + user.paymentNumber.slice(-4) : user.paymentNumber;
        paymentCard.innerHTML = `<div class="flex justify-between items-center"><div><h2 class="text-white font-semibold text-lg">Informasi Penarikan</h2><div class="flex items-center mt-2"><img src="${getPaymentLogoUrl(user.paymentMethod)}" class="w-12 h-8 mr-3 bg-white p-1 rounded-md object-contain"><div><p class="text-white font-semibold">${user.paymentMethod.replace(/_/g, ' ').toUpperCase()}</p><p class="text-gray-400">${maskedNumber}</p></div></div></div><button class="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 px-4 rounded-lg" onclick="openPaymentSetupPopup()">Ganti</button></div>`;
    } else {
        paymentCard.innerHTML = `<h2 class="text-white font-semibold text-lg mb-2">Informasi Penarikan</h2><p class="text-gray-400 text-sm mb-4">Atur metode penarikan Anda.</p><button class="button primary w-full" onclick="openPaymentSetupPopup()">Atur Metode Penarikan</button>`;
    }

    // Tombol Aksi di Profil
    const actionButtonsContainer = document.getElementById('action-buttons');
    let buttonsHtml = `<button class="button secondary" onclick="showSection('riwayat-container')"><i class="fas fa-history mr-2"></i>Riwayat Transaksi</button>`;
    
    buttonsHtml += `<button class="button primary" style="background: var(--danger-red);" onclick="confirmDeleteData()">Hapus Akun</button>`;
    if (!isTelegramMode) {
        buttonsHtml += `<button class="button secondary" onclick="handleLogout()">Keluar (Logout)</button>`;
    }
    actionButtonsContainer.innerHTML = buttonsHtml;
}

/**
 * Memperbarui tampilan halaman penarikan.
 */
function updateTarikView() {
    const user = users[currentLoggedInUserKey];
    if (!user) return;
    
    const tarikContainer = document.getElementById('tarik-content-container');
    const minWd = globalSettings.minimumWithdrawal || 5000;
    
    if (user.paymentMethod && user.paymentNumber) {
        // Tampilan jika metode pembayaran sudah diatur (DESAIN BARU)
        const formattedNumber = user.paymentNumber.replace(/(.{4})/g, '$1 ').trim(); // Memformat nomor
        
        tarikContainer.innerHTML = `
        <div class="withdraw-page-container">
    <div class="credit-card-widget">
        <div class="credit-card-content">
            <div class="card-header">
                <span class="bank-name">${user.paymentMethod.toUpperCase()}</span>
                <div class="card-chip">
                    ${getPaymentLogo(user.paymentMethod)}
                </div>
            </div>
            <div class="card-body">
                        <div class="account-number">${formattedNumber}</div>
                        <div class="balance">Saldo Anda: Rp.${user.coins.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <form class="withdraw-form" onsubmit="event.preventDefault(); submitWithdrawal();">
                <div class="input-group">
                    <input class="w-full" id="amount" placeholder="Min. Rp.${minWd.toLocaleString()}" type="number" min="${minWd}">
                </div>
                <button class="button primary w-full" type="submit">Ajukan Penarikan</button>
            </form>

            <div class="withdraw-notes">
                <p class="font-semibold text-gray-300">Catatan:</p>
                <ul>
                    <li>Proses penarikan 1-3 hari kerja</li>
                    <li>Pastikan data tujuan penarikan sudah benar</li>
                </ul>
            </div>

            <div class="withdraw-history-section">
                <h2>Riwayat Penarikan Terbaru</h2>
                <div id="withdraw-history-on-page" class="history-list w-full">
                    </div>
            </div>
        </div>
        `;
        // Panggil fungsi untuk mengisi riwayat penarikan ke container baru
        updateWithdrawalHistoryView('withdraw-history-on-page');

    } else {
        // Tampilan jika metode pembayaran belum diatur (tetap sama).
        tarikContainer.innerHTML = `
            <section class="w-full">
                <div class="text-center p-6 rounded-2xl" style="background-color: #2e2c44;">
                    <i class="fas fa-wallet text-5xl text-purple-400 mb-4"></i>
                    <h2 class="text-white font-semibold text-xl mb-2">Atur Tujuan Penarikan</h2>
                    <p class="text-gray-400 mb-6">Anda perlu mengatur metode penarikan di halaman Profil.</p>
                    <button class="button primary w-full" onclick="showSection('profil-container')">Pergi ke Profil</button>
                </div>
            </section>`;
    }
}
        
/**
 * Memperbarui tampilan kartu check-in harian.
 */
function updateCheckinView() {
    if (!currentLoggedInUserKey || !users[currentLoggedInUserKey]) return;
    const user = users[currentLoggedInUserKey];
    const lastCheckinString = user.lastCheckinDate;
    const todayString = new Date().toDateString();

    const dayItems = document.querySelectorAll("#tugas-container .checkin-day-item");
    const claimButton = document.getElementById("claimDailyRewardButton");
    const streakText = document.getElementById("checkinStreakText");

    // Reset tampilan hari
    dayItems.forEach(item => {
        const circle = item.querySelector(".w-10.h-10");
        circle.classList.remove("bg-purple-600", "text-white", "border-2", "border-white", "bg-green-500");
        circle.classList.add("bg-[#5A6470]", "text-white");
        item.classList.remove("checked");
    });

    // Tandai hari yang sudah diklaim
    const rewards = [100, 120, 140, 160, 180];
    for (let i = 0; i < rewards.length; i++) {
        const dayKey = `day_${i + 1}`;
        if (user.dailyCheckinClaimedDays && user.dailyCheckinClaimedDays[dayKey]) {
             if(dayItems[i]) {
                dayItems[i].classList.add("checked");
                dayItems[i].querySelector(".w-10.h-10").classList.remove("bg-[#5A6470]");
                dayItems[i].querySelector(".w-10.h-10").classList.add("bg-green-500", "text-white");
             }
        }
    }
    
    streakText.textContent = `Streak: ${user.checkinStreak || 0} hari berturut-turut`;
    
    // Tentukan hari berikutnya untuk klaim
    let nextClaimIndex = (user.checkinStreak || 0) % rewards.length;
    const nextReward = rewards[nextClaimIndex] || rewards[rewards.length - 1];

    // Atur status tombol klaim
    if (!lastCheckinString || new Date(lastCheckinString).toDateString() !== todayString) {
        // Belum klaim hari ini
        claimButton.disabled = false;
        claimButton.textContent = `Klaim Reward Hari ke-${(user.checkinStreak % rewards.length) + 1} (+Rp.${nextReward})`;
        if (dayItems[nextClaimIndex]) {
            dayItems[nextClaimIndex].querySelector(".w-10.h-10").classList.remove("bg-[#5A6470]");
            dayItems[nextClaimIndex].querySelector(".w-10.h-10").classList.add("bg-purple-600", "text-white", "border-2", "border-white");
        }
    } else {
        // Sudah klaim hari ini
        claimButton.disabled = true;
        claimButton.textContent = "Sudah Diklaim Hari Ini";
         let lastClaimedIndex = ((user.checkinStreak || 1) - 1) % rewards.length;
         if (dayItems[lastClaimedIndex]) {
             dayItems[lastClaimedIndex].querySelector(".w-10.h-10").classList.remove("bg-[#5A6470]");
             dayItems[lastClaimedIndex].querySelector(".w-10.h-10").classList.add("bg-green-500", "text-white");
             dayItems[lastClaimedIndex].classList.add("checked");
         }
    }
}
        
/**
 * Memuat dan menampilkan daftar game dari Firestore.
 */
async function fetchAndRenderGames() {
    const container = document.getElementById('game-list-container');
    if (!container) return;
    // Tampilkan skeleton loader.
    container.innerHTML = Array(6).fill('<div class="game-item"><div class="skeleton-icon" style="width:100%; height:80px; border-radius:10px; margin-bottom:5px;"></div><div class="skeleton-text long"></div><div class="skeleton-text short"></div></div>').join('');
    try {
        const snapshot = await db.collection('games').orderBy('title').get();
        if (snapshot.empty) {
            container.innerHTML = `<p class="text-center text-gray-400 col-span-full">Belum ada game.</p>`;
            return;
        }
        let gamesHtml = '';
        snapshot.forEach(doc => {
            const game = { id: doc.id, ...doc.data() };
            gamesHtml += `
                <div class="game-item" data-id="${game.id}" data-game-url="${game.gameUrl}" data-reward-coins="${game.reward}" data-min-duration="${game.duration}" data-title="${game.title}">
                    <img src="${game.iconUrl}" alt="${game.title}" onerror="this.src='https://placehold.co/105x80/21262d/c9d1d9?text=X'">
                    <h3>${game.title}</h3>
                    <p>Reward: <span class="reward">+Rp.${game.reward.toLocaleString()}</span></p>
                    <p class="duration">Durasi: ${game.duration / 60} menit</p>
                </div>`;
        });
        container.innerHTML = gamesHtml;
        initializeGameItems();
    } catch (error) {
        console.error("Error fetching games:", error);
        container.innerHTML = `<p class="text-center text-red-400 col-span-full">Gagal memuat game.</p>`;
    }
}

/**
 * Memuat dan menampilkan daftar tugas dari Firestore.
 */
async function fetchAndRenderTasks() {
    const container = document.getElementById('other-tasks-list');
    if (!container) return;
    const user = users[currentLoggedInUserKey];
    if (!user) return;
    // Tampilkan skeleton loader.
    container.innerHTML = Array(3).fill('<div class="skeleton-loader"><div class="skeleton-icon"></div><div style="flex-grow:1;"><div class="skeleton-text long"></div><div class="skeleton-text short"></div></div></div>').join('');
    try {
        const snapshot = await db.collection('tasks').get();
        if (snapshot.empty) {
            container.innerHTML = `<p class="text-center text-gray-400">Belum ada tugas.</p>`;
            return;
        }
        let tasksHtml = '';
        snapshot.forEach(doc => {
            const task = { id: doc.id, ...doc.data() };
            const isCompleted = user.completedTasks && user.completedTasks.includes(task.id);
            tasksHtml += `
                <div class="task-item ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}" ${!isCompleted ? `onclick="handleTaskClick('${task.id}', '${task.taskUrl}', ${task.reward}, ${task.isOneTime})"` : ''}>
                    <img src="${task.iconUrl}" alt="${task.title}" class="task-icon" onerror="this.src='https://placehold.co/40x40/333/c9d1d9?text=X'">
                    <div class="task-details">
                        <p class="task-title">${task.title}</p>
                        <p class="task-reward">+Rp.${task.reward.toLocaleString()}</p>
                    </div>
                    <i class="fas ${isCompleted ? "fa-check-circle" : "fa-chevron-right"} task-arrow" style="color: ${isCompleted ? "#28a745" : "white"};"></i>
                </div>`;
        });
        container.innerHTML = tasksHtml;
    } catch (error) {
        console.error("Error fetching tasks:", error);
        container.innerHTML = `<p class="text-center text-red-400">Gagal memuat tugas.</p>`;
    }
}

/**
 * Memperbarui tampilan riwayat transaksi.
 */
async function updateHistoryView() {
    if (!currentLoggedInUserKey) return;
    const container = document.getElementById('history-list-container');
    container.innerHTML = Array(5).fill('<div class="skeleton-loader"><div class="skeleton-icon"></div><div style="flex-grow:1;"><div class="skeleton-text long"></div><div class="skeleton-text short"></div></div></div>').join('');
    try {
        const snapshot = await db.collection('transactions').where('userId', '==', currentLoggedInUserKey).orderBy('timestamp', 'desc').limit(30).get();
        if (snapshot.empty) {
            container.innerHTML = `<p class="text-center text-gray-400 mt-8">Belum ada riwayat transaksi.</p>`;
            return;
        }
        let historyHtml = '';
        snapshot.forEach(doc => {
            const tx = doc.data();
            const isCredit = tx.type === 'credit';
            const iconClass = isCredit ? 'fa-arrow-down' : 'fa-arrow-up';
            const amountClass = isCredit ? 'credit' : 'debit';
            const sign = isCredit ? '+' : '-';
            const date = tx.timestamp ? new Date(tx.timestamp.seconds * 1000).toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Baru saja';
            historyHtml += `
                <div class="history-item">
                    <div class="history-icon ${amountClass}"><i class="fas ${iconClass}"></i></div>
                    <div class="history-details">
                        <p class="history-description">${tx.description}</p>
                        <p class="history-date">${date}</p>
                    </div>
                    <div class="history-amount ${amountClass}">${sign}Rp.${tx.amount.toLocaleString()}</div>
                </div>`;
        });
        container.innerHTML = historyHtml;
    } catch (error) {
        console.error("Gagal memuat riwayat transaksi:", error);
        container.innerHTML = `<p class="text-center text-red-500 mt-8">Gagal memuat riwayat. Coba lagi nanti.</p>`;
    }
}

/**
 * Memperbarui tampilan riwayat penarikan.
 */
async function updateWithdrawalHistoryView(containerId = 'withdrawal-history-list-container') {
    if (!currentLoggedInUserKey) return;
    const container = document.getElementById(containerId);
    // Cek apakah container ditemukan
    if (!container) {
        console.error(`Container riwayat dengan ID '${containerId}' tidak ditemukan.`);
        return;
    }
    
    container.innerHTML = Array(3).fill('<div class="skeleton-loader">...</div>').join('');
    try {
        const snapshot = await db.collection('withdrawals').where('userId', '==', currentLoggedInUserKey).orderBy('timestamp', 'desc').limit(5).get(); // Dibatasi 5 riwayat terbaru
        if (snapshot.empty) {
            container.innerHTML = `<p class="text-center text-gray-400 mt-4">Belum ada riwayat penarikan.</p>`;
            return;
        }
        let historyHtml = '';
        snapshot.forEach(doc => {
            const wd = doc.data();
            const status = wd.status || 'Pending';
            const statusClass = `status-${status.toLowerCase()}`;
            const date = wd.timestamp ? new Date(wd.timestamp.seconds * 1000).toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : 'Baru saja';
            historyHtml += `
                <div class="history-item withdrawal-item">
                    <div class="withdrawal-item-header">
                        <span class="withdrawal-item-amount">Rp.${wd.amount.toLocaleString()}</span>
                        <span class="status-badge ${statusClass}">${status}</span>
                    </div>
                    <div class="withdrawal-item-footer">
                        <span class="withdrawal-item-method">${wd.paymentMethod.toUpperCase()}</span>
                        <span class="history-date">${date}</span>
                    </div>
                </div>`;
        });
        container.innerHTML = historyHtml;
    } catch (error) {
        console.error("Gagal memuat riwayat penarikan:", error);
        container.innerHTML = `<p class="text-center text-red-500 mt-4">Gagal memuat riwayat.</p>`;
    }
}

/**
 * Memperbarui tampilan papan peringkat.
 * @param {string} type - Tipe peringkat (dailyEarned, weeklyEarned, totalCoinsEarned).
 */
async function updateLeaderboardView(type) {
    const podiumContainer = document.getElementById('podium-container');
    const listContainer = document.getElementById('leaderboard-list-container');
    const userRankContainer = document.getElementById('current-user-rank-container');
    
    // URL Gambar podium Anda. Taruh di sini agar mudah diganti.
    const podiumImageUrl = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7CU5N-W16bxlHlBvYmg7LeFFavowj4hK8UCg-BTugu-QwtauzcoUPxMx8ls4VZd6I5rfO1q_nVxU0rAsabHn257-5MRfjkbOauLQKrvJDdPcOAMqdXQyLmBXcnDfMyN3HabOiWwUaV6wZYWP_Ls6XBw2zKBRfSGFXuTQUfmhdRZ0ehWnj5t3eb3sBuqI/s1600/20250627_133120.png'; 

    if (!podiumContainer || !listContainer) {
        console.error("Elemen #podium-container atau #leaderboard-list-container tidak ditemukan di HTML!");
        return;
    }

    podiumContainer.innerHTML = '<div style="height: 200px; display:flex; justify-content:center; align-items:center;"><p class="text-gray-400">Memuat Peringkat...</p></div>';
    listContainer.innerHTML = Array(7).fill('<div class="skeleton-loader">...</div>').join('');
    if (userRankContainer) userRankContainer.style.display = 'none';

    try {
        const query = db.collection('users').orderBy(type, 'desc').limit(100);
        const snapshot = await query.get();

        if (snapshot.empty) {
            podiumContainer.innerHTML = `<img src="${podiumImageUrl}" class="podium-image" alt="Podium Kosong"><div style="position:absolute; top:40%; left:50%; transform:translateX(-50%); color:white; text-align:center;">Belum ada Peringkat</div>`;
            listContainer.innerHTML = '';
            return;
        }

        let podiumUsersHtml = '';
        let listHtml = '';
        let userRank = -1;
        let userFound = false;

        snapshot.docs.forEach((doc, index) => {
            const rank = index + 1;
            const userData = { id: doc.id, ...doc.data() };
            const score = userData[type] || 0;
            const userPicInitial = (userData.username || 'U').charAt(0).toUpperCase();

            if (rank >= 1 && rank <= 3) {
                podiumUsersHtml += `
                    <div class="podium-user podium-rank-${rank}">
                        <div class="leaderboard-user-pic">${userPicInitial}</div>
                        <p class="leaderboard-username">${userData.username}</p>
                        <p class="leaderboard-score">Rp.${score.toLocaleString()}</p>
                    </div>
                `;
            } else {
                listHtml += `
                    <div class="leaderboard-item">
                        <span class="leaderboard-rank">#${rank}</span>
                        <div class="leaderboard-user-pic">${userPicInitial}</div>
                        <div class="leaderboard-details">
                            <p class="leaderboard-username">${userData.username}</p>
                            <p class="leaderboard-score">Rp.${score.toLocaleString()}</p>
                        </div>
                    </div>`;
            }

            if (userRankContainer && userData.id === currentLoggedInUserKey) {
                userRank = rank;
                userFound = true;
                userRankContainer.innerHTML = `
                    <div class="flex items-center">
                        <span class="leaderboard-rank font-bold">#${userRank}</span>
                        <div class="leaderboard-details text-left">
                            <p class="leaderboard-username font-bold">Peringkat Anda</p>
                            <p class="leaderboard-score font-bold text-white">Rp.${score.toLocaleString()}</p>
                        </div>
                    </div>`;
                userRankContainer.style.display = 'block';
            }
        });

        // Gabungkan gambar podium DENGAN profil user
        podiumContainer.innerHTML = `
            <img src="${podiumImageUrl}" class="podium-image" alt="Podium Peringkat">
            ${podiumUsersHtml}
        `;
        listContainer.innerHTML = listHtml;

        if (userRankContainer && !userFound) {
            userRankContainer.innerHTML = `<p class="text-center font-semibold">Anda belum masuk peringkat.</p>`;
            userRankContainer.style.display = 'block';
        }
    } catch (error) {
        console.error(`Gagal memuat papan peringkat (${type}):`, error);
        podiumContainer.innerHTML = `<p class="text-center text-red-500 mt-8">Gagal memuat peringkat.</p>`;
        listContainer.innerHTML = '';
    }
}

// ===============================================================
//                         FUNGSI OTENTIKASI
// ===============================================================

function toggleAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (loginForm.style.display === 'block') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }
}

function handleEmailRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const referralCode = document.getElementById('registerReferralCode').value.trim(); 

    if (!username || !email || password.length < 6) {
        return customAlert("Error", "Mohon isi semua field dengan benar. Password minimal 6 karakter.");
    }

    localStorage.setItem('pendingUsername', username);

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const newUser = userCredential.user;
            if (referralCode) {
                localStorage.setItem('pendingReferralCode', referralCode);
            }
            showInterstitialAd(); // PANGGIL IKLAN SAAT DAFTAR
            return newUser.updateProfile({ displayName: username });
        })
        .catch(error => {
            localStorage.removeItem('pendingReferralCode');
            localStorage.removeItem('pendingUsername');
            customAlert("Gagal Mendaftar", error.message);
        });
}

function handleEmailLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
        return customAlert("Error", "Mohon isi email dan password.");
    }
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showInterstitialAd(); // PANGGIL IKLAN SAAT LOGIN
        })
        .catch(error => {
            customAlert("Gagal Masuk", error.message);
        });
}

function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => {
            showInterstitialAd(); // PANGGIL IKLAN SAAT LOGIN DENGAN GOOGLE
        })
        .catch(error => {
            customAlert("Gagal Masuk dengan Google", error.message);
        });
}

function handleLogout() {
    customConfirm("Anda yakin ingin keluar?", () => {
        auth.signOut();
    });
}

// ===============================================================
//                          FUNGSI GAME
// ===============================================================
        
function initializeGameItems() {
    document.querySelectorAll(".game-item").forEach(item => {
        item.onclick = function() {
            const gameData = this.dataset;
            currentGameData = {
                id: gameData.id,
                url: gameData.gameUrl,
                reward: parseInt(gameData.rewardCoins),
                duration: parseInt(gameData.minDuration),
                title: gameData.title
            };

            const iframe = document.getElementById("game-iframe");
            const wrapper = document.getElementById("game-iframe-wrapper");
            const titleEl = document.getElementById("game-iframe-title");
            const bottomNav = document.getElementById("bottom-nav");

            iframe.src = gameData.gameUrl;
            titleEl.textContent = gameData.title;
            wrapper.style.display = "flex";
            bottomNav.style.display = "none";
            isGamePlaying = true;
            gameRewardPending = false;
            startGameSession();
        }
    });
}

async function startGameSession() {
    clearTimeout(gameCountdownInterval);
    gameTimeRemaining = currentGameData.duration;
    updateTimerDisplay();
    
    gameCountdownInterval = setInterval(async () => {
        gameTimeRemaining--;
        updateTimerDisplay();
        if (gameTimeRemaining <= 0) {
            clearInterval(gameCountdownInterval);
            if (isGamePlaying) {
                gameRewardPending = true;
                showGameRewardPopup();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.getElementById("game-timer-display");
    if (timerEl) {
        if (!(gameTimeRemaining > 0)) {
            timerEl.textContent = "00:00";
            return;
        }
        const minutes = Math.floor(gameTimeRemaining / 60).toString().padStart(2, "0");
        const seconds = (gameTimeRemaining % 60).toString().padStart(2, "0");
        timerEl.textContent = `${minutes}:${seconds}`;
    }
}
        
function closeGameIframe() {
    if (isGamePlaying && gameTimeRemaining > 0) {
        customConfirm("Reward tidak akan diberikan jika keluar sebelum waktunya. Tetap keluar?", forceCloseGameIframe);
    } else {
        forceCloseGameIframe();
    }
}

function forceCloseGameIframe() {
    const wrapper = document.getElementById("game-iframe-wrapper");
    const iframe = document.getElementById("game-iframe");
    const bottomNav = document.getElementById("bottom-nav");
    
    iframe.src = "about:blank"; // Hentikan game
    wrapper.style.display = "none";
    bottomNav.style.display = "flex";
    clearInterval(gameCountdownInterval);
    isGamePlaying = false;
    gameRewardPending = false;
    gameTimeRemaining = 0;
    updateDashboardView();
}

async function continuePlayingAndGetReward() {
    if (gameRewardPending) await giveRewardAndReset();
    closeGameRewardPopup();
    await startGameSession();
}

async function returnToDashboard() {
    if (gameRewardPending) await giveRewardAndReset();
    closeGameRewardPopup();
    forceCloseGameIframe();
}


// ===============================================================
//                  FUNGSI KOMPONEN UI & EVENT
// ===============================================================

/**
 * Menyiapkan semua event listener utama aplikasi.
 */
function setupEventListeners() {
    document.getElementById('continuePlayingButton').addEventListener('click', continuePlayingAndGetReward);
    document.getElementById('returnToDashboardButton').addEventListener('click', returnToDashboard);
    document.getElementById('custom-confirm-yes').onclick = function() {
        if (confirmCallback) confirmCallback();
        closeCustomConfirm();
    };
    document.getElementById('custom-confirm-no').onclick = function() {
        closeCustomConfirm();
    };
}
        
function confirmDeleteData() {
    customConfirm("Anda yakin ingin menghapus semua data Anda? Tindakan ini tidak dapat diurungkan.", async function() {
        if (currentLoggedInUserKey) {
            try {
                await db.collection('users').doc(currentLoggedInUserKey).delete();
                customAlert("Berhasil", "Data Anda telah dihapus.");
                if (!isTelegramMode) {
                    handleLogout();
                } else {
                    setTimeout(() => { window.location.reload() }, 2000);
                }
            } catch (e) {
                customAlert("Gagal", "Terjadi kesalahan saat menghapus data.");
            }
        }
    });
}
        
function openPaymentSetupPopup() {
    const user = users[currentLoggedInUserKey];
    if (!user) return;
    document.getElementById('popupPaymentMethod').value = user.paymentMethod || "";
    document.getElementById('popupAccountNumber').value = user.paymentNumber || "";
    document.getElementById('payment-setup-popup-overlay').classList.add('active');
}

function closePaymentSetupPopup() {
    document.getElementById('payment-setup-popup-overlay').classList.remove('active');
}

async function savePaymentMethod() {
    const user = users[currentLoggedInUserKey];
    if (!user) return;
    const method = document.getElementById('popupPaymentMethod').value;
    const number = document.getElementById('popupAccountNumber').value;
    if (!method) return customAlert("Peringatan", "Pilih metode pembayaran.");
    if (!number || !/^\d+$/.test(number) || number.length < 8) return customAlert("Peringatan", "Nomor tidak valid.");
    
    await db.collection('users').doc(currentLoggedInUserKey).update({
        paymentMethod: method,
        paymentNumber: number
    });
    customAlert("Berhasil", "Informasi penarikan disimpan!");
    closePaymentSetupPopup();
}

function switchLeaderboardTab(tabElement, type) {
    document.querySelectorAll('.leaderboard-tab').forEach(tab => tab.classList.remove('active'));
    tabElement.classList.add('active');
    currentLeaderboardType = type;
    updateLeaderboardView(type);
}
        
function showReferralPopup() {
    const user = users[currentLoggedInUserKey];
    if (!user || !user.referralCode) return;
    let link = isTelegramMode ? `https://t.me/gamefixpro_bot?start=${user.referralCode}` : `${APP_URL}?ref=${user.referralCode}`;
    document.getElementById('referral-link-input').value = link;
    document.getElementById('referral-popup').classList.add('active');
}

function closeReferralPopup() { document.getElementById('referral-popup').classList.remove('active'); }

function copyReferralLink() {
    const linkInput = document.getElementById('referral-link-input');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'berhasil' : 'gagal';
        customAlert('Info', `Link ${msg} disalin!`);
    } catch (err) {
        customAlert('Error', 'Gagal menyalin link.');
    }
}
        
// --- Fungsi-fungsi untuk Slider Gambar ---
function initializeSlider() {
    const sliderInner = document.getElementById("adSliderInner");
    const dotsContainer = document.getElementById("sliderDots");

    // Kosongkan konten slider yang mungkin ada sebelumnya
    sliderInner.innerHTML = '';
    dotsContainer.innerHTML = '';

    if (imageUrls.length === 0) return; // Jangan lakukan apa-apa jika tidak ada URL gambar

    // Buat setiap slide dan dot secara dinamis
    imageUrls.forEach((url, index) => {
        // Buat elemen slide
        const slide = document.createElement("div");
        slide.classList.add("ad-banner-slide");
        slide.style.backgroundImage = `url('${url}')`; // Set gambar sebagai background
        sliderInner.appendChild(slide);

        // Buat elemen dot
        const dot = document.createElement("span");
        dot.classList.add("dot");
        dot.setAttribute("data-slide-index", index);
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });

    showSlide(currentSlide);
    startAutoSlide();
}

function loadBannerAd(containerId) {
    const adContainer = document.getElementById(containerId);
    if (!adContainer) return;
    const adIndex = parseInt(containerId.split('-')[2], 10) - 1;
    const adUrl = adScriptUrls[adIndex];
    if (!adUrl || adUrl.startsWith("URL_IKLAN")) {
        adContainer.innerHTML = '<p class="ad-not-loaded-text" style="display: block;">URL Iklan belum diatur.</p>';
        return;
    }
    const loadingText = adContainer.querySelector(".loading-text");
    if (loadingText) loadingText.style.display = 'none';
    const adIframe = document.createElement('iframe');
    Object.assign(adIframe.style, { width: '100%', height: '100%', border: 'none', backgroundColor: '#000', });
    adIframe.setAttribute('scrolling', 'no');
    adIframe.setAttribute('allow', 'autoplay; fullscreen');
    adContainer.innerHTML = '';
    adContainer.appendChild(adIframe);
    const iframeDoc = adIframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`<html><head><style>body,html{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background-color:#000;display:flex;justify-content:center;align-items:center;} body > * {width:100%!important;height:110%!important;}</style></head><body></body></html>`);
    iframeDoc.close();
    const adScript = iframeDoc.createElement('script');
    adScript.src = adUrl;
    adScript.async = true;
    adScript.referrerPolicy = 'no-referrer-when-downgrade';
    iframeDoc.body.appendChild(adScript);
}

function showSlide(index) {
    const slides = document.querySelectorAll(".ad-banner-slide");
    const sliderInner = document.getElementById("adSliderInner");
    const dots = document.querySelectorAll(".dot");
    if (index >= slides.length) { currentSlide = 0; }
    else if (index < 0) { currentSlide = slides.length - 1; }
    else { currentSlide = index; }
    sliderInner.style.transform = `translateX(-${100 * currentSlide}%)`;
    dots.forEach((dot, i) => {
        dot.classList.remove("active");
        if (i === currentSlide) { dot.classList.add("active"); }
    });
}

function moveSlide(n) { stopAutoSlide(); showSlide(currentSlide + n); startAutoSlide(); }
function goToSlide(n) { stopAutoSlide(); showSlide(n); startAutoSlide(); }
function startAutoSlide() { stopAutoSlide(); sliderInterval = setInterval(() => { showSlide(currentSlide + 1); }, autoSlideInterval); }
function stopAutoSlide() { clearInterval(sliderInterval); }
        
// --- Fungsi-fungsi untuk Overlay & Popup ---
function showMaintenanceScreen() {
    // Daftar ID dari semua container/halaman utama aplikasi
    const pageContainers = [
        'auth-container', 'telegram-login-container', 'dashboard', 
        'game-iframe-wrapper', 'tugas-container', 'offerwall-container',
        'tarik-container', 'riwayat-container', 'peringkat-container',
        'penarikan-riwayat-container', 'profil-container', 'bottom-nav'
    ];
    
    // Sembunyikan semua halaman utama secara spesifik
    pageContainers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Tampilkan overlay maintenance
    const maintenanceOverlay = document.getElementById('maintenance-overlay');
    if (maintenanceOverlay) maintenanceOverlay.style.display = 'flex';
}
function showBanScreen() {
    // Daftar ID dari semua container/halaman utama aplikasi
    const pageContainers = [
        'auth-container', 'telegram-login-container', 'dashboard', 
        'game-iframe-wrapper', 'tugas-container', 'offerwall-container',
        'tarik-container', 'riwayat-container', 'peringkat-container',
        'penarikan-riwayat-container', 'profil-container', 'bottom-nav'
    ];
    
    // Sembunyikan semua halaman utama secara spesifik
    pageContainers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Tampilkan overlay ban
    const banOverlay = document.getElementById('ban-overlay');
    if (banOverlay) banOverlay.style.display = 'flex';
}
function hideFullScreenOverlays() { document.getElementById('maintenance-overlay').style.display = 'none'; document.getElementById('ban-overlay').style.display = 'none'; }
function handleAccessDenied(message) { document.getElementById('login-message-text').textContent = message; showSection('telegram-login-container'); }
function showGameRewardPopup() { document.getElementById("reward-coins-amount").textContent = `Rp.${currentGameData.reward.toLocaleString()}`; document.getElementById("game-reward-popup-overlay").classList.add("active"); }
function closeGameRewardPopup() { document.getElementById("game-reward-popup-overlay").classList.remove("active"); }
function showCoinEarnedPopup(message) { document.getElementById("coin-earned-message").textContent = message; document.getElementById("coin-earned-popup-overlay").classList.add("active"); }
function closeCoinEarnedPopup() { document.getElementById("coin-earned-popup-overlay").classList.remove("active"); updateDashboardView(); }
function customAlert(header, message) { document.getElementById("custom-alert-header").textContent = header; document.getElementById("custom-alert-message").textContent = message; document.getElementById("custom-alert-popup-overlay").classList.add("active"); }
function closeCustomAlert() { document.getElementById("custom-alert-popup-overlay").classList.remove("active"); }
function customConfirm(message, callback) { document.getElementById("custom-confirm-header").textContent = "Konfirmasi"; document.getElementById("custom-confirm-message").textContent = message; document.getElementById("custom-confirm-popup-overlay").classList.add("active"); confirmCallback = callback; }
function closeCustomConfirm() { document.getElementById("custom-confirm-popup-overlay").classList.remove("active"); confirmCallback = null; }
function showWithdrawalSuccessPopup() { document.getElementById("withdrawal-success-popup-overlay").classList.add("active"); }
function closeWithdrawalSuccessPopup() { document.getElementById("withdrawal-success-popup-overlay").classList.remove("active"); }
function showAchievementUnlockedPopup(achievement) { document.getElementById('unlocked-badge-icon').className = `fas ${achievement.icon} unlocked-badge-icon`; document.getElementById('unlocked-badge-title').textContent = achievement.title; document.getElementById('unlocked-badge-description').textContent = achievement.description; document.getElementById('achievement-unlocked-popup').classList.add('active'); }
function closeAchievementUnlockedPopup() { document.getElementById('achievement-unlocked-popup').classList.remove('active'); }
function showAnnouncementPopup(message) { document.getElementById('announcement-message').textContent = message; document.getElementById('announcement-popup-overlay').classList.add('active'); sessionStorage.setItem('announcement_shown', 'true'); }
function closeAnnouncementPopup() { document.getElementById('announcement-popup-overlay').classList.remove('active'); }
        
async function showNotificationPopup() {
    const container = document.getElementById('notification-list');
    container.innerHTML = '<p class="text-center">Memuat notifikasi...</p>';
    document.getElementById('notification-popup-overlay').classList.add('active');
    try {
        const snapshot = await db.collection('notifications').where('userId', '==', currentLoggedInUserKey).orderBy('timestamp', 'desc').limit(10).get();
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-center text-gray-400">Tidak ada notifikasi.</p>';
            return;
        }
        let notifHtml = '';
        const updates = [];
        snapshot.forEach(doc => {
            const notif = doc.data();
            const date = new Date(notif.timestamp.seconds * 1000).toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'});
            notifHtml += `<div class="p-2 border-b border-gray-700 ${!notif.read ? 'font-bold' : 'opacity-70'}"><p class="text-sm">${notif.message}</p><p class="text-xs text-gray-400 text-right mt-1">${date}</p></div>`;
            if (!notif.read) {
                updates.push(doc.ref.update({ read: true }));
            }
        });
        container.innerHTML = notifHtml;
        await Promise.all(updates);
    } catch (e) {
        container.innerHTML = '<p class="text-center text-red-500">Gagal memuat notifikasi.</p>';
    }
}
        
function closeNotificationPopup() {
    document.getElementById('notification-popup-overlay').classList.remove('active');
}

// --- Fungsi-fungsi Listener dari Firestore ---
function handleGlobalSettings(doc) {
    if (doc.exists) {
        globalSettings = doc.data();

        if (globalSettings.maintenance) {
            showMaintenanceScreen();
            return;
        }
        
        if (globalSettings.announcement && sessionStorage.getItem('announcement_shown') !== 'true') {
            showAnnouncementPopup(globalSettings.announcement);
        }
        if (currentLoggedInUserKey) {
            db.collection('users').doc(currentLoggedInUserKey).get().then(userDoc => {
                if (userDoc.exists) handleUserSnapshot(userDoc, { type: 'existing' });
            });
        }
    }
}

function handleNotificationSnapshot(snapshot) {
    // Ambil elemen lencana notifikasi yang lama dan yang baru
    const notifBadgeOld = document.getElementById('notif-badge');
    const notifBadgeNew = document.getElementById('notif-badge-header-baru');

    const updateBadge = (badgeElement) => {
        if (badgeElement) { // Cek apakah elemen ada
            if (snapshot.size > 0) {
                badgeElement.style.display = 'flex';
                badgeElement.textContent = snapshot.size;
            } else {
                badgeElement.style.display = 'none';
            }
        }
    };

    // Perbarui kedua lencana
    updateBadge(notifBadgeOld);
    updateBadge(notifBadgeNew);
}
        
// ===============================================================
//               FUNGSI-FUNGSI UTILITAS & PEMBANTU
// ===============================================================
        
/**
 * Mencatat transaksi (kredit/debit) ke koleksi 'transactions'.
 * @param {string} description - Deskripsi transaksi.
 * @param {number} amount - Jumlah transaksi.
 * @param {string} type - 'credit' atau 'debit'.
 * @param {string} forUserId - ID pengguna target (opsional).
 */
async function logTransaction(description, amount, type, forUserId = null) {
    const targetUserId = forUserId || currentLoggedInUserKey;
    if (!targetUserId) return;
    try {
        await db.collection('transactions').add({
            userId: targetUserId,
            description: description,
            amount: Math.abs(amount),
            type: type,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Gagal mencatat transaksi:", error);
    }
}

/**
 * Menghasilkan kode referal acak.
 * @param {number} length - Panjang kode yang diinginkan.
 * @returns {string} Kode referal.
 */
function generateReferralCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Mendapatkan nomor minggu dalam setahun dari sebuah tanggal.
 * @param {Date} d - Objek tanggal.
 * @returns {number} Nomor minggu.
 */
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

/**
 * Mendapatkan URL logo metode pembayaran.
 * @param {string} methodName - Nama metode (e.g., 'dana').
 * @returns {string} URL gambar logo.
 */
function getPaymentLogoUrl(methodName) {
    switch (methodName) {
        case "dana": return "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjS6-6EaD4R-eZLSbu5kvq3Iq47a2lXn12p8IcFg0OAdvaxM6qYpYcrwKj4d3oYdGgCjT6O6Vqg5r_0-u_jR-pC7S7-d4xWc-l-sJ9z-rWq9j-zLg7dKj5h-gQ/s1600/DANA-Logo.png";
        case "pulsa": return "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiP7k-p5-x-k7l-G6e-H8n-V-q-C3k-Z8-h-I-B6-f-y-g-W-A-O-V-j-k-l-m-n-o-p/s1600/pulsa-logo.png";
        case "bca": return "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhX3y3bF0O-e-t-J2e-X9m-F3o-D6g-I5-B1h-C9j-K-L-M-N-O-P-Q-R-S-T-U-V-W-X-Y-Z-a-b-c-d-e-f-g-h-i-j-k-l-m-n-o/s1600/bca-logo.png";
        case "bri": return "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7-e-h-F-g-D-c-B-a-Z-y-X-w-V-u-T-s-R-q-P-o-N-m-L-k-J-i-H-g-F-e-D-c-B-a-Z-y-X-w-V-u-T-s-R-q-P-o-N-m-L-k-J-i-H-g-F-e-D-c-B-a/s1600/bri-logo.png";
        case "mandiri": return "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhS-m-l-k-j-i-h-g-f-e-d-c-b-a-Z-Y-X-W-V-U-T-S-R-Q-P-O-N-M-L-K-J-I-H-G-F-E-D-C-B-A-z-y-x-w-v-u-t-s-r-q-p-o-n-m-l-k/s1600/mandiri-logo.png";
        default: return "https://placehold.co/60x40/fff/000?text=?";
    }
}
      
function getPaymentLogo(paymentMethod) {
    let logoUrl = '';
    // Ganti URL placeholder di bawah ini dengan URL gambar Anda yang sebenarnya.
    switch (paymentMethod.toLowerCase()) {
        case 'dana':
            logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/2560px-Logo_dana_blue.svg.png'; 
            break;
        case 'pulsa':
            logoUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmCNPZm8x5w26-P7hnx3b2wa4d8NJ_kD_low&usqp=CAU'; // Ganti dengan URL logo Pulsa Anda
            break;
        case 'bca':
            logoUrl = 'https://buatlogoonline.com/wp-content/uploads/2022/10/Logo-BCA-PNG.png'; // Ganti dengan URL logo BCA Anda
            break;
        case 'bri':
            logoUrl = 'https://buatlogoonline.com/wp-content/uploads/2022/10/Logo-Bank-BRI.png'; // Ganti dengan URL logo BRI Anda
            break;
        case 'mandiri':
            logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/2560px-Bank_Mandiri_logo_2016.svg.png'; // Ganti dengan URL logo Mandiri Anda
            break;
        default:
            return ''; 
    }
    return `<img src="${logoUrl}" alt="${paymentMethod}" class="payment-logo">`;
}
      
function bagikanUndangan() {
    // 1. Ambil data pengguna (Logika ini sama seperti milik Anda)
    const user = users[currentLoggedInUserKey];
    if (!user || !user.referralCode) {
        customAlert("Error", "Kode referral Anda tidak dapat ditemukan. Coba muat ulang.");
        return;
    }

    let linkUntukDibagikan;
    let pesanUntukDibagikan;

    if (isTelegramMode) {
        // Jika di Telegram, siapkan link bot
        linkUntukDibagikan = `https://t.me/gamefixpro_bot?start=${user.referralCode}`;
        pesanUntukDibagikan = `Hai! Ayo gabung dan main di GameFix Pro untuk dapat hadiah. Jangan lupa pakai link ini ya!`;
    } else {
        // Jika di Aplikasi/Browser, siapkan link download dan pesan dengan kode
        linkUntukDibagikan = `https://gamefix.netlify.app/`;
        pesanUntukDibagikan = `Ayo main GameFix Pro! Download aplikasinya di link ini dan jangan lupa masukkan kode referalku:  "${user.referralCode}"  saat daftar untuk dapat bonus!`;
    }
    
    // Prioritas #1: Mencoba Web Share API
    if (navigator.share) {
        navigator.share({
            title: 'Undangan Bergabung GameFix Pro',
            text: pesanUntukDibagikan, 
            url: linkUntukDibagikan,  
        })
        .then(() => console.log('Berhasil dibagikan via Web Share API.'))
        .catch((error) => console.log('Gagal berbagi via Web Share API:', error));
    
    // Prioritas #2: Cadangan khusus jika di Telegram (misal untuk Android versi lama)
    } else if (isTelegramMode) {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(linkUntukDibagikan)}&text=${encodeURIComponent(pesanUntukDibagikan)}`;
        window.open(telegramShareUrl, '_blank');

    // Prioritas #3: Cadangan terakhir jika semua gagal (misal di browser PC)
    } else {
        navigator.clipboard.writeText(`${pesanUntukDibagikan} \n\nDownload App: ${linkUntukDibagikan}`).then(() => {
            customAlert("Berhasil Disalin!", "Pesan undangan sudah disalin. Silakan bagikan ke teman Anda.");
        }).catch(err => {
            customAlert("Gagal", "Gagal menyalin pesan undangan.");
        });
    }
}
