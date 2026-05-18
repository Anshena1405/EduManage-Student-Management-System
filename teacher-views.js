// ------------ Teacher Views Functions ------------

function getTeacherDashboardHTML() {
    // Current Period Logic
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    
    const h = now.getHours();
    const m = now.getMinutes();
    const timeInMins = h * 60 + m;

    let periodName = null;
    if (timeInMins >= 9*60 && timeInMins < 9*60+50) periodName = '1st';
    else if (timeInMins >= 9*60+50 && timeInMins < 10*60+40) periodName = '2nd';
    else if (timeInMins >= 10*60+40 && timeInMins < 11*60) periodName = 'Break';
    else if (timeInMins >= 11*60 && timeInMins < 11*60+45) periodName = '3rd';
    else if (timeInMins >= 11*60+45 && timeInMins < 12*60+35) periodName = '4th';
    else if (timeInMins >= 12*60+35 && timeInMins < 13*60+20) periodName = 'Lunch';
    else if (timeInMins >= 13*60+20 && timeInMins < 14*60+10) periodName = '5th';
    else if (timeInMins >= 14*60+10 && timeInMins < 15*60) periodName = '6th';
    else if (timeInMins >= 15*60 && timeInMins < 15*60+15) periodName = 'Break';
    else if (timeInMins >= 15*60+15 && timeInMins < 16*60) periodName = '7th';

    let periodDisplay = '';
    if (currentDay === 'Sunday' || currentDay === 'Saturday') {
        periodDisplay = `<div style="color: var(--text-secondary);"><i class="fa-solid fa-moon"></i> Weekend</div>`;
    } else if (timeInMins < 9*60) {
        let firstPeriod = State.timetables.find(t => t.day === currentDay && t.period === '1st');
        let subject = firstPeriod && firstPeriod.subject ? firstPeriod.subject : 'Free';
        periodDisplay = `
            <div style="color: var(--warning); font-weight: bold; font-size: 1.1rem; margin-bottom: 0.3rem;"><i class="fa-solid fa-sun"></i> Before School</div>
            <div style="color: var(--text-secondary);">Up Next (1st): <span style="color: #fff; font-weight: 500;">${subject}</span></div>
        `;
    } else if (timeInMins >= 16*60) {
        periodDisplay = `<div style="color: var(--text-secondary);"><i class="fa-solid fa-moon"></i> School is over for today</div>`;
    } else if (periodName === 'Break' || periodName === 'Lunch') {
        periodDisplay = `<div style="color: var(--warning); font-weight: bold;"><i class="fa-solid fa-mug-hot"></i> Current Period: ${periodName}</div>`;
    } else {
        let currentRecord = State.timetables.find(t => t.day === currentDay && t.period === periodName);
        let subject = currentRecord && currentRecord.subject ? currentRecord.subject : 'Free';
        periodDisplay = `
            <div style="color: var(--accent); font-weight: bold; font-size: 1.1rem; margin-bottom: 0.3rem;"><i class="fa-solid fa-clock"></i> Period ${periodName}</div>
            <div style="color: var(--text-secondary);">Subject: <span style="color: #fff; font-weight: 500;">${subject}</span></div>
        `;
    }

    // Today's Attendance Summary
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysAttendance = State.attendance ? State.attendance.filter(a => a.date === todayStr) : [];
    
    let attendanceCardHTML = '';
    if (todaysAttendance.length === 0) {
        attendanceCardHTML = `<p style="color: var(--text-secondary); margin-top: 1rem;"><i class="fa-solid fa-circle-exclamation"></i> Attendance not marked for today yet.</p>`;
    } else {
        const absentees = todaysAttendance.filter(a => a.status === false);
        const presentCount = todaysAttendance.filter(a => a.status === true).length;
        const absentCount = absentees.length;
        
        let absentNames = absentees.map(a => {
            const student = State.students.find(s => s.id === a.studentId);
            return student ? student.name : 'Unknown';
        }).join(', ');

        if (absentCount === 0) {
            attendanceCardHTML = `
                <div class="flex items-center gap-2" style="margin-top: 1rem; margin-bottom: 0.5rem;">
                    <span class="badge success" style="font-size: 1rem; padding: 0.5rem 1rem;"><i class="fa-solid fa-check-circle"></i> All Present</span>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">Present: ${presentCount} | Absent: 0</div>
            `;
        } else {
            attendanceCardHTML = `
                <div style="display: flex; gap: 1rem; margin-top: 1rem; margin-bottom: 1rem;">
                    <div style="background: rgba(76, 250, 151, 0.1); color: var(--success); padding: 0.5rem 1rem; border-radius: 6px; font-weight: bold;">
                        Present: ${presentCount}
                    </div>
                    <div style="background: rgba(250, 76, 107, 0.1); color: var(--danger); padding: 0.5rem 1rem; border-radius: 6px; font-weight: bold;">
                        Absent: ${absentCount}
                    </div>
                </div>
                <div style="font-size: 0.9rem; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                    <strong style="color: var(--danger); display: block; margin-bottom: 0.5rem;"><i class="fa-solid fa-user-xmark"></i> Absentees:</strong>
                    <span style="color: var(--text-secondary); line-height: 1.5;">${absentNames}</span>
                </div>
            `;
        }
    }

    // New: To-Do List
    let todos = State.todos || [];
    todos.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    let todoItemsHTML = todos.map(t => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 0.5rem 1rem; border-radius: 6px; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-grow: 1;">
                <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTodoStatus('${t.id}', this.checked)" style="accent-color: var(--accent); transform: scale(1.2); cursor: pointer;">
                <span style="${t.completed ? 'text-decoration: line-through; color: var(--text-secondary);' : ''}">${t.text}</span>
            </div>
            <button onclick="deleteTodo('${t.id}')" style="background: transparent; color: var(--danger); padding: 0.2rem; min-width: auto; box-shadow: none;"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');

    if (todos.length === 0) todoItemsHTML = `<p style="color: var(--text-secondary); text-align: center; margin-top: 1rem;">No tasks pending. You're all caught up!</p>`;

    let todoHTML = `
        <div class="glass-card" style="display: flex; flex-direction: column; height: 100%;">
            <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-list-check"></i> To-Do List</h3>
            <div style="flex-grow: 1; overflow-y: auto; max-height: 250px; margin-bottom: 1rem;">
                ${todoItemsHTML}
            </div>
            <form id="addTodoForm" style="display: flex; gap: 0.5rem; margin-top: auto;">
                <input type="text" id="newTodoInput" placeholder="Add a new task..." required style="flex-grow: 1; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-subtle); background: rgba(0,0,0,0.2); color: white;">
                <button type="submit" style="padding: 0.5rem 1rem;"><i class="fa-solid fa-plus"></i></button>
            </form>
        </div>
    `;

    // New: Upcoming Exams Countdown
    const upcomingExams = State.exams ? State.exams.filter(e => e.date && e.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date)) : [];
    
    let countdownHTML = '';
    if (upcomingExams.length === 0) {
        countdownHTML = `
            <div class="glass-card text-center" style="border-top: 3px solid var(--success); display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <h3 style="margin-bottom: 1rem;">Next Exam</h3>
                <i class="fa-solid fa-face-smile" style="font-size: 2.5rem; color: var(--success); margin-bottom: 0.5rem;"></i>
                <p style="color: var(--text-secondary);">No upcoming exams scheduled.</p>
            </div>
        `;
    } else {
        const nextExam = upcomingExams[0];
        const nextDate = new Date(nextExam.date);
        const todayDate = new Date(todayStr);
        const diffTime = nextDate - todayDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const c = State.courses.find(course => course.id === nextExam.courseId);
        const courseName = c ? c.name : 'Course';
        
        let daysText = diffDays === 0 ? '<span style="color: var(--danger); animation: pulse 2s infinite;">TODAY</span>' : `${diffDays} Days`;
        
        countdownHTML = `
            <div class="glass-card" style="border-top: 3px solid var(--accent); text-align: center; display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <h3 style="margin-bottom: 1rem;">Next Exam</h3>
                <div style="font-size: 2.5rem; font-weight: bold; color: var(--accent); line-height: 1;">${daysText}</div>
                <div style="font-size: 1.1rem; font-weight: 600; margin-top: 0.5rem;">${nextExam.testName}</div>
                <div style="color: var(--text-secondary); margin-top: 0.2rem;">${courseName}</div>
            </div>
        `;
    }

    // New: Chart container
    let chartHTML = `
        <div class="glass-card" style="grid-column: span 2;">
            <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-chart-simple"></i> Class Performance (Averages)</h3>
            <div style="height: 150px;">
                <canvas id="dashboardPerformanceChart" style="width: 100%; height: 100%;"></canvas>
            </div>
        </div>
    `;

    return `
        <div>
            <h1>Overview</h1>
            <p style="margin-bottom: 2rem;">Welcome back, ${State.currentUser.name}!</p>
            
            <div class="dashboard-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Total Students</div>
                        <div class="stat-value">${State.students.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(76, 250, 151, 0.1); color: var(--success);"><i class="fa-solid fa-book"></i></div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Total Courses</div>
                        <div class="stat-value">${State.courses.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(250, 204, 76, 0.1); color: var(--warning);"><i class="fa-solid fa-clipboard-list"></i></div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Active Assignments</div>
                        <div class="stat-value">${State.assignments.length}</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid" style="margin-bottom: 2rem;">
                ${chartHTML}
                ${todoHTML}
            </div>

            <div class="dashboard-grid">
                <div class="glass-card" style="border-top: 3px solid var(--accent);">
                    <h3 style="margin-bottom: 1rem;">Live Schedule</h3>
                    ${periodDisplay}
                </div>
                <div class="glass-card">
                    <h3 style="margin-bottom: 0;">Today's Attendance</h3>
                    ${attendanceCardHTML}
                </div>
                ${countdownHTML}
            </div>
        </div>
    `;
}

