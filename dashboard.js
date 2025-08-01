window.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Config ---
    const firebaseConfig = {
        apiKey: "AIzaSyBU4lTFTliRRmn4eN9F9pP9SKQJilUsXlE",
        authDomain: "supplies-system.firebaseapp.com",
        projectId: "supplies-system",
        storageBucket: "supplies-system.appspot.com",
        messagingSenderId: "205884975863",
        appId: "1:205884975863:web:de65d32c2459f9979ac1f2",
        measurementId: "G-2KSYJRKSCX"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- Auth Guard & Main Initializer ---
    auth.onAuthStateChanged(user => {
        if (user) {
            initializeApp(user);
        } else {
            window.location.href = 'index.html';
        }
    });

    function initializeApp(user) {
        let currentScanSessionId = null;
        let unsubscribeScanListener = null;

        // --- DOM Elements ---
        const storeNameHeader = document.getElementById('storeNameHeader');
        const storeNameInput = document.getElementById('storeNameInput');
        const settingsForm = document.getElementById('settingsForm');
        const connectScannerBtn = document.getElementById('connectScannerBtn');
        const qrCodeContainer = document.getElementById('qrcode-container');
        const addProductForm = document.getElementById('addProductForm');
        const productsTableBody = document.getElementById('productsTableBody');
        const searchInput = document.getElementById('searchInput');
        const editModalEl = document.getElementById('editModal');
        const editModal = new bootstrap.Modal(editModalEl);
        const editProductForm = document.getElementById('editProductForm');
        const navLinks = document.querySelectorAll('.nav-link[data-view]');
        const views = document.querySelectorAll('.view');
        const dateTimeEl = document.getElementById('dateTime');
        const generateBarcodeBtn = document.getElementById('generateBarcodeBtn');

        // --- Initial Setup ---
        document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());
        if (searchInput) searchInput.focus();
        if (dateTimeEl) setInterval(() => { dateTimeEl.textContent = new Date().toLocaleString('ar-EG'); }, 1000);

        // --- Remote Scanner Logic ---
        connectScannerBtn.addEventListener('click', () => {
            if (unsubscribeScanListener) unsubscribeScanListener();
            currentScanSessionId = db.collection('scanSessions').doc().id;
            qrCodeContainer.innerHTML = "";
            const scannerUrl = `${window.location.origin}${window.location.pathname.replace('dashboard.html', '')}scanner.html?session=${currentScanSessionId}`;
            new QRCode(qrCodeContainer, { text: scannerUrl, width: 256, height: 256 });

            const scanSessionRef = db.collection('scanSessions').doc(currentScanSessionId);
            unsubscribeScanListener = scanSessionRef.onSnapshot((doc) => {
                if (doc.exists) {
                    const barcode = doc.data().barcode;
                    searchInput.value = barcode;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        });

        // --- Auto-generate Barcode ---
        generateBarcodeBtn.addEventListener('click', () => {
            const timestamp = Date.now().toString();
            const randomPart = Math.random().toString().substring(2, 8);
            document.getElementById('productBarcode').value = timestamp.substring(3) + randomPart;
        });

        // --- Settings Logic ---
        const settingsRef = db.collection('settings').doc('storeInfo');
        settingsRef.get().then(doc => {
            if (doc.exists) {
                const storeName = doc.data().name;
                storeNameHeader.textContent = storeName;
                storeNameInput.value = storeName;
            } else {
                storeNameHeader.textContent = "اسم المحل الافتراضي";
            }
        });
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = storeNameInput.value.trim();
            if (newName) settingsRef.set({ name: newName }).then(() => alert('تم حفظ الإعدادات بنجاح!'));
        });

        // --- View Navigation ---
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetViewId = link.dataset.view;
                const targetView = document.getElementById(targetViewId);
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                views.forEach(v => v.classList.remove('active'));
                if (targetView) targetView.classList.add('active');
                if (targetViewId === 'inventoryView') searchInput.focus();
            });
        });

        // --- ✅ Fetch Products from Firestore ---
        db.collection("products").onSnapshot(snapshot => {
            productsTableBody.innerHTML = ''; // مسح البيانات القديمة
            snapshot.forEach(doc => {
                const data = doc.data();
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${data.barcode || ''}</td>
                    <td>${data.name || ''}</td>
                    <td>${data.quantity || 0}</td>
                    <td>${data.unit || ''}</td>
                    <td>${data.price || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${doc.id}">تعديل</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${doc.id}">حذف</button>
                    </td>
                `;
                productsTableBody.appendChild(row);
            });
        });
    }
});
