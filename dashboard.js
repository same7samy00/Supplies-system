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

// --- Auth Guard (حارس المصادقة) ---
auth.onAuthStateChanged(user => {
    if (user) {
        // المستخدم مسجل دخوله، يمكنه البقاء في الصفحة
        console.log("User is logged in:", user.uid);
        // الخطوة التالية: سنقوم بتحميل بيانات المخزون هنا
    } else {
        // المستخدم ليس مسجل دخوله، أعده إلى صفحة البداية
        console.log("No user is logged in. Redirecting...");
        window.location.href = 'index.html';
    }
});

// --- Logout Logic ---
const logoutButton = document.getElementById('logoutBtn');
logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        // تم تسجيل الخروج بنجاح
        // onAuthStateChanged سيتولى إعادة التوجيه تلقائيًا
        console.log("User signed out.");
    }).catch(error => {
        console.error("Sign out error", error);
    });
});