function bindTeacherDashboardEvents() {
    const ctx = document.getElementById('dashboardPerformanceChart');
    if (ctx && State.courses && State.marks) {
        let labels = [];
        let data = [];
        
        State.courses.forEach(c => {
            labels.push(c.name);
            const cMarks = State.marks.filter(m => m.courseId === c.id);
            const avg = cMarks.length > 0 ? (cMarks.reduce((acc, m) => acc + Number(m.mark), 0) / cMarks.length) : 0;
            data.push(avg.toFixed(1));
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Class Average',
                    data: data,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    const addTodoForm = document.getElementById('addTodoForm');
    if (addTodoForm) {
        addTodoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('newTodoInput');
            const text = input.value.trim();
            if (!text) return;
            
            const btn = e.target.querySelector('button');
            const origHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;

            try {
                await db.collection('todos').add({
                    text: text,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
            } catch (err) {
                console.error(err);
                alert("Failed to add task.");
                btn.innerHTML = origHTML;
                btn.disabled = false;
            }
        });
    }

    window.toggleTodoStatus = async function(id, isCompleted) {
        try {
            await db.collection('todos').doc(id).update({ completed: isCompleted });
        } catch (err) { console.error("Failed to update todo", err); }
    };

    window.deleteTodo = async function(id) {
        try {
            await db.collection('todos').doc(id).delete();
        } catch (err) { console.error("Failed to delete todo", err); }
    };
}

function getTeacherStudentsHTML() {
    let rows = State.students.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.roll_number}</td>
            <td><span class="badge success">Active</span></td>
            <td>
                <button class="secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; color: var(--danger);" onclick="deleteStudent('${s.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;">
                <h1>Manage Students</h1>
                <p>Add and view all enrolled students. Roll number functions as their username and password.</p>
            </div>

            <div class="glass-card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-user-plus" style="margin-right: 0.5rem; color: var(--accent);"></i> Add New Student</h3>
                <form id="addStudentForm" class="flex items-center gap-2">
                    <div style="flex: 1;">
                        <input type="text" id="newStudentName" placeholder="Student Full Name" required>
                    </div>
                    <div style="flex: 1;">
                        <input type="text" id="newStudentRoll" placeholder="Roll Number (Used for Login)" required>
                    </div>
                    <button type="submit"><i class="fa-solid fa-plus"></i> Add Student</button>
                </form>
            </div>

            <div class="glass-card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-file-csv" style="margin-right: 0.5rem; color: var(--accent);"></i> Bulk Upload Students (CSV)</h3>
                <form id="bulkUploadForm" class="flex items-center gap-2">
                    <div style="flex: 1;">
                        <input type="file" id="bulkUploadFile" accept=".csv" required style="width: 100%;">
                    </div>
                    <button type="submit"><i class="fa-solid fa-upload"></i> Upload CSV</button>
                </form>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.8rem;">
                    <strong>CSV Format:</strong> Ensure the file has no headers. First column should be <b>Name</b>, Second column should be <b>Roll Number</b>.
                </p>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Roll Number</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || '<tr><td colspan="4" class="text-center" style="padding: 2rem;">No students found</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function bindTeacherStudentsEvents() {
    document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newStudentName').value;
        const roll = document.getElementById('newStudentRoll').value;

        if (State.students.find(s => s.roll_number === roll)) {
            alert('A student with this roll number already exists!');
            return;
        }

        try {
            await db.collection('students').add({
                name: name,
                roll_number: roll,
                password: roll // As per requirement
            });
            e.target.reset(); // clear the form so the user knows it worked
            // Let Firestore snapshot trigger the UI update!
        } catch (err) {
            console.error(err);
            alert("Failed to add student to Firestore. Error: " + err.message);
        }
    });

    document.getElementById('bulkUploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('bulkUploadFile');
        const file = fileInput.files[0];
        if (!file) return;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
        submitBtn.disabled = true;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csvData = event.target.result;
            const lines = csvData.split('\\n');
            let addedCount = 0;
            let errorCount = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const parts = line.split(',');
                if (parts.length < 2) continue;

                const name = parts[0].trim();
                const roll = parts[1].trim();

                if (State.students.find(s => s.roll_number === roll)) {
                    errorCount++;
                    continue;
                }

                try {
                    await db.collection('students').add({
                        name: name,
                        roll_number: roll,
                        password: roll
                    });
                    addedCount++;
                } catch (err) {
                    console.error("Failed to add student from CSV:", err);
                    errorCount++;
                }
            }
            
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            alert(`Bulk upload complete!\\nSuccessfully added: ${addedCount} students.\\nSkipped (already exists) or Errors: ${errorCount}.`);
            e.target.reset();
        };
        
        reader.onerror = () => {
            alert("Failed to read file!");
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        };
        
        reader.readAsText(file);
    });
}
window.deleteStudent = async function (id) {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
        await db.collection('students').doc(id).delete();
    } catch (err) {
        console.error(err);
    }
};

