// ------------ Student Views Functions ------------

function getStudentDashboardHTML() {
    const sId = State.currentUser.id;
    const myMarksCount = State.marks.filter(m => m.studentId === sId).length;

    let distinctDates = [...new Set(State.attendance.map(a => a.date))].sort();
    let totalDays = distinctDates.length;
    let presentCount = State.attendance.filter(a => a.studentId === sId && a.status === true).length;
    let attPercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;
    let attColor = attPercentage < 75 ? 'var(--danger)' : (attPercentage > 90 ? 'var(--success)' : 'var(--warning)');

    // 1. At Risk Banner
    let warningBanner = '';
    if (attPercentage < 75) {
        warningBanner = `
            <div style="background: rgba(250, 76, 107, 0.15); border: 1px solid var(--danger); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--danger);"></i>
                <div>
                    <strong style="color: var(--danger); font-size: 1.1rem; display: block; margin-bottom: 0.2rem;">Attendance Warning</strong>
                    Your attendance is critically low (${attPercentage}%). Please attend classes to avoid administrative action.
                </div>
            </div>
        `;
    }

    // 2. Today's Schedule (Current Period)
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

    let scheduleHTML = '';
    if (currentDay === 'Sunday' || currentDay === 'Saturday') {
        scheduleHTML = `<div style="color: var(--text-secondary); text-align: center; margin-top: 1rem;"><i class="fa-solid fa-moon"></i> Weekend - No classes today</div>`;
    } else if (timeInMins < 9*60) {
        let firstPeriod = State.timetables.find(t => t.day === currentDay && t.period === '1st');
        let subject = firstPeriod && firstPeriod.subject ? firstPeriod.subject : 'Free';
        scheduleHTML = `
            <div style="color: var(--warning); font-weight: bold; font-size: 1.1rem; margin-bottom: 0.3rem;"><i class="fa-solid fa-sun"></i> Before School</div>
            <div style="color: var(--text-secondary);">Up Next (1st): <span style="color: #fff; font-weight: 500;">${subject}</span></div>
        `;
    } else if (timeInMins >= 16*60) {
        scheduleHTML = `<div style="color: var(--text-secondary); text-align: center; margin-top: 1rem;"><i class="fa-solid fa-moon"></i> School is over for today</div>`;
    } else if (periodName === 'Break' || periodName === 'Lunch') {
        scheduleHTML = `<div style="color: var(--warning); font-weight: bold;"><i class="fa-solid fa-mug-hot"></i> Current Period: ${periodName}</div>`;
    } else {
        let currentRecord = State.timetables.find(t => t.day === currentDay && t.period === periodName);
        let subject = currentRecord && currentRecord.subject ? currentRecord.subject : 'Free';
        scheduleHTML = `
            <div style="color: var(--accent); font-weight: bold; font-size: 1.2rem; margin-bottom: 0.3rem;"><i class="fa-solid fa-clock"></i> Period ${periodName}</div>
            <div style="color: var(--text-secondary); font-size: 1rem;">Subject: <span style="color: #fff; font-weight: 500;">${subject}</span></div>
        `;
    }

    // 3. Pending Assignments
    const mySubmissions = State.submissions ? State.submissions.filter(s => s.studentId === sId) : [];
    const pendingAssignments = State.assignments.filter(a => !mySubmissions.some(s => s.assignmentId === a.id));
    pendingAssignments.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

    let pendingAssigHTML = pendingAssignments.map(a => {
        const c = State.courses.find(course => course.id === a.courseId);
        const courseName = c ? c.name : 'Unknown Course';
        return `
            <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 6px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600;">${a.title}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${courseName} | Due: ${a.dueDate}</div>
                </div>
                <button onclick="navigate('assignments')" class="secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; min-width: auto; border-color: var(--accent); color: var(--accent);">Submit</button>
            </div>
        `;
    }).join('');

    if (pendingAssignments.length === 0) {
        pendingAssigHTML = `<p style="color: var(--success); text-align: center; margin-top: 1rem;"><i class="fa-solid fa-check-circle"></i> All caught up!</p>`;
    }

    // 4. Next Exam Countdown
    const todayStr = now.toISOString().split('T')[0];
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

    return `
        <div>
            <h1>Student Dashboard</h1>
            <p style="margin-bottom: 2rem;">Welcome, ${State.currentUser.name} (Roll No: ${State.currentUser.username})</p>
            
            ${warningBanner}
            
            <div class="dashboard-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fa-solid fa-bell"></i></div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Announcements</div>
                        <div class="stat-value">${State.notifications.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(250, 204, 76, 0.1); color: var(--warning);"><i class="fa-solid fa-clipboard-list"></i></div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Course Marks</div>
                        <div class="stat-value">${myMarksCount}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(76, 250, 151, 0.1); color: var(--success);"><i class="fa-solid fa-star"></i></div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Assignments</div>
                        <div class="stat-value">${State.assignments.length}</div>
                    </div>
                </div>
                <div class="stat-card" style="border-left: 4px solid ${attColor};">
                    <div class="stat-icon" style="background: rgba(255, 255, 255, 0.05); color: ${attColor};"><i class="fa-solid fa-user-check"></i></div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Attendance</div>
                        <div class="stat-value" style="color: ${attColor};">${attPercentage}%</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid" style="margin-bottom: 2rem;">
                <div class="glass-card" style="grid-column: span 2;">
                    <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-spider"></i> Personal Performance Radar</h3>
                    <div style="height: 300px; display: flex; justify-content: center; align-items: center;">
                        <canvas id="studentRadarChart"></canvas>
                    </div>
                </div>
                <div class="glass-card" style="display: flex; flex-direction: column;">
                    <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-list-ul"></i> Pending Assignments</h3>
                    <div style="flex-grow: 1; overflow-y: auto; max-height: 250px;">
                        ${pendingAssigHTML}
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="glass-card" style="border-top: 3px solid var(--accent); display: flex; flex-direction: column; justify-content: center;">
                    <h3 style="margin-bottom: 1rem;">Live Schedule</h3>
                    ${scheduleHTML}
                </div>
                ${countdownHTML}
                <div class="glass-card" style="display: flex; flex-direction: column; justify-content: center;">
                    <h3 style="margin-bottom: 1rem;">Latest Notification</h3>
                    ${State.notifications.length > 0 ? `<p style="font-size: 1.1rem; line-height: 1.5;"><i>"${State.notifications[State.notifications.length - 1].message}"</i></p><p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem;">${State.notifications[State.notifications.length - 1].date}</p>` : '<p style="color: var(--text-secondary);">No new notifications</p>'}
                </div>
            </div>
        </div>
    `;
}

function bindStudentDashboardEvents() {
    const ctx = document.getElementById('studentRadarChart');
    if (ctx && State.courses && State.marks) {
        const sId = State.currentUser.id;
        const myMarks = State.marks.filter(m => m.studentId === sId);
        
        if (myMarks.length === 0) {
            ctx.outerHTML = '<p style="color: var(--text-secondary); text-align: center;">No marks recorded yet. Your radar chart will appear here once you receive grades.</p>';
            return;
        }

        let labels = [];
        let data = [];
        
        State.courses.forEach(c => {
            const courseMarks = myMarks.filter(m => m.courseId === c.id);
            if (courseMarks.length > 0) {
                labels.push(c.name);
                const avg = courseMarks.reduce((acc, m) => acc + Number(m.mark), 0) / courseMarks.length;
                data.push(avg.toFixed(1));
            }
        });

        if (labels.length > 0) {
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'My Average Score',
                        data: data,
                        backgroundColor: 'rgba(76, 250, 151, 0.2)',
                        borderColor: 'rgba(76, 250, 151, 1)',
                        pointBackgroundColor: 'rgba(76, 250, 151, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(76, 250, 151, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            pointLabels: { color: '#94a3b8', font: { size: 12 } },
                            ticks: {
                                color: '#94a3b8',
                                backdropColor: 'transparent',
                                min: 0,
                                max: 100,
                                stepSize: 20
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        } else {
             ctx.outerHTML = '<p style="color: var(--text-secondary); text-align: center;">No marks recorded yet.</p>';
        }
    }
}

function getStudentMarksHTML() {
    const sId = State.currentUser.id;
    const myMarks = State.marks.filter(m => m.studentId === sId);

    let rows = myMarks.map(m => {
        const c = State.courses.find(cd => cd.id === m.courseId);
        const testNameLabel = m.testName ? `<span class="badge" style="margin-left: 0.5rem; background: rgba(255,255,255,0.1); color: var(--text-secondary); border: 1px solid rgba(255,255,255,0.2);">${m.testName}</span>` : '';
        return `<tr><td>${c ? c.name : 'Unknown Code ' + m.courseId}${testNameLabel}</td><td style="font-weight:600; color:var(--accent);">${m.mark} / 100</td></tr>`;
    }).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;"><h1>My Marks</h1></div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Course & Test</th><th>Score</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="2" class="text-center">No marks available currently.</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}

function getStudentAssignmentsHTML() {
    let rows = State.assignments.map(a => {
        const c = State.courses.find(cd => cd.id === a.courseId);
        
        // Check if student already submitted
        const mySub = State.submissions ? State.submissions.find(s => s.assignmentId === a.id && s.studentId === State.currentUser.id) : null;

        let statusHTML = '';
        if (mySub) {
            let gradeBadge = mySub.mark !== null && mySub.mark !== undefined 
                ? `<span class="badge success" style="margin-top: 1rem;"><i class="fa-solid fa-star"></i> Graded: ${mySub.mark} / 100</span>`
                : `<span class="badge warning" style="margin-top: 1rem;"><i class="fa-solid fa-clock"></i> Pending Grade</span>`;

            statusHTML = `
                <div style="padding: 1rem; border: 1px solid var(--success); background: rgba(76, 250, 151, 0.05); border-radius: 8px; margin-top: 1rem;">
                    <span style="color: var(--success); font-weight: 600;"><i class="fa-solid fa-check-circle"></i> Successfully Submitted on ${mySub.submissionDate}</span><br>
                    ${gradeBadge}
                </div>
            `;
        } else {
            statusHTML = `
                <form class="student-submit-form" onsubmit="submitAssignment(event, '${a.id}')">
                    <div class="flex-col gap-2">
                        <label style="font-size:0.85rem; color:var(--text-secondary);">Upload File (PDF/Image max 800KB) OR paste URL:</label>
                        <div class="flex gap-2">
                            <input type="file" id="file_${a.id}" accept=".pdf,image/*" style="flex:1;">
                            <input type="url" id="url_${a.id}" placeholder="Or paste valid URL here..." style="flex:1;">
                            <button type="submit">Submit <i class="fa-solid fa-upload"></i></button>
                        </div>
                    </div>
                </form>
            `;
        }

        return `
            <div class="glass-card" style="margin-bottom: 1.5rem;">
                <div class="flex justify-between items-center" style="margin-bottom: 0.5rem;">
                    <h3>${a.title}</h3>
                    <span class="badge warning">Due: ${a.deadline}</span>
                </div>
                <div style="color:var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
                    <i class="fa-solid fa-clock"></i> Issued: ${a.createdAt || 'Unknown'} &nbsp;|&nbsp; 
                    <i class="fa-solid fa-book"></i> Course: ${c ? c.name : 'Unknown'}
                </div>
                <p style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; line-height: 1.6;">${a.description}</p>
                ${statusHTML}
            </div>
        `;
    }).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;"><h1>Submissions & Tasks</h1></div>
            <div>${rows || '<div class="glass-card text-center"><p style="color:var(--text-secondary);">No pending assignments.</p></div>'}</div>
        </div>
    `;
}

