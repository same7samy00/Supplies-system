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
        // User is logged in, initialize the app
        initializeApp(user);
    } else {
        // User is not logged in, redirect to login page
        window.location.href = 'index.html';
    }
});

// --- Logout Logic ---
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut();
});

// --- Main App Function ---
function initializeApp(user) {
    console.log("App initialized for user:", user.uid);

    // --- DOM Elements ---
    const addProductForm = document.getElementById('addProductForm');
    const productsTableBody = document.getElementById('productsTableBody');
    const editModal = document.getElementById('editModal');
    const editProductForm = document.getElementById('editProductForm');
    const closeBtn = document.querySelector('.close-btn');

    // --- CREATE: Add new product ---
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('products').add({
            name: addProductForm.productName.value,
            quantity: parseInt(addProductForm.productQuantity.value),
            price: parseFloat(addProductForm.productPrice.value),
            barcode: addProductForm.productBarcode.value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            addProductForm.reset();
        }).catch(error => console.error("Error adding product: ", error));
    });

    // --- READ: Display products in real-time ---
    db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        productsTableBody.innerHTML = '';
        snapshot.forEach(doc => {
            const product = doc.data();
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', doc.id);
            tr.innerHTML = `
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>${product.barcode || '-'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${doc.id}">تعديل</button>
                    <button class="action-btn delete-btn" data-id="${doc.id}">حذف</button>
                </td>
            `;
            productsTableBody.appendChild(tr);
        });
    });
    
    // --- Event Delegation for UPDATE and DELETE ---
    productsTableBody.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        if (!productId) return;

        // DELETE Logic
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟')) {
                db.collection('products').doc(productId).delete()
                  .catch(error => console.error("Error deleting product:", error));
            }
        }

        // UPDATE Logic (Open Modal)
        if (e.target.classList.contains('edit-btn')) {
            db.collection('products').doc(productId).get().then(doc => {
                if (doc.exists) {
                    const product = doc.data();
                    editProductForm.dataset.id = doc.id; // Store ID on form
                    document.getElementById('editProductName').value = product.name;
                    document.getElementById('editProductQuantity').value = product.quantity;
                    document.getElementById('editProductPrice').value = product.price;
                    document.getElementById('editProductBarcode').value = product.barcode || '';
                    editModal.style.display = 'block';
                }
            });
        }
    });

    // --- UPDATE: Save changes from modal ---
    editProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const productId = e.target.dataset.id;
        const updatedData = {
            name: document.getElementById('editProductName').value,
            quantity: parseInt(document.getElementById('editProductQuantity').value),
            price: parseFloat(document.getElementById('editProductPrice').value),
            barcode: document.getElementById('editProductBarcode').value,
        };
        db.collection('products').doc(productId).update(updatedData)
          .then(() => {
              editModal.style.display = 'none';
          })
          .catch(error => console.error("Error updating product:", error));
    });

    // --- Close Modal Logic ---
    closeBtn.addEventListener('click', () => editModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == editModal) {
            editModal.style.display = 'none';
        }
    });
}
