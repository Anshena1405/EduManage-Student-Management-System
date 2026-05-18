/**
 * State Management & Firestore Integration
 */
const State = {
    currentUser: null,
    currentView: 'dashboard',
    students: [],
    courses: [],
    marks: [],
    assignments: [],
    notifications: [],
    feedback: [],
    timetables: [],
    exams: [],
    submissions: [],
    attendance: [],
    attendance: [],
    interventions: [],
    todos: [],
    isLandingPage: true
};

// Only handle local auth state directly, let Firestore handle the data
function loadAuthState() {
    const saved = localStorage.getItem('student_mgmt_auth');
    if (saved) {
        State.currentUser = JSON.parse(saved);
        State.currentView = localStorage.getItem('student_mgmt_view') || 'dashboard';
    }
}

window.saveAuthState = function () { // Expose for easy access if needed
    if (State.currentUser) {
        localStorage.setItem('student_mgmt_auth', JSON.stringify(State.currentUser));
    } else {
        localStorage.removeItem('student_mgmt_auth');
    }
    localStorage.setItem('student_mgmt_view', State.currentView);
};

// Add Real-time Firebase listeners
function initFirebaseListeners() {
    if (!window.db) return; // If db is not initialized because of missing config

    const collections = ['students', 'courses', 'marks', 'assignments', 'notifications', 'feedback', 'timetables', 'exams', 'submissions', 'attendance', 'interventions', 'todos'];

    collections.forEach(col => {
        db.collection(col).onSnapshot(snapshot => {
            State[col] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Re-render inner content if the app structure is actively mounted
            if (State.currentUser && document.getElementById('mainContent')) {
                renderViewContent(State.currentView);
            }
        });
    });
}

// Ensure DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    loadAuthState();
    initFirebaseListeners();
    renderApp();
});

function renderApp() {
    const appEl = document.getElementById('app');

    if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_API_KEY") {
        appEl.innerHTML = `
            <div class="flex items-center justify-center h-screen animate-fade">
                <div class="glass-card auth-container text-center" style="max-width: 550px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--warning); margin-bottom: 1rem;"></i>
                    <h2 style="color: var(--warning);">Firebase Not Connected</h2>
                    <p style="margin-top: 1rem;">Your application requires a valid Firebase configuration to function as requested.</p>
                    <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 8px; margin-top: 1.5rem; text-align: left; font-size: 0.9rem;">
                        <p><b>Steps to resolve:</b></p>
                        <ol style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text-secondary);">
                            <li>Go to <a href="https://console.firebase.google.com/" target="_blank" style="color:var(--accent);">Firebase Console</a></li>
                            <li>Create a new project and add a Web Application.</li>
                            <li>Enable <b>Firestore Database</b> (in Test Mode for now).</li>
                            <li>Copy the configuration keys.</li>
                            <li>Open <code>firebase-config.js</code> in your project folder and paste the keys over the placeholders.</li>
                            <li>Refresh this page.</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    if (!State.currentUser) {
        if (State.isLandingPage) {
            appEl.innerHTML = getLandingPageHTML();
        } else {
            // Render Login
            appEl.innerHTML = `
            <div class="flex items-center justify-center h-screen animate-fade">
                <div class="glass-card auth-container">
                    <div class="text-center" style="margin-bottom: 2rem;">
                        <div class="sidebar-logo" style="margin: 0 auto 1rem auto; width: 60px; height: 60px; font-size: 1.8rem;">
                            <i class="fa-solid fa-graduation-cap"></i>
                        </div>
                        <h2>EduManage</h2>
                        <p>Sign in to your account</p>
                    </div>
                    
                    <form id="loginForm" class="flex-col gap-2">
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; color:var(--text-secondary); font-size: 0.9rem;">Username / Roll Number</label>
                            <input type="text" id="username" placeholder="Enter username" required>
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; color:var(--text-secondary); font-size: 0.9rem;">Password</label>
                            <input type="password" id="password" placeholder="Enter password" required>
                        </div>
                        <button type="submit" style="margin-top: 1rem; width: 100%;">
                            <i class="fa-solid fa-right-to-bracket"></i> Sign In
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            handleLogin(u, p);
        });
        }
    } else {
        // Render Layout
        appEl.innerHTML = `
            <div class="app-layout animate-fade">
                <div class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo"><i class="fa-solid fa-graduation-cap"></i></div>
                        <div>
                            <h3 style="font-size: 1.1rem; line-height: 1.2;">EduManage</h3>
                            <span style="font-size: 0.8rem; color: var(--accent); font-weight: 500;">
                                ${State.currentUser.role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
                            </span>
                        </div>
                    </div>
                    <nav class="flex-col" id="sidebarNav">
                        <!-- Nav injected dynamically -->
                    </nav>
                    <div style="margin-top: auto;">
                        <div class="nav-link" id="logoutBtn" style="color: var(--danger);">
                            <i class="fa-solid fa-power-off"></i> Logout
                        </div>
                    </div>
                </div>
                <div class="main-content" id="mainContent">
                    <!-- Content injected dynamically -->
                </div>
            </div>
        `;

        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        renderNavigation();
        navigateTo(State.currentView);
    }
}