window.submitAssignment = async function(e, assignmentId) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const fileInput = document.getElementById('file_' + assignmentId);
    const urlInput = document.getElementById('url_' + assignmentId);

    let fileData = '';

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 800 * 1024) {
            alert("File is too large! Maximum allowed size is 800KB. Please compress it or use a Cloud Storage URL instead.");
            return;
        }
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

        const reader = new FileReader();
        reader.onload = async (event) => {
            fileData = event.target.result;
            await finalizeSubmission(btn, assignmentId, fileData);
        };
        reader.onerror = () => {
            alert("Error reading file.");
            btn.disabled = false; btn.innerHTML = 'Submit <i class="fa-solid fa-upload"></i>';
        };
        reader.readAsDataURL(file);
    } else if (urlInput.value.trim() !== '') {
        fileData = urlInput.value.trim();
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        await finalizeSubmission(btn, assignmentId, fileData);
    } else {
        alert("Please either provide a file or a valid URL link to your assignment.");
    }
}

async function finalizeSubmission(btn, assignmentId, fileData) {
    try {
        await db.collection('submissions').add({
            studentId: State.currentUser.id,
            assignmentId: assignmentId,
            submissionDate: new Date().toISOString().split('T')[0],
            fileData: fileData,
            mark: null
        });
        // Real-time listener will trigger structural re-render
    } catch (err) {
        console.error(err);
        alert("Failed to submit assignment. Error: " + err.message);
        btn.disabled = false;
        btn.innerHTML = 'Submit <i class="fa-solid fa-upload"></i>';
    }
}