function getTeacherCoursesHTML() {
    let rows = State.courses.map(c => `
        <tr>
            <td>${c.code}</td>
            <td>${c.name}</td>
            <td><span class="badge success">Active</span></td>
            <td>
                <button class="secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; color: var(--danger);" onclick="deleteCourse('${c.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;"><h1>Manage Courses</h1></div>
            <div class="glass-card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">Add Course</h3>
                <form id="addCourseForm" class="flex gap-2">
                    <input type="text" id="courseCode" placeholder="Course Code (e.g., CS101)" required style="flex: 1;">
                    <input type="text" id="courseName" placeholder="Course Name" required style="flex: 2;">
                    <button type="submit">Add Course</button>
                </form>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Course Code</th><th>Course Name</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="4" class="text-center">No courses</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}

function bindTeacherCoursesEvents() {
    document.getElementById('addCourseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('courseCode').value;
        const name = document.getElementById('courseName').value;
        if (State.courses.find(c => c.code === code)) { alert('Course Code exists!'); return; }

        try {
            await db.collection('courses').add({ code, name });
        } catch (err) { console.error(err); }
    });
}
window.deleteCourse = async function (id) {
    try { await db.collection('courses').doc(id).delete(); } catch (err) { console.error(err); }
}

function getTeacherMarksHTML() {
    let courseOptions = State.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    let courseHeaders = `<th>Student Name</th>` + State.courses.map(c => `<th>${c.name}</th>`).join('');

    let cat1Rows = State.students.map(s => {
        let tds = State.courses.map(c => {
            let m = State.marks.find(x => x.studentId === s.id && x.courseId === c.id && x.testName === 'CAT 1');
            return `<td style="${m ? 'font-weight: 600;' : 'color: var(--text-secondary);'}">${m ? m.mark : '-'}</td>`;
        }).join('');
        return `<tr><td style="font-weight: bold;">${s.name}</td>${tds}</tr>`;
    }).join('');

    let cat2Rows = State.students.map(s => {
        let tds = State.courses.map(c => {
            let m = State.marks.find(x => x.studentId === s.id && x.courseId === c.id && x.testName === 'CAT 2');
            return `<td style="${m ? 'font-weight: 600;' : 'color: var(--text-secondary);'}">${m ? m.mark : '-'}</td>`;
        }).join('');
        return `<tr><td style="font-weight: bold;">${s.name}</td>${tds}</tr>`;
    }).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;">
                <h1>Allocate Marks</h1>
                <p>Select a course and a test to manage marks for all students at once.</p>
            </div>
            
            <div class="glass-card" style="margin-bottom: 2rem;">
                <form id="selectTestForm" class="flex items-center gap-2">
                    <select id="markCourse" required style="flex: 1;"><option value="">Select Course...</option>${courseOptions}</select>
                    <select id="testName" required style="flex: 1;">
                        <option value="">Select Test...</option>
                        <option value="CAT 1">CAT 1</option>
                        <option value="CAT 2">CAT 2</option>
                    </select>
                    <button type="submit"><i class="fa-solid fa-list-check"></i> Load/Create Test</button>
                </form>
            </div>

            <div id="markAllocationContainer" style="display: none; margin-bottom: 2rem;">
                <div class="glass-card">
                    <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                        <h3 id="markTableTitle">Manage Marks</h3>
                        <button id="saveAllMarksBtn" style="background: rgba(76, 250, 151, 0.15); color: var(--success); border: 1px solid var(--success);"><i class="fa-solid fa-floppy-disk"></i> Save Marks</button>
                    </div>
                    <div class="table-container" style="box-shadow: none; margin-top: 0;">
                        <table>
                            <thead><tr><th>Student Name</th><th>Roll Number</th><th>Mark (out of 100)</th></tr></thead>
                            <tbody id="markAllocationBody">
                                <!-- Populated dynamically by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div id="noStudentsMsg" style="display: none;" class="glass-card text-center" style="margin-bottom: 2rem;">
                <p style="color: var(--warning);">No students are enrolled to allocate marks.</p>
            </div>

            <!-- Ledger Tables -->
            <div style="margin-bottom: 2rem;">
                <h2>Mark Ledgers</h2>
                <p>Comprehensive overview of all allocated marks.</p>
            </div>

            <div class="glass-card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">CAT 1 Results</h3>
                <div class="table-container" style="margin-top: 0; overflow-x: auto; white-space: nowrap;">
                    <table>
                        <thead><tr>${courseHeaders}</tr></thead>
                        <tbody>${cat1Rows || `<tr><td colspan="${State.courses.length + 1}" class="text-center">No students found</td></tr>`}</tbody>
                    </table>
                </div>
            </div>

            <div class="glass-card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">CAT 2 Results</h3>
                <div class="table-container" style="margin-top: 0; overflow-x: auto; white-space: nowrap;">
                    <table>
                        <thead><tr>${courseHeaders}</tr></thead>
                        <tbody>${cat2Rows || `<tr><td colspan="${State.courses.length + 1}" class="text-center">No students found</td></tr>`}</tbody>
                    </table>
                </div>
            </div>

            <div class="glass-card text-center" style="margin-top: 3rem; border: 1px solid var(--danger); background: rgba(250, 76, 107, 0.05);">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--danger);">Danger Zone</h3>
                <p style="margin-top: 0.5rem; margin-bottom: 1rem; color: var(--text-secondary);">This action will permanently delete all marks for all students. Proceed with caution.</p>
                <button onclick="clearAllMarks()" style="background: var(--danger); border: none;"><i class="fa-solid fa-trash"></i> Clear All Marks (New Semester)</button>
            </div>
        </div>
    `;
}

function bindTeacherMarksEvents() {
    let currentCourseId = null;
    let currentTestName = null;

    document.getElementById('selectTestForm').addEventListener('submit', (e) => {
        e.preventDefault();
        currentCourseId = document.getElementById('markCourse').value;
        currentTestName = document.getElementById('testName').value;

        const tableBody = document.getElementById('markAllocationBody');
        const container = document.getElementById('markAllocationContainer');
        const noStudentsMsg = document.getElementById('noStudentsMsg');
        
        if (State.students.length === 0) {
            container.style.display = 'none';
            noStudentsMsg.style.display = 'block';
            return;
        }

        const courseName = State.courses.find(c => c.id === currentCourseId).name;
        document.getElementById('markTableTitle').innerText = `${courseName} - ${currentTestName}`;

        let rowsHTML = '';
        State.students.forEach(student => {
            // Check if there is an existing mark for this student + course + test combo
            const existingMarkData = State.marks.find(m => m.studentId === student.id && m.courseId === currentCourseId && m.testName === currentTestName);
            const markValue = existingMarkData ? existingMarkData.mark : '';

            rowsHTML += `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.roll_number}</td>
                    <td>
                        <input type="number" 
                               class="bulk-mark-input" 
                               data-student-id="${student.id}" 
                               data-existing-id="${existingMarkData ? existingMarkData.id : ''}"
                               value="${markValue}" 
                               placeholder="0 - 100" 
                               min="0" 
                               max="100" 
                               style="width: 120px; text-align: center; font-weight: bold;">
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = rowsHTML;
        container.style.display = 'block';
        noStudentsMsg.style.display = 'none';
    });

    document.getElementById('saveAllMarksBtn').addEventListener('click', async () => {
        if (!currentCourseId || !currentTestName) return;

        const inputs = document.querySelectorAll('.bulk-mark-input');
        const saveBtn = document.getElementById('saveAllMarksBtn');
        const originalBtnHTML = saveBtn.innerHTML;
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            const batchPromises = [];

            inputs.forEach(input => {
                const markVal = input.value;
                if (markVal === '') return; // Skip empty inputs entirely

                const parsedMark = parseInt(markVal);
                const studentId = input.getAttribute('data-student-id');
                const existingId = input.getAttribute('data-existing-id');

                if (existingId) {
                    batchPromises.push(db.collection('marks').doc(existingId).update({ mark: parsedMark }));
                } else {
                    batchPromises.push(db.collection('marks').add({ 
                        studentId: studentId, 
                        courseId: currentCourseId, 
                        testName: currentTestName,
                        mark: parsedMark 
                    }));
                }
            });

            await Promise.all(batchPromises);
            
            alert(`Marks for ${currentTestName} saved successfully!`);
            
            // To ensure internal data attributes are fresh, we simulate clicking Load Test again
            document.getElementById('selectTestForm').dispatchEvent(new Event('submit'));

        } catch (err) {
            console.error(err);
            alert("Error saving marks. Please check console.");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHTML;
        }
    });
}

window.clearAllMarks = async function() {
    if (!confirm("WARNING: Are you sure you want to clear ALL marks for ALL students? This cannot be undone.")) return;
    try {
        const snapshot = await db.collection('marks').get();
        if (snapshot.empty) {
            alert("No marks currently exist in the database.");
            return;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit(); // Note: Firestore batches are limited to 500 operations. Fine for moderate sized projects.
        alert(`Semester Reset Complete! Deleted ${snapshot.size} mark records.`);
    } catch (err) {
        console.error(err);
        alert("Failed to clear marks: " + err.message);
    }
}

function getTeacherTimetableHTML() {
    let courseOptionsHTML = `<option value="">-- Free --</option>` + State.courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    const getSelectHTML = (day, period) => {
        let currentRecord = State.timetables.find(t => t.day === day && t.period === period);
        let selectedSubj = currentRecord ? currentRecord.subject : '';
        let replacedOpts = courseOptionsHTML;
        if (selectedSubj) replacedOpts = replacedOpts.replace(`value="${selectedSubj}"`, `value="${selectedSubj}" selected`);
        return `<select class="timetable-select" data-day="${day}" data-period="${period}" style="padding: 0.2rem; min-width: 80px;">${replacedOpts}</select>`;
    };
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let rows = days.map(day => `
        <tr>
            <td style="font-weight: 600;">${day}</td>
            <td>${getSelectHTML(day, '1st')}</td>
            <td>${getSelectHTML(day, '2nd')}</td>
            <td style="background: rgba(255,255,255,0.02); text-align: center; color: var(--text-secondary);">Break</td>
            <td>${getSelectHTML(day, '3rd')}</td>
            <td>${getSelectHTML(day, '4th')}</td>
            <td style="background: rgba(255,255,255,0.02); text-align: center; color: var(--text-secondary);">Lunch</td>
            <td>${getSelectHTML(day, '5th')}</td>
            <td>${getSelectHTML(day, '6th')}</td>
            <td style="background: rgba(255,255,255,0.02); text-align: center; color: var(--text-secondary);">Break</td>
            <td>${getSelectHTML(day, '7th')}</td>
        </tr>
    `).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;">
                <h1>Weekly Timetable Matrix</h1>
                <p>Assign courses to fixed weekly periods.</p>
            </div>
            
            <div class="glass-card" style="margin-bottom: 2rem; overflow-x: auto;">
                <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                    <h3>Timetable Grid</h3>
                    <button id="saveTimetableBtn" style="background: rgba(76, 250, 151, 0.15); color: var(--success); border: 1px solid var(--success);"><i class="fa-solid fa-floppy-disk"></i> Save Timetable</button>
                </div>
                <div class="table-container" style="box-shadow: none; margin-top: 0;">
                    <table>
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>1st</th>
                                <th>2nd</th>
                                <th style="background: rgba(255,255,255,0.05); color: var(--accent);">Break</th>
                                <th>3rd</th>
                                <th>4th</th>
                                <th style="background: rgba(255,255,255,0.05); color: var(--warning);">Lunch</th>
                                <th>5th</th>
                                <th>6th</th>
                                <th style="background: rgba(255,255,255,0.05); color: var(--accent);">Break</th>
                                <th>7th</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>

            <div class="glass-card">
                <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-clock"></i> Period Timings</h3>
                <div style="display: flex; gap: 4rem; color: var(--text-secondary); line-height: 1.8;">
                    <ul style="list-style: none; padding: 0;">
                        <li><b>1st:</b> 9:00 to 9:50</li>
                        <li><b>2nd:</b> 9:50 to 10:40</li>
                        <li><b style="color: var(--accent);">Break:</b> 10:40 to 11:00</li>
                        <li><b>3rd:</b> 11:00 to 11:45</li>
                        <li><b>4th:</b> 11:45 to 12:35</li>
                    </ul>
                    <ul style="list-style: none; padding: 0;">
                        <li><b style="color: var(--warning);">Lunch:</b> 12:35 to 1:20</li>
                        <li><b>5th:</b> 1:20 to 2:10</li>
                        <li><b>6th:</b> 2:10 to 3:00</li>
                        <li><b style="color: var(--accent);">Break:</b> 3:00 to 3:15</li>
                        <li><b>7th:</b> 3:15 to 4:00</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}
function bindTeacherTimetableEvents() {
    document.getElementById('saveTimetableBtn').addEventListener('click', async () => {
        const btn = document.getElementById('saveTimetableBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            // First, delete old timetables
            const snapshot = await db.collection('timetables').get();
            const deleteBatch = db.batch();
            snapshot.docs.forEach(doc => { deleteBatch.delete(doc.ref); });
            await deleteBatch.commit();

            // Next, save new data
            const selects = document.querySelectorAll('.timetable-select');
            const addBatch = db.batch();
            let operations = 0;
            
            selects.forEach(select => {
                const subject = select.value;
                if (!subject) return; // Ignore Free periods
                const day = select.getAttribute('data-day');
                const period = select.getAttribute('data-period');
                
                const newDocRef = db.collection('timetables').doc();
                addBatch.set(newDocRef, { day, period, subject });
                operations++;
            });

            if (operations > 0) {
                await addBatch.commit();
            }
            alert('Timetable saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save timetable: ' + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

function getTeacherExamsHTML() {
    const courses = State.courses;
    
    let courseHeaders = courses.map(c => `<th>${c.name}</th>`).join('');
    
    const getCellHTML = (testName, courseId) => {
        let record = State.exams.find(e => e.testName === testName && e.courseId === courseId);
        let val = record ? record.date : '';
        return `<td><input type="date" class="exam-date-input" data-test="${testName}" data-course="${courseId}" value="${val}" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid var(--border-subtle); background: rgba(0,0,0,0.2); color: var(--text-primary); min-width: 140px;"></td>`;
    };

    let cat1Cells = courses.map(c => getCellHTML('CAT 1', c.id)).join('');
    let cat2Cells = courses.map(c => getCellHTML('CAT 2', c.id)).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;">
                <h1>Schedule Exams</h1>
                <p>Set exam dates for CAT 1 and CAT 2 across all subjects.</p>
            </div>
            <div class="glass-card" style="margin-bottom: 2rem; overflow-x: auto;">
                <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                    <h3>Exam Schedule Matrix</h3>
                    <button id="saveExamsBtn" style="background: rgba(76, 250, 151, 0.15); color: var(--success); border: 1px solid var(--success);"><i class="fa-solid fa-floppy-disk"></i> Save Schedule</button>
                </div>
                <div class="table-container" style="box-shadow: none; margin-top: 0;">
                    <table>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                ${courseHeaders}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight: bold; color: var(--accent);">CAT 1</td>
                                ${cat1Cells || '<td class="text-center text-secondary">No courses added yet.</td>'}
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: var(--accent);">CAT 2</td>
                                ${cat2Cells || '<td class="text-center text-secondary">No courses added yet.</td>'}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function bindTeacherExamsEvents() {
    document.getElementById('saveExamsBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('saveExamsBtn');
        const origText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            const inputs = document.querySelectorAll('.exam-date-input');
            const batch = db.batch();
            let operations = 0;

            const oldSnapshot = await db.collection('exams').get();
            oldSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                operations++;
            });

            inputs.forEach(input => {
                const date = input.value;
                if (!date) return;
                const testName = input.getAttribute('data-test');
                const courseId = input.getAttribute('data-course');
                
                const newRef = db.collection('exams').doc();
                batch.set(newRef, {
                    testName: testName,
                    courseId: courseId,
                    date: date
                });
                operations++;
            });

            if (operations > 0) {
                await batch.commit();
            }
            alert("Exam schedule saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save schedule.");
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    });
}

function getTeacherAssignmentsHTML() {
    let courseOptions = State.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    let rows = State.assignments.map(a => {
        const courseName = State.courses.find(c => c.id === a.courseId)?.name || 'Unknown';
        const subCount = State.submissions ? State.submissions.filter(s => s.assignmentId === a.id).length : 0;
        return `
            <tr>
                <td>${a.title}</td>
                <td>${courseName}</td>
                <td>${a.createdAt || 'N/A'}</td>
                <td><span class="badge warning">${a.deadline}</span></td>
                <td>
                    <button class="secondary" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;" onclick="viewSubmissions('${a.id}')">
                        <i class="fa-solid fa-eye"></i> Evaluate (${subCount})
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;">
                <h1>Assignments & Grading</h1>
                <p>Distribute tasks and grade received submissions.</p>
            </div>
            
            <div class="glass-card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-plus"></i> New Assignment</h3>
                <form id="giveAssignmentForm" class="flex-col gap-2">
                    <div class="flex gap-2">
                        <select id="asgCourse" required style="flex:1;"><option value="">Select Course...</option>${courseOptions}</select>
                        <input type="date" id="asgDeadline" required title="Deadline">
                    </div>
                    <input type="text" id="asgTitle" placeholder="Assignment Title" required>
                    <textarea id="asgDesc" placeholder="Detailed Description..." rows="3" required></textarea>
                    <button type="submit"><i class="fa-solid fa-paper-plane"></i> Publish Assignment</button>
                </form>
            </div>

            <div class="glass-card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-list-check"></i> Issued Assignments</h3>
                <div class="table-container" style="box-shadow: none; margin-top: 0;">
                    <table>
                        <thead><tr><th>Title</th><th>Course</th><th>Issued On</th><th>Deadline</th><th>Submissions</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="5" class="text-center">No assignments issued yet</td></tr>'}</tbody>
                    </table>
                </div>
            </div>

            <!-- Dynamic Submissions Panel injected here -->
            <div id="evaluationsContainer"></div>
        </div>
    `;
}
function bindTeacherAssignmentsEvents() {
    document.getElementById('giveAssignmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const origText = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';
        try {
            await db.collection('assignments').add({
                courseId: document.getElementById('asgCourse').value,
                deadline: document.getElementById('asgDeadline').value,
                title: document.getElementById('asgTitle').value,
                description: document.getElementById('asgDesc').value,
                createdAt: new Date().toISOString().split('T')[0]
            });
        } catch (err) { console.error(err); }
        finally { btn.disabled = false; btn.innerHTML = origText; }
    });
}

window.viewSubmissions = function(assignmentId) {
    const assignment = State.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const courseName = State.courses.find(c => c.id === assignment.courseId)?.name || 'Unknown';
    const subs = State.submissions ? State.submissions.filter(s => s.assignmentId === assignmentId) : [];
    
    const createdDate = assignment.createdAt ? new Date(assignment.createdAt) : new Date();
    const deadlineDate = new Date(assignment.deadline);

    let rows = subs.map(sub => {
        const student = State.students.find(s => s.id === sub.studentId);
        const subDate = new Date(sub.submissionDate);
        
        let diffTimeFromCreationToSub = subDate.getTime() - createdDate.getTime();
        let diffDaysFromCreation = Math.ceil(diffTimeFromCreationToSub / (1000 * 60 * 60 * 24));
        
        let suggestedRange = "0";
        let badgeColor = "danger";
        let isLate = subDate > deadlineDate;

        if (isLate) {
            suggestedRange = "0 (Late)";
        } else if (diffDaysFromCreation <= 5) {
            suggestedRange = "90 - 100";
            badgeColor = "success";
        } else {
            suggestedRange = "50 - 90";
            badgeColor = "warning";
        }

        let linkHTML = `<a href="${sub.fileData}" target="_blank" style="color:var(--accent); text-decoration:none;"><i class="fa-solid fa-cloud-arrow-down"></i> View Link</a>`;
        if (sub.fileData.startsWith('data:')) {
            linkHTML = `<button class="secondary" style="font-size:0.8rem; padding:0.2rem 0.4rem;" onclick='openBase64InTab("${student ? student.name : 'Unknown'}", "${sub.fileData}")'><i class="fa-solid fa-file"></i> Open File</button>`;
        }

        return `
            <tr>
                <td>${student ? student.name : 'Unknown Student'}</td>
                <td>${sub.submissionDate}</td>
                <td><span class="badge ${badgeColor}">${suggestedRange}</span></td>
                <td>${linkHTML}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <input type="number" id="mark_input_${sub.id}" value="${sub.mark !== null ? sub.mark : ''}" placeholder="Mark" style="width:70px; padding:0.3rem;" min="0" max="100">
                        <button class="success" style="padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="gradeSubmission('${sub.id}')"><i class="fa-solid fa-check"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const html = `
        <div class="glass-card animate-slide" style="border: 1px solid var(--accent); margin-bottom: 2rem;">
            <h3 style="margin-bottom: 0.5rem; color: var(--accent);"><i class="fa-solid fa-pen-to-square"></i> Evaluation Panel</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                <b>${assignment.title}</b> (${courseName}) <br>
                Issued: ${assignment.createdAt || 'N/A'} &nbsp;|&nbsp; Deadline: <span style="color:var(--warning);">${assignment.deadline}</span>
            </p>
            <div class="table-container" style="box-shadow: none; margin-top: 0;">
                <table>
                    <thead><tr><th>Student</th><th>Submitted On</th><th>Eligibility Range</th><th>File</th><th>Assign Mark</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="5" class="text-center">No submissions pending</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
    document.getElementById('evaluationsContainer').innerHTML = html;
};

window.openBase64InTab = function(studentName, dataUrl) {
    const win = window.open();
    if (!win) {
        alert("Pop-up blocked! Please allow pop-ups for this browser to view uploaded files.");
        return;
    }
    let type = dataUrl.split(';')[0].split(':')[1];
    if (type === 'application/pdf') {
        win.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
        win.document.write(`<img src="${dataUrl}" style="max-width:100%; border-radius:8px; display:block; margin:auto;">`);
    }
    win.document.title = studentName + " Submission";
};

window.gradeSubmission = async function(submissionId) {
    const markVal = document.getElementById('mark_input_' + submissionId).value;
    if (markVal === '') return;
    try {
        await db.collection('submissions').doc(submissionId).update({ mark: parseInt(markVal) });
    } catch (err) {
        console.error(err);
        alert("Failed to assign grade.");
    }
};

function getTeacherNotificationsHTML() {
    let rows = State.notifications.map(n => `
        <div class="glass-card" style="margin-bottom:1rem; padding: 1.5rem;">
            <div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:0.5rem;"><i class="fa-regular fa-clock"></i> ${n.date}</div>
            <div style="font-weight:500;">${n.message}</div>
        </div>
    `).reverse().join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;"><h1>Notifications</h1></div>
            <div class="glass-card" style="margin-bottom: 2rem;">
                <form id="sendNotifForm" class="flex gap-2">
                    <input type="text" id="notifMsg" placeholder="Announcement message..." required style="flex:1;">
                    <button type="submit">Send <i class="fa-solid fa-paper-plane"></i></button>
                </form>
            </div>
            <div>${rows || '<p class="text-center" style="color:var(--text-secondary);">No notifications.</p>'}</div>
        </div>
    `;
}
function bindTeacherNotificationsEvents() {
    document.getElementById('sendNotifForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await db.collection('notifications').add({
                message: document.getElementById('notifMsg').value,
                date: new Date().toISOString().split('T')[0]
            });
        } catch (err) { }
    });
}

function getTeacherFeedbackHTML() {
    let rows = State.feedback.map(f => {
        const student = State.students.find(s => s.id === f.studentId);
        return `
            <div class="glass-card" style="margin-bottom:1rem; padding: 1.5rem; position: relative;">
                <div style="font-size:0.9rem; color:var(--accent); font-weight:600; margin-bottom:0.5rem;"><i class="fa-solid fa-user"></i> ${student ? student.name : 'Unknown Student'} <span style="color:var(--text-secondary); font-weight:normal; font-size:0.8rem;">- ${f.date}</span></div>
                <div style="font-style:italic;">"${f.message}"</div>
                <button onclick="deleteFeedback('${f.id}')" style="position: absolute; top: 1rem; right: 1rem; background: transparent; color: var(--danger); padding: 0.5rem; min-width: auto; box-shadow: none;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    }).reverse().join('');
    return `
        <div>
            <div style="margin-bottom: 2rem;"><h1>Student Feedback</h1></div>
            <div>${rows || '<div class="glass-card text-center"><p style="color:var(--text-secondary);">No feedback available.</p></div>'}</div>
        </div>
    `;
}

window.deleteFeedback = async function(id) {
    if (confirm("Are you sure you want to delete this feedback?")) {
        try {
            await db.collection('feedback').doc(id).delete();
        } catch (e) {
            console.error(e);
            alert("Error deleting feedback");
        }
    }
};

function getTeacherPredictionsHTML() {
    // Mock predictive analysis based on marks
    let rows = State.students.map(s => {
        const sMarks = State.marks.filter(m => m.studentId === s.id);
        const avg = sMarks.length > 0 ? (sMarks.reduce((a, b) => a + b.mark, 0) / sMarks.length) : 0;
        let prediction = 'Insufficient Data';
        let badgeClass = '';
        if (sMarks.length > 0) {
            if (avg >= 85) { prediction = 'Excellent (Predicted A)'; badgeClass = 'success'; }
            else if (avg >= 60) { prediction = 'Good (Predicted B/C)'; badgeClass = 'warning'; }
            else { prediction = 'At Risk (Predicted D/F)'; badgeClass = 'danger'; }
        }
        return `
            <tr>
                <td>${s.name}</td>
                <td>${avg.toFixed(1)}</td>
                <td><span class="badge ${badgeClass}">${prediction}</span></td>
            </tr>
        `;
    }).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;">
                <h1>Analytical Predictions</h1>
                <p>AI-driven performance prognosis and statistical breakdowns.</p>
            </div>
            
            <div class="dashboard-grid" style="margin-bottom: 2rem;">
                <div class="glass-card" style="padding: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--text-secondary); text-align: center;">Student Risk Distribution</h3>
                    <canvas id="predictionsChart"></canvas>
                </div>
                <div class="glass-card" style="padding: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--text-secondary); text-align: center;">Subject Marks Distribution</h3>
                    <canvas id="subjectMarksChart"></canvas>
                </div>
            </div>

            <div class="glass-card">
                <h3 style="margin-bottom: 1rem;">Detailed Breakdown</h3>
                <div class="table-container" style="margin-top: 0; box-shadow: none;">
                    <table>
                        <thead><tr><th>Student</th><th>Average Mark</th><th>Performance Status</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="3" class="text-center">No prediction data</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function bindTeacherPredictionsEvents() {
    const ctx1 = document.getElementById('predictionsChart');
    const ctx2 = document.getElementById('subjectMarksChart');
    if (!ctx1 || !ctx2) return;
    
    // Compute data for Chart 1
    let excellent = 0, good = 0, risk = 0, noData = 0;
    State.students.forEach(s => {
        const sMarks = State.marks.filter(m => m.studentId === s.id);
        if (sMarks.length === 0) noData++;
        else {
            const avg = sMarks.reduce((a,b)=>a+b.mark, 0) / sMarks.length;
            if (avg >= 85) excellent++;
            else if (avg >= 60) good++;
            else risk++;
        }
    });

    // Chart 1: Bar Chart
    new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Excellent', 'Good', 'At Risk', 'No Data'],
            datasets: [{
                label: 'Number of Students',
                data: [excellent, good, risk, noData],
                backgroundColor: [
                    'rgba(76, 250, 151, 0.6)', 
                    'rgba(250, 204, 76, 0.6)', 
                    'rgba(250, 76, 107, 0.6)',
                    'rgba(255, 255, 255, 0.1)'
                ],
                borderColor: [
                    'rgba(76, 250, 151, 1)', 
                    'rgba(250, 204, 76, 1)', 
                    'rgba(250, 76, 107, 1)',
                    'rgba(255, 255, 255, 0.3)'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0b0', stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: '#a0a0b0' } }
            }
        }
    });

    // Chart 2: Line/Area Graph for Course Averages
    const courseLabels = [];
    const courseAvgs = [];
    
    State.courses.forEach(c => {
        const cMarks = State.marks.filter(m => m.courseId === c.id);
        const avg = cMarks.length > 0 ? (cMarks.reduce((a,b)=>a+b.mark, 0) / cMarks.length) : 0;
        courseLabels.push(c.name.substring(0, 15) + (c.name.length>15?'...':''));
        courseAvgs.push(avg);
    });

    new Chart(ctx2, {
        type: 'line',
        data: {
            labels: courseLabels,
            datasets: [{
                label: 'Average Score',
                data: courseAvgs,
                backgroundColor: 'rgba(107, 76, 250, 0.2)',
                borderColor: 'rgba(107, 76, 250, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(107, 76, 250, 1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0b0' } },
                x: { grid: { display: false }, ticks: { color: '#a0a0b0' } }
            }
        }
    });
}

function getTeacherAttendanceHTML() {
    // Get last 7 days for columns
    const today = new Date();
    const last7Days = [];
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    let distinctDates = [...new Set(State.attendance.map(a => a.date))].sort();
    let totalDays = distinctDates.length;

    // Calculate student stats
    let studentStats = State.students.map(s => {
        let presentCount = State.attendance.filter(a => a.studentId === s.id && a.status === true).length;
        let percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;
        return { ...s, presentCount, percentage };
    });

    // Sort by percentage highest first (lowest down)
    studentStats.sort((a, b) => b.percentage - a.percentage);

    let dateHeaders = last7Days.map(d => `<th>${d}</th>`).join('');

    let rows = studentStats.map(s => {
        let cellHTML = last7Days.map(d => {
            let record = State.attendance.find(a => a.studentId === s.id && a.date === d);
            if (!record) return `<td class="text-center" style="color: var(--text-secondary);">-</td>`;
            if (record.status) return `<td class="text-center" style="color: var(--success); font-weight: bold;">P</td>`;
            return `<td class="text-center" style="color: var(--danger); font-weight: bold;">A</td>`;
        }).join('');

        let pctColor = s.percentage < 75 ? 'var(--danger)' : (s.percentage > 90 ? 'var(--success)' : 'var(--warning)');

        return `
            <tr>
                <td>${s.name}</td>
                <td style="color: ${pctColor}; font-weight: bold;">${s.percentage}%</td>
                ${cellHTML}
            </tr>
        `;
    }).join('');

    let studentOptions = State.students.map(s => `<option value="${s.id}">${s.name} (${s.roll_number})</option>`).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;">
                <h1>Daily Attendance</h1>
                <p>Simple day-wise attendance tracking.</p>
            </div>
            
            <div class="glass-card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-clipboard-check" style="color: var(--accent);"></i> Quick Mark Attendance</h3>
                <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.9rem;">Select the date and ONLY the students who are <b>ABSENT</b>. Everyone else will be marked Present automatically.</p>
                <form id="quickAttendanceForm" class="flex-col gap-2">
                    <div class="flex gap-2">
                        <div style="flex: 1;">
                            <label style="display:block; margin-bottom:0.5rem; font-size: 0.85rem;">Date</label>
                            <input type="date" id="attDate" value="${today.toISOString().split('T')[0]}" required style="width: 100%;">
                        </div>
                        <div style="flex: 3;">
                            <label style="display:block; margin-bottom:0.5rem; font-size: 0.85rem;">Select Absentees (Hold Ctrl/Cmd to select multiple)</label>
                            <select id="attAbsentees" multiple style="width: 100%; height: 100px; padding: 0.5rem;">
                                ${studentOptions}
                            </select>
                        </div>
                    </div>
                    <button type="submit" style="align-self: flex-start; margin-top: 0.5rem;"><i class="fa-solid fa-floppy-disk"></i> Save Attendance</button>
                </form>
            </div>

            <div class="glass-card">
                <h3 style="margin-bottom: 1rem;">Attendance Ledger (Last 7 Days)</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">Overview of recent attendance records. To edit, submit the quick mark form again for that date.</p>
                <div class="table-container" style="box-shadow: none; margin-top: 0; overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Overall %</th>
                                ${dateHeaders}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows || '<tr><td colspan="9" class="text-center">No students found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function bindTeacherAttendanceEvents() {
    document.getElementById('quickAttendanceForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const date = document.getElementById('attDate').value;
        const select = document.getElementById('attAbsentees');
        const absentIds = Array.from(select.selectedOptions).map(opt => opt.value);

        try {
            const batch = db.batch();
            let operations = 0;

            const existingSnapshot = await db.collection('attendance').where('date', '==', date).get();
            const existingRecords = existingSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            State.students.forEach(s => {
                const isAbsent = absentIds.includes(s.id);
                const status = !isAbsent;

                const existing = existingRecords.find(r => r.studentId === s.id);
                if (existing) {
                    if (existing.status !== status) {
                        batch.update(db.collection('attendance').doc(existing.id), { status: status });
                        operations++;
                    }
                } else {
                    const newRef = db.collection('attendance').doc();
                    batch.set(newRef, {
                        studentId: s.id,
                        date: date,
                        status: status
                    });
                    operations++;
                }
            });

            if (operations > 0) {
                await batch.commit();
                alert('Attendance saved for ' + date + '!');
            } else {
                alert('No changes needed for ' + date + '.');
            }
            
            select.value = "";

        } catch (err) {
            console.error(err);
            alert("Failed to save attendance.");
        } finally {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    });
}

function getTeacherAlertsHTML() {
    let distinctDates = [...new Set(State.attendance.map(a => a.date))].sort();
    let totalDays = distinctDates.length;

    if (typeof window.showResolvedAlerts === 'undefined') {
        window.showResolvedAlerts = false;
    }

    let riskStudents = [];
    
    State.students.forEach(s => {
        let reasons = [];
        
        if (totalDays > 0) {
            let presentCount = State.attendance.filter(a => a.studentId === s.id && a.status === true).length;
            let percentage = Math.round((presentCount / totalDays) * 100);
            if (percentage < 75) {
                reasons.push(`<span style="color: var(--danger);"><i class="fa-solid fa-user-clock"></i> Low Attendance: <strong>${percentage}%</strong></span>`);
            }
        }
        
        let studentMarks = State.marks ? State.marks.filter(m => m.studentId === s.id) : [];
        studentMarks.forEach(m => {
            if (m.mark !== undefined && m.mark !== '' && m.mark !== null && Number(m.mark) < 45) {
                const c = State.courses.find(course => course.id === m.courseId);
                const courseName = c ? c.name : 'Unknown Course';
                reasons.push(`<span style="color: var(--danger);"><i class="fa-solid fa-file-circle-xmark"></i> Failed ${m.testName} in ${courseName}: <strong>${m.mark}/100</strong></span>`);
            }
        });

        if (reasons.length > 0) {
            let history = State.interventions ? State.interventions.filter(i => i.studentId === s.id).sort((a,b) => new Date(b.date) - new Date(a.date)) : [];
            let latestIntervention = history.length > 0 ? history[0] : null;
            let isResolved = latestIntervention && String(latestIntervention.progress) === '100';

            if (!isResolved || window.showResolvedAlerts) {
                riskStudents.push({ ...s, reasons, history, latestIntervention, isResolved });
            }
        }
    });

    let riskCards = riskStudents.map(s => {
        let historyHTML = s.history.map(h => `
            <div style="background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem; font-size: 0.85rem;">
                <div class="flex justify-between items-center">
                    <span style="color: var(--accent); font-weight: bold;">[${h.date}]</span>
                    <span class="badge ${String(h.progress) === '100' ? 'success' : 'warning'}" style="font-size: 0.7rem;">Progress: ${h.progress || 0}%</span>
                </div>
                <strong>${h.precautionType}</strong>
                <p style="margin-top: 0.2rem; color: var(--text-secondary);">${h.notes}</p>
            </div>
        `).join('');

        if (s.history.length === 0) historyHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary);">No previous interventions recorded.</p>`;

        let reasonsHTML = s.reasons.map(r => `<div style="margin-bottom: 0.3rem;">${r}</div>`).join('');
        
        let buttonHTML = '';
        if (s.isResolved) {
            buttonHTML = `<button class="secondary" style="border-color: var(--success); color: var(--success);" onclick="toggleActionForm('${s.id}')"><i class="fa-solid fa-check-circle"></i> Resolved</button>`;
        } else if (s.latestIntervention) {
            buttonHTML = `<button class="secondary" style="border-color: var(--warning); color: var(--warning);" onclick="toggleActionForm('${s.id}')"><i class="fa-solid fa-spinner fa-spin-pulse"></i> Action Taken (In Progress)</button>`;
        } else {
            buttonHTML = `<button class="secondary" onclick="toggleActionForm('${s.id}')"><i class="fa-solid fa-hand-holding-medical"></i> Take Action</button>`;
        }

        return `
            <div class="glass-card" style="border-left: 4px solid ${s.isResolved ? 'var(--success)' : 'var(--danger)'}; margin-bottom: 1rem; opacity: ${s.isResolved ? '0.7' : '1'};">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">${s.name} (${s.roll_number})</h3>
                        <div style="font-size: 0.9rem;">
                            ${reasonsHTML}
                        </div>
                    </div>
                    ${buttonHTML}
                </div>
                
                <div id="action_form_${s.id}" style="display: none; margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                    <div class="dashboard-grid">
                        <div>
                            <h4 style="margin-bottom: 0.5rem;"><i class="fa-solid fa-clock-rotate-left"></i> Intervention History</h4>
                            <div style="max-height: 250px; overflow-y: auto;">
                                ${historyHTML}
                            </div>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 0.5rem;"><i class="fa-solid fa-plus"></i> New Intervention</h4>
                            <form class="intervention-form" data-studentid="${s.id}">
                                <div style="margin-bottom: 0.5rem;">
                                    <label style="display:block; font-size: 0.85rem; margin-bottom: 0.2rem;">Precaution Taken</label>
                                    <select class="intervention-type" required style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid var(--border-subtle); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                                        <option value="">Select Precaution...</option>
                                        <option value="Called Parents">Called Parents</option>
                                        <option value="Counseling Given">Counseling Given</option>
                                        <option value="Extra Study Hour Assigned">Extra Study Hour Assigned</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div style="margin-bottom: 0.5rem;">
                                    <label style="display:block; font-size: 0.85rem; margin-bottom: 0.2rem;">Intervention Progress</label>
                                    <div class="flex items-center gap-2">
                                        <input type="range" class="intervention-progress" min="0" max="100" step="10" value="${s.latestIntervention && s.latestIntervention.progress ? s.latestIntervention.progress : 50}" style="flex-grow: 1;" oninput="this.nextElementSibling.innerText = this.value + '%'">
                                        <span style="font-weight: bold; width: 40px; text-align: right; color: var(--warning);">${s.latestIntervention && s.latestIntervention.progress ? s.latestIntervention.progress : 50}%</span>
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">Slide to 100% to mark as resolved and remove from alerts.</div>
                                </div>
                                <div style="margin-bottom: 0.5rem;">
                                    <label style="display:block; font-size: 0.85rem; margin-bottom: 0.2rem;">Feedback / Notes</label>
                                    <textarea class="intervention-notes" required placeholder="Details about the precaution taken..." rows="2" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid var(--border-subtle); background: rgba(0,0,0,0.2); color: var(--text-primary);"></textarea>
                                </div>
                                <button type="submit" style="width: 100%;"><i class="fa-solid fa-floppy-disk"></i> Save Action</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    let toggleBtnHTML = `
        <button class="secondary" onclick="toggleShowResolvedAlerts()" style="font-size: 0.85rem; border: 1px solid var(--border-subtle);">
            ${window.showResolvedAlerts ? '<i class="fa-solid fa-eye-slash"></i> Hide Resolved' : '<i class="fa-solid fa-eye"></i> Show Resolved'}
        </button>
    `;

    return `
        <div>
            <div class="flex justify-between items-center" style="margin-bottom: 2rem;">
                <div>
                    <h1 style="margin-bottom: 0.5rem;">At-Risk Students</h1>
                    <p>Monitor students with low attendance (&lt; 75%) or failing marks (&lt; 45) and track interventions.</p>
                </div>
                <div>
                    ${toggleBtnHTML}
                </div>
            </div>
            
            <div id="riskContainer">
                ${riskStudents.length > 0 ? riskCards : '<div class="glass-card text-center" style="border-color: var(--success);"><i class="fa-solid fa-shield-check" style="font-size: 3rem; color: var(--success); margin-bottom: 1rem;"></i><h3 style="color: var(--success);">All Clear</h3><p style="margin-top: 0.5rem;">No students are currently matching the at-risk criteria.</p></div>'}
            </div>
        </div>
    `;
}

function bindTeacherAlertsEvents() {
    window.toggleActionForm = function(studentId) {
        const formDiv = document.getElementById('action_form_' + studentId);
        if (formDiv.style.display === 'none') {
            formDiv.style.display = 'block';
        } else {
            formDiv.style.display = 'none';
        }
    };

    window.toggleShowResolvedAlerts = function() {
        window.showResolvedAlerts = !window.showResolvedAlerts;
        document.getElementById('app-content').innerHTML = getTeacherAlertsHTML();
        bindTeacherAlertsEvents();
    };

    const forms = document.querySelectorAll('.intervention-form');
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const studentId = e.target.getAttribute('data-studentid');
            const pType = e.target.querySelector('.intervention-type').value;
            const progress = e.target.querySelector('.intervention-progress').value;
            const notes = e.target.querySelector('.intervention-notes').value;
            const dateStr = new Date().toISOString().split('T')[0];

            try {
                await db.collection('interventions').add({
                    studentId: studentId,
                    date: dateStr,
                    precautionType: pType,
                    progress: progress,
                    notes: notes
                });
                alert("Intervention saved successfully!");
                // UI will automatically rerender due to Firebase snapshot listener attached in initFirebaseListeners
            } catch (err) {
                console.error(err);
                alert("Failed to save intervention.");
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        });
    });
}