async function handleLogin(username, password) {
    if (username === 'admin' && password === 'admin123') {
        State.currentUser = { role: 'teacher', username: 'admin', name: 'Admin Teacher', id: 'admin' };
        State.currentView = 'dashboard';
        saveAuthState();
        renderApp();
    } else {
        try {
            // Check student from Firestore asynchronously
            const snapshot = await db.collection('students')
                .where('roll_number', '==', username)
                .where('password', '==', password)
                .get();

            if (!snapshot.empty) {
                const studentData = snapshot.docs[0].data();
                const studentId = snapshot.docs[0].id; // The firebase document ID
                State.currentUser = { role: 'student', username: studentData.roll_number, name: studentData.name, id: studentId };
                State.currentView = 'dashboard';
                saveAuthState();
                renderApp();
            } else {
                alert('Invalid credentials. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert("Error logging in. Please ensure your Firebase config is correct and Firestore rules allow reading.");
        }
    }
}

function handleLogout() {
    State.currentUser = null;
    State.currentView = 'dashboard';
    saveAuthState();
    renderApp();
}

/**
 * Routing & Navigation
 */
const teacherRoutes = [
    { id: 'dashboard', icon: 'fa-table-columns', label: 'Dashboard' },
    { id: 'students', icon: 'fa-users', label: 'Students' },
    { id: 'attendance', icon: 'fa-calendar-check', label: 'Attendance' },
    { id: 'alerts', icon: 'fa-triangle-exclamation', label: 'At-Risk Students' },
    { id: 'courses', icon: 'fa-book', label: 'Courses' },
    { id: 'marks', icon: 'fa-star', label: 'Allocate Marks' },
    { id: 'timetable', icon: 'fa-calendar-days', label: 'Timetable' },
    { id: 'exams', icon: 'fa-file-lines', label: 'Schedule Exams' },
    { id: 'assignments', icon: 'fa-clipboard-list', label: 'Assignments' },
    { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
    { id: 'feedback', icon: 'fa-comments', label: 'Feedback' },
    { id: 'predictions', icon: 'fa-chart-line', label: 'Predictions' }
];

const studentRoutes = [
    { id: 'dashboard', icon: 'fa-table-columns', label: 'Dashboard' },
    { id: 'studyhub', icon: 'fa-gamepad', label: 'Study Hub' },
    { id: 'marks', icon: 'fa-star', label: 'My Marks' },
    { id: 'attendance', icon: 'fa-calendar-check', label: 'My Attendance' },
    { id: 'assignments', icon: 'fa-clipboard-list', label: 'Submit Assignments' },
    { id: 'timetable', icon: 'fa-calendar-days', label: 'Timetable & Exams' },
    { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
    { id: 'feedback', icon: 'fa-comments', label: 'Send Feedback' }
];

function renderNavigation() {
    const navEl = document.getElementById('sidebarNav');
    const roleRoutes = State.currentUser.role === 'teacher' ? teacherRoutes : studentRoutes;

    navEl.innerHTML = roleRoutes.map(route => `
        <div class="nav-link ${State.currentView === route.id ? 'active' : ''}" data-route="${route.id}">
            <i class="fa-solid ${route.icon}" style="width: 20px; text-align: center;"></i>
            ${route.label}
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.nav-link[data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
            const route = e.currentTarget.getAttribute('data-route');
            navigateTo(route);
        });
    });
}

function navigateTo(viewId) {
    State.currentView = viewId;
    saveAuthState();
    renderNavigation(); // Update active states
    renderViewContent(viewId);
}

window.renderViewContent = function (viewId) {
    const mainEl = document.getElementById('mainContent');
    if (!mainEl) return;

    // Check if the wrapper already exists so we can reuse it to avoid losing focus if filling out forms fast
    // Actually, since we want a unified slide animation on nav change, we will clear it
    mainEl.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'animate-slide';

    if (State.currentUser.role === 'teacher') {
        if (viewId === 'dashboard') wrapper.innerHTML = getTeacherDashboardHTML();
        else if (viewId === 'students') wrapper.innerHTML = getTeacherStudentsHTML();
        else if (viewId === 'courses') wrapper.innerHTML = getTeacherCoursesHTML();
        else if (viewId === 'marks') wrapper.innerHTML = getTeacherMarksHTML();
        else if (viewId === 'timetable') wrapper.innerHTML = getTeacherTimetableHTML();
        else if (viewId === 'exams') wrapper.innerHTML = getTeacherExamsHTML();
        else if (viewId === 'assignments') wrapper.innerHTML = getTeacherAssignmentsHTML();
        else if (viewId === 'notifications') wrapper.innerHTML = getTeacherNotificationsHTML();
        else if (viewId === 'feedback') wrapper.innerHTML = getTeacherFeedbackHTML();
        else if (viewId === 'predictions') wrapper.innerHTML = getTeacherPredictionsHTML();
        else if (viewId === 'attendance') wrapper.innerHTML = getTeacherAttendanceHTML();
        else if (viewId === 'alerts') wrapper.innerHTML = getTeacherAlertsHTML();
        else wrapper.innerHTML = `<div><h2>${teacherRoutes.find(r => r.id === viewId).label}</h2><p>Under construction...</p></div>`;
    } else {
        if (viewId === 'dashboard') wrapper.innerHTML = getStudentDashboardHTML();
        else if (viewId === 'marks') wrapper.innerHTML = getStudentMarksHTML();
        else if (viewId === 'assignments') wrapper.innerHTML = getStudentAssignmentsHTML();
        else if (viewId === 'timetable') wrapper.innerHTML = getStudentTimetableHTML();
        else if (viewId === 'notifications') wrapper.innerHTML = getStudentNotificationsHTML();
        else if (viewId === 'feedback') wrapper.innerHTML = getStudentFeedbackHTML();
        else if (viewId === 'attendance') wrapper.innerHTML = getStudentAttendanceHTML();
        else if (viewId === 'studyhub') wrapper.innerHTML = getStudentStudyHubHTML();
        else wrapper.innerHTML = `<div><h2>${studentRoutes.find(r => r.id === viewId).label}</h2><p>Under construction...</p></div>`;
    }

    mainEl.appendChild(wrapper);

    // Attach dynamically generated view event listeners
    if (State.currentUser.role === 'teacher') {
        if (viewId === 'dashboard') bindTeacherDashboardEvents();
        if (viewId === 'students') bindTeacherStudentsEvents();
        if (viewId === 'courses') bindTeacherCoursesEvents();
        if (viewId === 'marks') bindTeacherMarksEvents();
        if (viewId === 'timetable') bindTeacherTimetableEvents();
        if (viewId === 'exams') bindTeacherExamsEvents();
        if (viewId === 'assignments') bindTeacherAssignmentsEvents();
        if (viewId === 'notifications') bindTeacherNotificationsEvents();
        if (viewId === 'predictions') bindTeacherPredictionsEvents();
        if (viewId === 'attendance') bindTeacherAttendanceEvents();
        if (viewId === 'alerts') bindTeacherAlertsEvents();
    } else {
        if (viewId === 'dashboard') bindStudentDashboardEvents();
        if (viewId === 'studyhub') bindStudentStudyHubEvents();
        if (viewId === 'feedback') bindStudentFeedbackEvents();
    }
}

// Landing Page Functions
window.showLoginForm = function() {
    State.isLandingPage = false;
    renderApp();
};

function getLandingPageHTML() {
    return `
        <div class="animate-fade" style="min-height: 100vh; display: flex; flex-direction: column;">
            
            <!-- Navbar -->
            <header style="padding: 1.5rem 3rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 100;">
                <div style="display: flex; align-items: center; gap: 0.8rem; font-size: 1.5rem; font-weight: bold;">
                    <i class="fa-solid fa-graduation-cap" style="color: var(--accent);"></i>
                    EduManage
                </div>
                <button onclick="showLoginForm()" style="padding: 0.6rem 1.5rem; font-weight: 600;">
                    Login Portal <i class="fa-solid fa-arrow-right" style="margin-left: 0.5rem;"></i>
                </button>
            </header>

            <!-- Hero Section -->
            <section style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 4rem 2rem; position: relative; overflow: hidden;">
                <!-- Decorative background elements -->
                <div style="position: absolute; top: -10%; left: -5%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%); border-radius: 50%; pointer-events: none;"></div>
                <div style="position: absolute; bottom: -10%; right: -5%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(76,250,151,0.1) 0%, rgba(0,0,0,0) 70%); border-radius: 50%; pointer-events: none;"></div>
                
                <div style="max-width: 1200px; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; z-index: 1;">
                    <div>
                        <h1 style="font-size: 3.5rem; line-height: 1.2; margin-bottom: 1.5rem; font-weight: 800; background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            Empower Education with EduManage.
                        </h1>
                        <p style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 2.5rem; line-height: 1.6;">
                            A next-generation Student Management System bridging the gap between teachers and students through real-time tracking, gamified study hubs, and intelligent analytics.
                        </p>
                        <div style="display: flex; gap: 1rem;">
                            <button onclick="showLoginForm()" style="padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);">
                                Get Started
                            </button>
                            <a href="#features" style="display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; font-size: 1.1rem; color: white; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; text-decoration: none; transition: 0.3s;">
                                Explore Features
                            </a>
                        </div>
                    </div>
                    
                    <!-- Hero Image Container -->
                    <div style="position: relative;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(45deg, var(--accent), var(--success)); filter: blur(30px); opacity: 0.2; border-radius: 20px;"></div>
                        <img src="hero_landing.png" alt="EduManage Dashboard" style="width: 100%; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.4); position: relative; z-index: 2;">
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section id="features" style="padding: 6rem 2rem; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.02);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 4rem;">
                        <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">Everything you need to succeed</h2>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">Powerful tools designed for modern educators and ambitious students.</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                        <div class="glass-card" style="padding: 2rem; transition: transform 0.3s; cursor: default;">
                            <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1.5rem;">
                                <i class="fa-solid fa-chart-line"></i>
                            </div>
                            <h3 style="margin-bottom: 1rem; font-size: 1.3rem;">Intelligent Analytics</h3>
                            <p style="color: var(--text-secondary); line-height: 1.5;">Real-time performance radar charts, automated exam countdowns, and instant mark ledgers to track academic growth effortlessly.</p>
                        </div>
                        
                        <div class="glass-card" style="padding: 2rem; transition: transform 0.3s; cursor: default;">
                            <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(76, 250, 151, 0.1); color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1.5rem;">
                                <i class="fa-solid fa-gamepad"></i>
                            </div>
                            <h3 style="margin-bottom: 1rem; font-size: 1.3rem;">Gamified Study Hub</h3>
                            <p style="color: var(--text-secondary); line-height: 1.5;">Built-in focus timers and study to-do lists that reward students with XP points and global leaderboard rankings.</p>
                        </div>
                        
                        <div class="glass-card" style="padding: 2rem; transition: transform 0.3s; cursor: default;">
                            <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(250, 76, 107, 0.1); color: var(--danger); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1.5rem;">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <h3 style="margin-bottom: 1rem; font-size: 1.3rem;">At-Risk Monitoring</h3>
                            <p style="color: var(--text-secondary); line-height: 1.5;">Automated detection of students with low attendance or failing marks, complete with an intervention tracking system.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Footer -->
            <footer style="padding: 2rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); color: var(--text-secondary); font-size: 0.9rem;">
                <p>&copy; 2026 EduManage System. All rights reserved.</p>
            </footer>

        </div>
    `;
}
