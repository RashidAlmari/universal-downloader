// ============================================
// نظام المصادقة - Authentication System
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = this.loadUser();
        this.initializeUI();
    }

    // تحميل المستخدم من localStorage
    loadUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    // حفظ المستخدم في localStorage
    saveUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser = user;
    }

    // تسجيل دخول جديد
    login(username, password) {
        if (!username || !password) {
            throw new Error('الرجاء إدخال اسم المستخدم وكلمة المرور');
        }

        if (username.length < 3) {
            throw new Error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        }

        if (password.length < 6) {
            throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }

        const user = {
            id: Date.now().toString(),
            username: username,
            loginTime: new Date().toLocaleString('ar-SA'),
            createdAt: new Date().toISOString()
        };

        this.saveUser(user);
        this.updateUI();
        return user;
    }

    // تسجيل الخروج
    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.updateUI();
    }

    // تحديث واجهة المستخدم
    updateUI() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userName = document.getElementById('user-name');

        if (this.currentUser) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            userName.textContent = `👤 ${this.currentUser.username}`;
            userName.style.display = 'block';
        } else {
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            userName.style.display = 'none';
        }
    }

    // تهيئة واجهة المستخدم
    initializeUI() {
        this.updateUI();

        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginDialog());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // عرض نافذة تسجيل الدخول
    showLoginDialog() {
        const username = prompt('أدخل اسم المستخدم:');
        if (username === null) return;

        const password = prompt('أدخل كلمة المرور:');
        if (password === null) return;

        try {
            this.login(username, password);
            this.showToast('✅ تم تسجيل الدخول بنجاح!', 'success');
        } catch (error) {
            this.showToast('❌ ' + error.message, 'error');
        }
    }

    // عرض رسالة
    showToast(message, type = 'info') {
        const toast = document.getElementById(type === 'error' ? 'error-toast' : 'success-message');
        if (toast) {
            toast.textContent = message;
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentUser;
    }

    // التحقق من تسجيل الدخول
    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// إنشاء مثيل من AuthManager
const authManager = new AuthManager();