function getStudentTimetableHTML() {
    const getSubjectLabel = (day, period) => {
        let currentRecord = State.timetables.find(t => t.day === day && t.period === period);
        return currentRecord && currentRecord.subject ? `<span style="color:var(--accent); font-weight:600;">${currentRecord.subject}</span>` : `<span style="color:var(--text-secondary); opacity:0.5;">Free</span>`;
    };
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let ttRows = days.map(day => `
        <tr>
            <td style="font-weight: 600;">${day}</td>
            <td>${getSubjectLabel(day, '1st')}</td>
            <td>${getSubjectLabel(day, '2nd')}</td>
            <td style="background: rgba(255,255,255,0.02); text-align: center; color: var(--text-secondary);">Break</td>
            <td>${getSubjectLabel(day, '3rd')}</td>
            <td>${getSubjectLabel(day, '4th')}</td>
            <td style="background: rgba(255,255,255,0.02); text-align: center; color: var(--text-secondary);">Lunch</td>
            <td>${getSubjectLabel(day, '5th')}</td>
            <td>${getSubjectLabel(day, '6th')}</td>
            <td style="background: rgba(255,255,255,0.02); text-align: center; color: var(--text-secondary);">Break</td>
            <td>${getSubjectLabel(day, '7th')}</td>
        </tr>
    `).join('');

    const todayStr = new Date().toISOString().split('T')[0];
    const validExams = State.exams.filter(e => e.date);
    validExams.sort((a, b) => a.date.localeCompare(b.date));

    let exRows = validExams.map(e => {
        const c = State.courses.find(course => course.id === e.courseId);
        const courseName = c ? c.name : e.subject || 'Unknown Course';
        const testName = e.testName || 'Exam';

        let statusHTML = '';
        if (e.date < todayStr) {
            statusHTML = `<span class="badge success">Completed</span>`;
        } else if (e.date === todayStr) {
            statusHTML = `<span class="badge danger" style="animation: pulse 2s infinite;">Today</span>`;
        } else {
            statusHTML = `<span class="badge warning">Upcoming</span>`;
        }

        return `<tr><td>${courseName}</td><td>${testName}</td><td>${e.date}</td><td>${statusHTML}</td></tr>`;
    }).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;"><h1>Timetable & Exams</h1></div>
            
            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-calendar-days"></i> Weekly Timetable Grid</h3>
                <div class="glass-card" style="overflow-x: auto; padding: 1.5rem;">
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
                            <tbody>${ttRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div>
                    <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-clock"></i> Period Timings</h3>
                    <div class="glass-card">
                        <ul style="list-style: none; padding: 0; color: var(--text-secondary); line-height: 1.8;">
                            <li><b>1st:</b> 9:00 to 9:50</li>
                            <li><b>2nd:</b> 9:50 to 10:40</li>
                            <li><b style="color: var(--accent);">Break:</b> 10:40 to 11:00</li>
                            <li><b>3rd:</b> 11:00 to 11:45</li>
                            <li><b>4th:</b> 11:45 to 12:35</li>
                            <li><b style="color: var(--warning);">Lunch:</b> 12:35 to 1:20</li>
                            <li><b>5th:</b> 1:20 to 2:10</li>
                            <li><b>6th:</b> 2:10 to 3:00</li>
                            <li><b style="color: var(--accent);">Break:</b> 3:00 to 3:15</li>
                            <li><b>7th:</b> 3:15 to 4:00</li>
                        </ul>
                    </div>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-file-lines"></i> Upcoming Exams</h3>
                    <div class="glass-card">
                        <div class="table-container" style="margin-top:0; box-shadow:none;">
                            <table>
                                <thead><tr><th>Subject</th><th>Test Name</th><th>Date</th><th>Status</th></tr></thead>
                                <tbody>${exRows || '<tr><td colspan="4" class="text-center">No exams scheduled</td></tr>'}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getStudentNotificationsHTML() {
    let rows = State.notifications.map(n => `
        <div class="glass-card" style="margin-bottom:1rem; padding: 1.5rem; border-left: 4px solid var(--accent);">
            <div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:0.5rem;"><i class="fa-regular fa-clock"></i> Posted on ${n.date}</div>
            <div style="font-size: 1.1rem;">${n.message}</div>
        </div>
    `).reverse().join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;"><h1>Notifications</h1></div>
            <div>${rows || '<div class="glass-card text-center"><p style="color:var(--text-secondary);">No notifications.</p></div>'}</div>
        </div>
    `;
}

function getStudentFeedbackHTML() {
    return `
        <div>
            <div style="margin-bottom: 2rem;"><h1>Send Feedback</h1></div>
            <div class="glass-card">
                <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">Share your thoughts, report issues, or suggest improvements to the administration privately.</p>
                <form id="studentFeedbackForm" class="flex-col gap-2">
                    <textarea id="feedbackMsg" placeholder="Write your feedback here..." rows="5" required></textarea>
                    <button type="submit" style="align-self: flex-start;">Send Feedback <i class="fa-solid fa-paper-plane"></i></button>
                </form>
            </div>
            
            <div id="feedbackThanks" class="glass-card animate-slide" style="display:none; margin-top: 1.5rem; text-align:center; border-color:var(--success);">
                <i class="fa-solid fa-circle-check text-success" style="font-size: 3rem; color: var(--success); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--success);">Thank you for your feedback!</h3>
                <p style="margin-top:0.5rem;">Your message has been securely sent to the administration.</p>
            </div>
        </div>
    `;
}

function bindStudentFeedbackEvents() {
    document.getElementById('studentFeedbackForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await db.collection('feedback').add({
                studentId: State.currentUser.id,
                message: document.getElementById('feedbackMsg').value,
                date: new Date().toISOString().split('T')[0]
            });
            document.getElementById('studentFeedbackForm').style.display = 'none';
            document.getElementById('feedbackThanks').style.display = 'block';
        } catch (err) {
            console.error(err);
            alert("Failed to send feedback");
        }
    });
}

function getStudentAttendanceHTML() {
    const sId = State.currentUser.id;
    let distinctDates = [...new Set(State.attendance.map(a => a.date))].sort((a,b) => b.localeCompare(a));
    
    let rows = distinctDates.map(d => {
        let record = State.attendance.find(a => a.studentId === sId && a.date === d);
        let status = record ? (record.status ? '<span class="badge success">Present</span>' : '<span class="badge danger">Absent</span>') : '<span class="badge warning">Not Marked</span>';
        return `
            <tr>
                <td>${d}</td>
                <td>${status}</td>
            </tr>
        `;
    }).join('');

    return `
        <div>
            <div style="margin-bottom: 2rem;">
                <h1>My Attendance</h1>
                <p>View your day-wise attendance records.</p>
            </div>
            <div class="glass-card">
                <div class="table-container" style="box-shadow: none; margin-top: 0;">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows || '<tr><td colspan="2" class="text-center">No attendance records found.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ---------------- Study Hub Functions ----------------

function getStudentStudyHubHTML() {
    const sId = State.currentUser.id;
    const me = State.students.find(s => s.id === sId) || {};
    const myPoints = me.studyPoints || 0;

    let badge = '🥉 Novice';
    let badgeColor = '#cd7f32'; 
    if (myPoints >= 500) {
        badge = '🥇 Study Master';
        badgeColor = '#ffd700'; 
    } else if (myPoints >= 100) {
        badge = '🥈 Scholar';
        badgeColor = '#c0c0c0'; 
    }

    let leaderboard = [...State.students];
    leaderboard.sort((a,b) => (b.studyPoints || 0) - (a.studyPoints || 0));
    
    let leaderboardRows = leaderboard.map((s, index) => {
        let pts = s.studyPoints || 0;
        let isMe = s.id === sId;
        let rankBadge = '';
        if (index === 0) rankBadge = '👑';
        else if (index === 1) rankBadge = '🥈';
        else if (index === 2) rankBadge = '🥉';
        else rankBadge = `${index + 1}`;

        return `
            <tr style="${isMe ? 'background: rgba(99, 102, 241, 0.2); font-weight: bold;' : ''}">
                <td style="text-align: center; width: 50px;">${rankBadge}</td>
                <td>${s.name} ${isMe ? '(You)' : ''}</td>
                <td style="text-align: right; color: var(--accent);">${pts} XP</td>
            </tr>
        `;
    }).join('');

    let myTodos = State.todos ? State.todos.filter(t => t.userId === sId).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)) : [];
    
    let todoItemsHTML = myTodos.map(t => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 0.5rem 1rem; border-radius: 6px; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-grow: 1;">
                <input type="checkbox" ${t.completed ? 'checked disabled' : ''} onchange="completeStudyTask('${t.id}', this)" style="accent-color: var(--accent); transform: scale(1.2); cursor: pointer;">
                <span style="${t.completed ? 'text-decoration: line-through; color: var(--text-secondary);' : ''}">${t.text}</span>
            </div>
            ${t.completed ? '<span class="badge success">+10 XP</span>' : ''}
            <button onclick="deleteStudyTask('${t.id}')" style="background: transparent; color: var(--danger); padding: 0.2rem; min-width: auto; box-shadow: none;"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');

    if (myTodos.length === 0) todoItemsHTML = `<p style="color: var(--text-secondary); text-align: center; margin-top: 1rem;">Add a study goal above!</p>`;

    return `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
                <div>
                    <h1>Study Hub</h1>
                    <p>Focus, complete tasks, and climb the leaderboard.</p>
                </div>
                <div class="glass-card" style="padding: 0.5rem 1.5rem; border-color: ${badgeColor}; display: flex; align-items: center; gap: 1rem;">
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Current Rank</div>
                        <div style="font-weight: bold; color: ${badgeColor}; font-size: 1.1rem;">${badge}</div>
                    </div>
                    <div style="font-size: 2rem; font-weight: bold; color: var(--accent); border-left: 1px solid rgba(255,255,255,0.1); padding-left: 1rem;">
                        ${myPoints} <span style="font-size: 1rem; color: var(--text-secondary);">XP</span>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-grid">
                <!-- Focus Timer -->
                <div class="glass-card text-center" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 3rem 1rem;">
                    <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-stopwatch"></i> Focus Timer</h3>
                    <div id="timerDisplay" style="font-size: 5rem; font-weight: bold; color: var(--text-primary); font-family: monospace; line-height: 1; margin-bottom: 1.5rem; text-shadow: 0 0 20px rgba(99, 102, 241, 0.4);">
                        25:00
                    </div>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem; max-width: 250px;">Complete a 25-minute focus session without leaving this page to earn <strong>+50 XP</strong>!</p>
                    <div style="display: flex; gap: 1rem;">
                        <button id="startTimerBtn" style="padding: 0.8rem 2rem; font-size: 1.1rem;"><i class="fa-solid fa-play"></i> Start Focus</button>
                        <button id="resetTimerBtn" class="secondary" style="padding: 0.8rem 1.5rem;"><i class="fa-solid fa-rotate-right"></i></button>
                    </div>
                </div>

                <!-- Study Tasks -->
                <div class="glass-card" style="display: flex; flex-direction: column; max-height: 500px;">
                    <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-list-check"></i> Study Tasks</h3>
                    <form id="addStudyTaskForm" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                        <input type="text" id="newStudyTaskInput" placeholder="I need to study..." required style="flex-grow: 1; padding: 0.6rem; border-radius: 4px; border: 1px solid var(--border-subtle); background: rgba(0,0,0,0.2); color: white;">
                        <button type="submit" style="padding: 0.6rem 1rem;"><i class="fa-solid fa-plus"></i></button>
                    </form>
                    <div style="flex-grow: 1; overflow-y: auto;">
                        ${todoItemsHTML}
                    </div>
                </div>

                <!-- Leaderboard -->
                <div class="glass-card" style="max-height: 500px; overflow-y: auto;">
                    <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-trophy" style="color: #ffd700;"></i> Global Leaderboard</h3>
                    <div class="table-container" style="box-shadow: none; margin: 0;">
                        <table style="font-size: 0.95rem;">
                            <thead>
                                <tr>
                                    <th style="width: 50px; text-align: center;">Rank</th>
                                    <th>Student</th>
                                    <th style="text-align: right;">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${leaderboardRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

let focusTimerInterval = null;
let focusTimerSeconds = 25 * 60; 

function bindStudentStudyHubEvents() {
    clearInterval(focusTimerInterval);
    focusTimerInterval = null;
    focusTimerSeconds = 25 * 60;
    
    const timerDisplay = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startTimerBtn');
    const resetBtn = document.getElementById('resetTimerBtn');
    
    function updateTimerDisplay() {
        const m = Math.floor(focusTimerSeconds / 60).toString().padStart(2, '0');
        const s = (focusTimerSeconds % 60).toString().padStart(2, '0');
        if (timerDisplay) timerDisplay.innerText = `${m}:${s}`;
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (focusTimerInterval) {
                clearInterval(focusTimerInterval);
                focusTimerInterval = null;
                startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
                startBtn.classList.remove('secondary');
            } else {
                startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
                startBtn.classList.add('secondary');
                
                focusTimerInterval = setInterval(() => {
                    focusTimerSeconds--;
                    updateTimerDisplay();
                    
                    if (focusTimerSeconds <= 0) {
                        clearInterval(focusTimerInterval);
                        focusTimerInterval = null;
                        focusTimerSeconds = 25 * 60;
                        updateTimerDisplay();
                        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';
                        startBtn.classList.remove('secondary');
                        
                        awardStudyPoints(50, "Focus Session Complete!");
                    }
                }, 1000);
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            clearInterval(focusTimerInterval);
            focusTimerInterval = null;
            focusTimerSeconds = 25 * 60;
            updateTimerDisplay();
            if (startBtn) {
                startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';
                startBtn.classList.remove('secondary');
            }
        });
    }

    const taskForm = document.getElementById('addStudyTaskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('newStudyTaskInput');
            const text = input.value.trim();
            if (!text) return;
            
            try {
                await db.collection('todos').add({
                    text: text,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    userId: State.currentUser.id
                });
            } catch (err) {
                console.error(err);
                alert("Failed to add task.");
            }
        });
    }

    window.completeStudyTask = async function(id, checkboxEl) {
        if (!checkboxEl.checked) {
            checkboxEl.checked = true;
            return;
        }
        checkboxEl.disabled = true;
        try {
            await db.collection('todos').doc(id).update({ completed: true });
            awardStudyPoints(10, "Task Completed!");
        } catch (err) { console.error("Failed to update task", err); checkboxEl.disabled = false; checkboxEl.checked = false; }
    };

    window.deleteStudyTask = async function(id) {
        try {
            await db.collection('todos').doc(id).delete();
        } catch (err) { console.error("Failed to delete task", err); }
    };

    window.awardStudyPoints = async function(points, message) {
        const sId = State.currentUser.id;
        const studentRef = db.collection('students').doc(sId);
        
        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(studentRef);
                if (!doc.exists) throw "Document does not exist!";
                
                const currentPoints = doc.data().studyPoints || 0;
                transaction.update(studentRef, { studyPoints: currentPoints + points });
            });
            
            alert(`🎉 ${message} You earned +${points} XP!`);
        } catch (err) {
            console.error("Failed to award points", err);
        }
    };
}
