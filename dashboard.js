// Your web app's Firebase configuration
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

// --- Auth Guard ---
auth.onAuthStateChanged(user => {
    if (user) {
        initializeApp(user);
    } else {
        window.location.href = 'index.html';
    }
});

// --- Logout ---
document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());

// --- Main App Function ---
function initializeApp(user) {
    // --- DOM Elements ---
    const addProductForm = document.getElementById('addProductForm');
    const productsTableBody = document.getElementById('productsTableBody');
    const editModal = document.getElementById('editModal');
    const editProductForm = document.getElementById('editProductForm');
    const closeBtn = document.querySelector('.close-btn');
    const searchInput = document.getElementById('searchInput');

    // --- CREATE ---
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

    // --- READ & RENDER ---
    db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        productsTableBody.innerHTML = '';
        snapshot.forEach(doc => {
            const product = doc.data();
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', doc.id);

            // Alerts Logic
            const now = new Date(); now.setHours(0,0,0,0);
            const expiry = new Date(product.expiryDate); expiry.setHours(0,0,0,0);
            const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
            if (product.quantity <= product.lowStockThreshold) tr.classList.add('low-stock');
            else if (product.expiryDate && daysUntilExpiry <= 30) tr.classList.add('expiring-soon');

            tr.innerHTML = `
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${product.unit}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>${product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '-'}</td>
                <td>${product.barcode || '-'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${doc.id}">تعديل</button>
                    <button class="action-btn delete-btn" data-id="${doc.id}">حذف</button>
                    <button class="action-btn print-btn" data-barcode="${product.barcode}" data-name="${product.name}">طباعة</button>
                </td>
            `;
            productsTableBody.appendChild(tr);
        });
    });
    
    // --- UPDATE & DELETE & PRINT (Event Delegation) ---
    productsTableBody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.dataset.id;
        
        // DELETE
        if (target.classList.contains('delete-btn')) {
            if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                db.collection('products').doc(id).delete();
            }
        }
        
        // UPDATE (Open Modal)
        if (target.classList.contains('edit-btn')) {
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
                    editModal.style.display = 'block';
                }
            });
        }

        // PRINT
        if (target.classList.contains('print-btn')) {
            const barcodeValue = target.dataset.barcode;
            const productName = target.dataset.name;
            if (barcodeValue) {
                printBarcode(barcodeValue, productName);
            } else {
                alert('لا يوجد باركود لهذا المنتج.');
            }
        }
    });

    // --- UPDATE (Save from Modal) ---
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
        }).then(() => editModal.style.display = 'none');
    });

    // --- SEARCH ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        productsTableBody.querySelectorAll('tr').forEach(row => {
            const name = row.cells[0].textContent.toLowerCase();
            const barcode = row.cells[5].textContent.toLowerCase();
            row.style.display = (name.includes(searchTerm) || barcode.includes(searchTerm)) ? '' : 'none';
        });
    });

    // --- Utility Functions ---
    function printBarcode(barcodeValue, productName) {
        const printWindow = window.open('', 'PRINT', 'height=400,width=600');
        printWindow.document.write('<html><head><title>Barcode</title>');
        printWindow.document.write('<style>body{text-align:center; margin-top: 20px;} svg{width: 80%;}</style></head><body>');
        printWindow.document.write(`<h4>${productName}</h4>`);
        printWindow.document.write('<svg id="barcode"></svg>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        JsBarcode(printWindow.document.getElementById('barcode'), barcodeValue, {
            format: "CODE128",
            displayValue: true
        });
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
    
    // --- Modal Closing Logic ---
    closeBtn.addEventListener('click', () => editModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == editModal) editModal.style.display = 'none';
    });
}
