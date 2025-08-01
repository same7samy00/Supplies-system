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
const auth = firebase.auth(); // Initialize Firebase Authentication

// --- Login Logic using Firebase Auth ---
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent the form from reloading the page

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Use the built-in Firebase function to sign in
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in successfully
            alert('تم تسجيل الدخول بنجاح!');
            
            // Redirect the user to the main dashboard page
            // We will create this page in the next step
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            // Handle login errors
            // Provide user-friendly error messages
            if (error.code === 'auth/user-not-found') {
                alert('هذا البريد الإلكتروني غير مسجل.');
            } else if (error.code === 'auth/wrong-password') {
                alert('كلمة المرور غير صحيحة.');
            } else {
                alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
            }
        });
});
