// Your web app's Firebase configuration (same as before)
const firebaseConfig = {
    apiKey: "AIzaSyBU4lTFTliRRmn4eN9F9pP9SKQJilUsXlE",
    authDomain: "supplies-system.firebaseapp.com",
    projectId: "supplies-system",
    storageBucket: "supplies-system.appspot.com",
    messagingSenderId: "205884975863",
    appId: "1:205884975863:web:de65d32c2459f9979ac1f2",
    measurementId: "G-2KSYJRKSCX"
};

// Initialize Firebase (same as before)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Auth Guard & Main Initializer (same as before)
auth.onAuthStateChanged(user => {
    if (user) {
        initializeApp(user);
    } else {
        window.location.href = 'index.html';
    }
});

function initializeApp(user) {
    // --- DOM Elements (added openScannerBtn) ---
    const addProductForm = document.getElementById('addProductForm');
    const productsTableBody = document.getElementById('productsTableBody');
    const editModalEl = document.getElementById('editModal');
    const editModal = new bootstrap.Modal(editModalEl);
    const editProductForm = document.getElementById('editProductForm');
    const searchInput = document.getElementById('searchInput');
    const openScannerBtn = document.getElementById('openScannerBtn');
    const settingsForm = document.getElementById('settingsForm');
    const storeNameHeader = document.getElementById('storeNameHeader');
    const storeNameInput = document.getElementById('storeNameInput');
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    const views = document.querySelectorAll('.view');
    const dateTimeEl = document.getElementById('dateTime');

    // --- Initial Setup (same as before) ---
    document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());
    searchInput.focus();
    setInterval(() => { dateTimeEl.textContent = new Date().toLocaleString('ar-EG'); }, 1000);
    
    // --- Settings Logic (same as before) ---
    const settingsRef = db.collection('settings').doc('storeInfo');
    settingsRef.get().then(doc => {
        if(doc.exists) {
            const storeName = doc.data().name;
            storeNameHeader.textContent = storeName;
            storeNameInput.value = storeName;
        }
    });
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = storeNameInput.value;
        settingsRef.set({ name: newName }).then(() => {
            storeNameHeader.textContent = newName;
            alert('تم حفظ الإعدادات بنجاح!');
        });
    });

    // --- View Navigation (same as before) ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = document.getElementById(link.dataset.view);
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            views.forEach(v => v.classList.remove('active'));
            targetView.classList.add('active');
            if (link.dataset.view === 'inventoryView') {
                searchInput.focus();
            }
        });
    });

    // --- Camera Scanner Logic (NEW) ---
    openScannerBtn.addEventListener('click', () => {
        window.open('scanner.html', 'Scanner', 'width=600,height=400');
    });

    window.addEventListener('storage', (event) => {
        if (event.key === 'scannedBarcode') {
            const barcode = event.newValue;
            if (barcode) {
                searchInput.value = barcode;
                // Trigger the input event to apply the filter
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                // Clean up
                localStorage.removeItem('scannedBarcode');
            }
        }
    });

    // --- CREATE Logic (same as before) ---
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('products').add({
            name: addProductForm.productName.value,
            quantity: parseInt(addProductForm.productQuantity.value),
            unit: addProductForm.productUnit.value,
            price: parseFloat(addProductForm.productPrice.value),
            barcode: addProductForm.productBarcode.value,
            expiryDate: addProductForm.productExpiryDate.value,
            lowStockThreshold: parseInt(addProductForm.lowStockThreshold.value),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => addProductForm.reset());
    });

    // --- READ & RENDER (same as before) ---
    db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        let productsData = [];
        snapshot.forEach(doc => productsData.push({ id: doc.id, ...doc.data() }));
        renderTable(productsData);
        applySearchFilter(searchInput.value); 
    });

    function renderTable(products) {
        productsTableBody.innerHTML = '';
        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', product.id);
            const now = new Date(); now.setHours(0,0,0,0);
            const expiry = new Date(product.expiryDate); expiry.setHours(0,0,0,0);
            const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
            if (product.quantity <= product.lowStockThreshold) tr.classList.add('table-danger');
            else if (product.expiryDate && daysUntilExpiry <= 30) tr.classList.add('table-warning');
            tr.innerHTML = `<td>${product.name}</td><td>${product.quantity}</td><td>${product.unit}</td><td>${product.price.toFixed(2)}</td><td>${product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('ar-EG') : '-'}</td><td>${product.barcode || '-'}</td><td><button class="btn btn-sm btn-info print-btn" title="طباعة باركود" data-barcode="${product.barcode}" data-name="${product.name}"><i class="bi bi-printer-fill"></i></button> <button class="btn btn-sm btn-primary edit-btn" title="تعديل"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger delete-btn" title="حذف"><i class="bi bi-trash3-fill"></i></button></td>`;
            productsTableBody.appendChild(tr);
        });
    }
    
    // --- UPDATE, DELETE, PRINT (same as before) ---
    productsTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const row = btn.closest('tr');
        const id = row.dataset.id;
        if (btn.classList.contains('delete-btn')) {
            if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                db.collection('products').doc(id).delete();
            }
        }
        if (btn.classList.contains('edit-btn')) {
            db.collection('products').doc(id).get().then(doc => {
                if (doc.exists) {
                    const p = doc.data();
                    editProductForm.dataset.id = doc.id;
                    document.getElementById('editProductName').value = p.name;
                    document.getElementById('editProductQuantity').value = p.quantity;
                    document.getElementById('editProductUnit').value = p.unit;
                    document.getElementById('editProductPrice').value = p.price;
                    document.getElementById('editProductBarcode').value = p.barcode || '';
                    document.getElementById('editProductExpiryDate').value = p.expiryDate || '';
                    document.getElementById('editLowStockThreshold').value = p.lowStockThreshold;
                    editModal.show();
                }
            });
        }
        if (btn.classList.contains('print-btn')) {
            const barcodeValue = btn.dataset.barcode;
            const productName = btn.dataset.name;
            if (barcodeValue) printBarcode(barcodeValue, productName);
            else alert('لا يوجد باركود لهذا المنتج.');
        }
    });

    // --- UPDATE (Save from Modal) (same as before) ---
    editProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = e.target.dataset.id;
        db.collection('products').doc(id).update({
            name: document.getElementById('editProductName').value,
            quantity: parseInt(document.getElementById('editProductQuantity').value),
            unit: document.getElementById('editProductUnit').value,
            price: parseFloat(document.getElementById('editProductPrice').value),
            barcode: document.getElementById('editProductBarcode').value,
            expiryDate: document.getElementById('editProductExpiryDate').value,
            lowStockThreshold: parseInt(document.getElementById('editLowStockThreshold').value),
        }).then(() => editModal.hide());
    });

    // --- SEARCH (same as before) ---
    searchInput.addEventListener('input', (e) => applySearchFilter(e.target.value));

    function applySearchFilter(searchTerm) {
        const term = searchTerm.toLowerCase();
        productsTableBody.querySelectorAll('tr').forEach(row => {
            const name = row.cells[0].textContent.toLowerCase();
            const barcode = row.cells[5].textContent.toLowerCase();
            row.style.display = (name.includes(term) || barcode.includes(term)) ? '' : 'none';
        });
    }

    // --- Utility Functions (same as before) ---
    function printBarcode(barcodeValue, productName) {
        const printWindow = window.open('', 'PRINT', 'height=400,width=600');
        printWindow.document.write('<html><head><title>Barcode</title><style>body{text-align:center; margin-top: 20px; font-family: sans-serif;} svg{width: 80%;}</style></head><body>');
        printWindow.document.write(`<h4>${productName}</h4><svg id="barcode"></svg></body></html>`);
        printWindow.document.close();
        JsBarcode(printWindow.document.getElementById('barcode'), barcodeValue, { format: "CODE128", displayValue: true });
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    }
}
