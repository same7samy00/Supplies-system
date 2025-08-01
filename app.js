// استخدم نفس بيانات الإعداد التي أرسلتها
const firebaseConfig = {
    apiKey: "AIzaSyBU4lTFTliRRmn4eN9F9pP9SKQJilUsXlE",
    authDomain: "supplies-system.firebaseapp.com",
    projectId: "supplies-system",
    storageBucket: "supplies-system.appspot.com", // Corrected domain
    messagingSenderId: "205884975863",
    appId: "1:205884975863:web:de65d32c2459f9979ac1f2",
    measurementId: "G-2KSYJRKSCX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- Login Logic ---
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // منع الفورم من إعادة تحميل الصفحة

    const enteredPassword = document.getElementById('password').value;

    try {
        // جلب كلمة المرور من قاعدة البيانات
        // سنفترض أن كلمة المرور مخزنة في collection اسمها 'settings' وفي document اسمه 'auth'
        const docRef = db.collection('settings').doc('auth');
        const doc = await docRef.get();

        if (doc.exists) {
            const correctPassword = doc.data().password; // افترضنا أن الحقل اسمه password
            if (enteredPassword === correctPassword) {
                alert('تم تسجيل الدخول بنجاح!');
                // توجيه المستخدم إلى الصفحة الرئيسية بعد تسجيل الدخول
                // سننشئ هذه الصفحة لاحقًا
                window.location.href = 'dashboard.html'; 
            } else {
                alert('كلمة المرور غير صحيحة!');
            }
        } else {
            // هذا يحدث لو لم يتم تعيين كلمة مرور بعد
            alert('خطأ: لم يتم العثور على إعدادات كلمة المرور. يرجى مراجعة المسؤول.');
            // يمكنك تعيين كلمة مرور افتراضية هنا لأول مرة
            // مثال: await db.collection('settings').doc('auth').set({ password: 'admin' });
        }

    } catch (error) {
        console.error("خطأ في الاتصال بقاعدة البيانات: ", error);
        alert('حدث خطأ أثناء محاولة تسجيل الدخول.');
    }
});
