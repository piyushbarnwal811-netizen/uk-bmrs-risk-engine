/**
 * SmartGrade Pro - Academic Report Card & Marksheet Engine
 * Modern Vanilla JS with real-time recalculations and state synchronization
 */

(function () {
  'use strict';

  // Preset Data Sets
  const PRESETS = {
    topper_science: {
      schoolName: 'ST. AUGUSTINE ACADEMY OF EXCELLENCE',
      schoolBoard: 'Affiliated to Central Board of Secondary Education (CBSE), New Delhi',
      schoolCode: 'CBSE/AFF/2130894 | School Code: 70124',
      schoolAddress: 'North Campus, Knowledge Park IV, Institutional Area',
      schoolMotto: '"KNOWLEDGE • INTEGRITY • EXCELLENCE"',
      academicSession: '2025 - 2026',
      examTitle: 'ANNUAL CONSOLIDATED ACADEMIC REPORT CARD',
      studentName: 'Aarav Sharma',
      studentRoll: '26',
      studentClass: 'Class X - Section A',
      studentAdmission: 'ADM-2022-8419',
      studentDob: '14-Oct-2010',
      fatherName: 'Mr. Rajesh Sharma',
      motherName: 'Mrs. Sunita Sharma',
      attendanceAttended: 204,
      attendanceTotal: 218,
      gradeWork: 'A',
      gradeArt: 'A',
      gradeHealth: 'A',
      gradeDiscipline: 'A',
      teacherRemarks: 'Aarav exhibits stellar academic prowess, leadership potential, and deep curiosity. Outstanding conceptual clarity in Mathematics and Science. Keep shining!',
      signTeacher: 'Mrs. Anita Verma (Class Teacher)',
      signPrincipal: 'Dr. M. R. Swaminathan (Principal)',
      issueDate: '24-October-2026',
      finalStatus: 'PASSED WITH FIRST DIVISION & DISTINCTION',
      subjects: [
        { code: '184', name: 'English Language & Literature', maxTh: 80, obtTh: 76, maxPr: 20, obtPr: 20 },
        { code: '041', name: 'Mathematics (Standard)', maxTh: 80, obtTh: 79, maxPr: 20, obtPr: 20 },
        { code: '086', name: 'Science (Physics, Chem, Bio)', maxTh: 80, obtTh: 77, maxPr: 20, obtPr: 20 },
        { code: '087', name: 'Social Science (Hist, Civ, Geo, Eco)', maxTh: 80, obtTh: 74, maxPr: 20, obtPr: 19 },
        { code: '002', name: 'Hindi Course - A', maxTh: 80, obtTh: 75, maxPr: 20, obtPr: 19 },
        { code: '417', name: 'Artificial Intelligence & Coding', maxTh: 50, obtTh: 48, maxPr: 50, obtPr: 50 }
      ]
    },
    commerce_stream: {
      schoolName: 'DELHI PUBLIC HERITAGE ACADEMY',
      schoolBoard: 'Affiliated to Council for the Indian School Certificate Examinations (CISCE)',
      schoolCode: 'School Reg No: DL-8834 | Centre Code: 1109',
      schoolAddress: 'Heritage Boulevard, Sector 14, Greater Capital Region',
      schoolMotto: '"SERVICE BEFORE SELF • LEAD WITH HONOUR"',
      academicSession: '2025 - 2026',
      examTitle: 'SENIOR SECONDARY TERM-END MARKSHEET',
      studentName: 'Rhea Sengupta',
      studentRoll: '14',
      studentClass: 'Class XII - Commerce A',
      studentAdmission: 'ADM-2020-5122',
      studentDob: '08-May-2008',
      fatherName: 'Mr. Anirban Sengupta',
      motherName: 'Dr. Madhumita Sengupta',
      attendanceAttended: 198,
      attendanceTotal: 215,
      gradeWork: 'A',
      gradeArt: 'A',
      gradeHealth: 'B',
      gradeDiscipline: 'A',
      teacherRemarks: 'Rhea has demonstrated exemplary financial acumen, analytical rigor in Accountancy, and strong verbal eloquence. Commendable performance!',
      signTeacher: 'Mr. Vikram Malhotra (Class Teacher)',
      signPrincipal: 'Prof. K. S. Narayanan (Director)',
      issueDate: '24-October-2026',
      finalStatus: 'PASSED WITH FIRST DIVISION & DISTINCTION',
      subjects: [
        { code: '055', name: 'Accountancy', maxTh: 80, obtTh: 78, maxPr: 20, obtPr: 20 },
        { code: '054', name: 'Business Studies', maxTh: 80, obtTh: 75, maxPr: 20, obtPr: 20 },
        { code: '030', name: 'Economics', maxTh: 80, obtTh: 76, maxPr: 20, obtPr: 19 },
        { code: '301', name: 'English Core', maxTh: 80, obtTh: 74, maxPr: 20, obtPr: 20 },
        { code: '241', name: 'Applied Mathematics', maxTh: 80, obtTh: 71, maxPr: 20, obtPr: 20 }
      ]
    },
    middle_school: {
      schoolName: 'ST. XAVIER JUNIOR GRAMMAR SCHOOL',
      schoolBoard: 'State Board of Secondary Education',
      schoolCode: 'Affiliation No: SB-54029',
      schoolAddress: 'Cathedral Road, Civil Lines',
      schoolMotto: '"LUX ET VERITAS • LIGHT AND TRUTH"',
      academicSession: '2025 - 2026',
      examTitle: 'ANNUAL PROGRESS & EVALUATION REPORT',
      studentName: 'Vihaan Joshi',
      studentRoll: '19',
      studentClass: 'Class VIII - Green',
      studentAdmission: 'ADM-2023-1094',
      studentDob: '19-Nov-2012',
      fatherName: 'Mr. Sandeep Joshi',
      motherName: 'Mrs. Neha Joshi',
      attendanceAttended: 210,
      attendanceTotal: 220,
      gradeWork: 'A',
      gradeArt: 'B',
      gradeHealth: 'A',
      gradeDiscipline: 'A',
      teacherRemarks: 'Vihaan is an enthusiastic learner with an inquisitive mindset in Environmental Studies and Robotics. Great classroom engagement.',
      signTeacher: 'Mrs. Shalini Roy (Class Teacher)',
      signPrincipal: 'Rev. Fr. Augustine D\'Souza (Principal)',
      issueDate: '24-October-2026',
      finalStatus: 'PASSED - PROMOTED TO NEXT HIGHER CLASS',
      subjects: [
        { code: '101', name: 'English Language', maxTh: 80, obtTh: 72, maxPr: 20, obtPr: 19 },
        { code: '102', name: 'Second Language (Hindi)', maxTh: 80, obtTh: 70, maxPr: 20, obtPr: 18 },
        { code: '103', name: 'Mathematics', maxTh: 80, obtTh: 75, maxPr: 20, obtPr: 20 },
        { code: '104', name: 'Integrated Science', maxTh: 80, obtTh: 74, maxPr: 20, obtPr: 19 },
        { code: '105', name: 'Social Studies', maxTh: 80, obtTh: 68, maxPr: 20, obtPr: 18 },
        { code: '106', name: 'Computer Applications', maxTh: 50, obtTh: 47, maxPr: 50, obtPr: 49 }
      ]
    },
    blank: {
      schoolName: 'NAME OF INSTITUTION',
      schoolBoard: 'Affiliated to Examination Board',
      schoolCode: 'School Code / Registration ID',
      schoolAddress: 'Campus Address, City, State, PIN',
      schoolMotto: '"MOTTO OF THE INSTITUTION"',
      academicSession: '2025 - 2026',
      examTitle: 'ACADEMIC PROGRESS REPORT CARD',
      studentName: 'Student Name',
      studentRoll: '01',
      studentClass: 'Class & Section',
      studentAdmission: 'REG-0001',
      studentDob: '01-Jan-2010',
      fatherName: 'Father / Guardian Name',
      motherName: 'Mother / Guardian Name',
      attendanceAttended: 180,
      attendanceTotal: 200,
      gradeWork: 'A',
      gradeArt: 'A',
      gradeHealth: 'A',
      gradeDiscipline: 'A',
      teacherRemarks: 'Enter detailed remarks regarding academic performance, character, and conduct here.',
      signTeacher: 'Class Teacher',
      signPrincipal: 'Head of Institution',
      issueDate: '24-October-2026',
      finalStatus: 'PASSED WITH FIRST DIVISION & DISTINCTION',
      subjects: [
        { code: '001', name: 'Subject 1', maxTh: 80, obtTh: 70, maxPr: 20, obtPr: 18 },
        { code: '002', name: 'Subject 2', maxTh: 80, obtTh: 68, maxPr: 20, obtPr: 19 }
      ]
    }
  };

  // State
  let currentData = JSON.parse(JSON.stringify(PRESETS.topper_science));

  // DOM Elements Cache
  const el = {
    // Top Bar
    presetSelect: document.getElementById('preset-select'),
    btnExportJson: document.getElementById('btn-export-json'),
    importJsonInput: document.getElementById('import-json-input'),
    btnCopySummary: document.getElementById('btn-copy-summary'),
    btnPrintPdf: document.getElementById('btn-print-pdf'),
    toast: document.getElementById('toast-message'),

    // Theme & Options
    themeSelector: document.getElementById('theme-selector'),
    borderSelector: document.getElementById('border-selector'),
    toggleWatermark: document.getElementById('toggle-watermark'),
    toggleSeal: document.getElementById('toggle-seal'),
    toggleStudentPhoto: document.getElementById('toggle-student-photo'),

    // Form inputs: School
    schoolName: document.getElementById('school-name'),
    schoolBoard: document.getElementById('school-board'),
    schoolCode: document.getElementById('school-code'),
    schoolAddress: document.getElementById('school-address'),
    schoolMotto: document.getElementById('school-motto'),
    academicSession: document.getElementById('academic-session'),
    examTitle: document.getElementById('exam-title'),

    // Form inputs: Student
    studentName: document.getElementById('student-name'),
    studentRoll: document.getElementById('student-roll'),
    studentClass: document.getElementById('student-class'),
    studentAdmission: document.getElementById('student-admission'),
    studentDob: document.getElementById('student-dob'),
    fatherName: document.getElementById('father-name'),
    motherName: document.getElementById('mother-name'),
    attendanceAttended: document.getElementById('attendance-attended'),
    attendanceTotal: document.getElementById('attendance-total'),

    // Form inputs: Co-Scholastic
    gradeDiscipline: document.getElementById('grade-discipline'),
    gradeWork: document.getElementById('grade-work'),
    gradeArt: document.getElementById('grade-art'),
    gradeHealth: document.getElementById('grade-health'),

    // Form inputs: Remarks & Signs
    teacherRemarks: document.getElementById('teacher-remarks'),
    signTeacher: document.getElementById('sign-teacher'),
    signPrincipal: document.getElementById('sign-principal'),
    issueDate: document.getElementById('issue-date'),
    finalResultStatus: document.getElementById('final-result-status'),

    // Subjects editor
    subjectsEditorList: document.getElementById('subjects-editor-list'),
    btnAddSubject: document.getElementById('btn-add-subject'),

    // Printable Sheet Container
    sheet: document.getElementById('printable-report-sheet'),
    sheetWatermark: document.getElementById('sheet-watermark'),
    sheetSealBlock: document.getElementById('sheet-seal-block'),
    studentPhotoContainer: document.getElementById('student-photo-container'),

    // Display elements on sheet
    dispSchoolName: document.getElementById('disp-school-name'),
    dispSchoolBoard: document.getElementById('disp-school-board'),
    dispSchoolAddress: document.getElementById('disp-school-address'),
    dispSchoolMotto: document.getElementById('disp-school-motto'),
    dispExamTitle: document.getElementById('disp-exam-title'),
    dispSession: document.getElementById('disp-session'),
    dispStudentName: document.getElementById('disp-student-name'),
    dispRollNo: document.getElementById('disp-roll-no'),
    dispClassSec: document.getElementById('disp-class-sec'),
    dispAdmissionNo: document.getElementById('disp-admission-no'),
    dispFatherName: document.getElementById('disp-father-name'),
    dispMotherName: document.getElementById('disp-mother-name'),
    dispDob: document.getElementById('disp-dob'),
    dispAttendance: document.getElementById('disp-attendance'),
    dispMarksTbody: document.getElementById('disp-marks-tbody'),
    dispTotalMax: document.getElementById('disp-total-max'),
    dispTotalObt: document.getElementById('disp-total-obt'),
    dispGrandPct: document.getElementById('disp-grand-pct'),
    dispGrandGrade: document.getElementById('disp-grand-grade'),
    dispGrandCgpa: document.getElementById('disp-grand-cgpa'),
    dispGradeWork: document.getElementById('disp-grade-work'),
    dispGradeArt: document.getElementById('disp-grade-art'),
    dispGradeHealth: document.getElementById('disp-grade-health'),
    dispGradeDiscipline: document.getElementById('disp-grade-discipline'),
    dispRemarks: document.getElementById('disp-remarks'),
    dispFinalStatus: document.getElementById('disp-final-status'),
    dispSignTeacher: document.getElementById('disp-sign-teacher'),
    dispSignPrincipal: document.getElementById('disp-sign-principal'),
    dispDateTeacher: document.getElementById('disp-date-teacher'),

    // Analytics Header Cards
    statTotalMarks: document.getElementById('stat-total-marks'),
    statPercentage: document.getElementById('stat-percentage'),
    statCgpa: document.getElementById('stat-cgpa'),
    statGrade: document.getElementById('stat-grade'),
    statAttendance: document.getElementById('stat-attendance'),
    statResult: document.getElementById('stat-result')
  };

  /**
   * Helper: Calculate Grade and Grade Point from Percentage
   * Standard 10-Point CBSE Grading Scale
   */
  function calculateGrade(percentage) {
    if (percentage >= 91) return { grade: 'A1', gp: 10, remarks: 'Top 1/8th of passed candidates' };
    if (percentage >= 81) return { grade: 'A2', gp: 9, remarks: 'Next 1/8th of passed candidates' };
    if (percentage >= 71) return { grade: 'B1', gp: 8, remarks: 'Next 1/8th of passed candidates' };
    if (percentage >= 61) return { grade: 'B2', gp: 7, remarks: 'Next 1/8th of passed candidates' };
    if (percentage >= 51) return { grade: 'C1', gp: 6, remarks: 'Next 1/8th of passed candidates' };
    if (percentage >= 41) return { grade: 'C2', gp: 5, remarks: 'Next 1/8th of passed candidates' };
    if (percentage >= 33) return { grade: 'D', gp: 4, remarks: 'Passing Grade' };
    return { grade: 'E', gp: 0, remarks: 'Essential Repeat / Improvement Needed' };
  }

  /**
   * Populate Editor Form with currentData
   */
  function populateEditorForm() {
    el.schoolName.value = currentData.schoolName || '';
    el.schoolBoard.value = currentData.schoolBoard || '';
    el.schoolCode.value = currentData.schoolCode || '';
    el.schoolAddress.value = currentData.schoolAddress || '';
    el.schoolMotto.value = currentData.schoolMotto || '';
    el.academicSession.value = currentData.academicSession || '';
    el.examTitle.value = currentData.examTitle || '';

    el.studentName.value = currentData.studentName || '';
    el.studentRoll.value = currentData.studentRoll || '';
    el.studentClass.value = currentData.studentClass || '';
    el.studentAdmission.value = currentData.studentAdmission || '';
    el.studentDob.value = currentData.studentDob || '';
    el.fatherName.value = currentData.fatherName || '';
    el.motherName.value = currentData.motherName || '';
    el.attendanceAttended.value = currentData.attendanceAttended ?? 204;
    el.attendanceTotal.value = currentData.attendanceTotal ?? 218;

    el.gradeDiscipline.value = currentData.gradeDiscipline || 'A';
    el.gradeWork.value = currentData.gradeWork || 'A';
    el.gradeArt.value = currentData.gradeArt || 'A';
    el.gradeHealth.value = currentData.gradeHealth || 'A';

    el.teacherRemarks.value = currentData.teacherRemarks || '';
    el.signTeacher.value = currentData.signTeacher || '';
    el.signPrincipal.value = currentData.signPrincipal || '';
    el.issueDate.value = currentData.issueDate || '';
    el.finalResultStatus.value = currentData.finalStatus || 'PASSED WITH FIRST DIVISION & DISTINCTION';

    renderSubjectsEditor();
  }

  /**
   * Render dynamic subjects in the editor panel
   */
  function renderSubjectsEditor() {
    el.subjectsEditorList.innerHTML = '';
    currentData.subjects.forEach((sub, idx) => {
      const row = document.createElement('div');
      row.className = 'subject-edit-row';
      row.innerHTML = `
        <input type="text" class="form-input sub-name" data-idx="${idx}" data-field="name" value="${escapeHtml(sub.name)}" placeholder="Subject Name">
        <input type="number" class="form-input sub-marks" data-idx="${idx}" data-field="obtTh" value="${sub.obtTh}" min="0" max="${sub.maxTh}" title="Theory Marks (Max ${sub.maxTh})">
        <input type="number" class="form-input sub-marks" data-idx="${idx}" data-field="obtPr" value="${sub.obtPr}" min="0" max="${sub.maxPr}" title="Practical Marks (Max ${sub.maxPr})">
        <button type="button" class="btn-icon-del" data-del="${idx}" title="Delete Subject">
          <i class="ph-bold ph-trash"></i>
        </button>
      `;
      el.subjectsEditorList.appendChild(row);
    });
  }

  /**
   * Read all data from form and update currentData + live sheet
   */
  function updateDataFromInputs() {
    currentData.schoolName = el.schoolName.value;
    currentData.schoolBoard = el.schoolBoard.value;
    currentData.schoolCode = el.schoolCode.value;
    currentData.schoolAddress = el.schoolAddress.value;
    currentData.schoolMotto = el.schoolMotto.value;
    currentData.academicSession = el.academicSession.value;
    currentData.examTitle = el.examTitle.value;

    currentData.studentName = el.studentName.value;
    currentData.studentRoll = el.studentRoll.value;
    currentData.studentClass = el.studentClass.value;
    currentData.studentAdmission = el.studentAdmission.value;
    currentData.studentDob = el.studentDob.value;
    currentData.fatherName = el.fatherName.value;
    currentData.motherName = el.motherName.value;
    currentData.attendanceAttended = parseInt(el.attendanceAttended.value, 10) || 0;
    currentData.attendanceTotal = parseInt(el.attendanceTotal.value, 10) || 1;

    currentData.gradeDiscipline = el.gradeDiscipline.value;
    currentData.gradeWork = el.gradeWork.value;
    currentData.gradeArt = el.gradeArt.value;
    currentData.gradeHealth = el.gradeHealth.value;

    currentData.teacherRemarks = el.teacherRemarks.value;
    currentData.signTeacher = el.signTeacher.value;
    currentData.signPrincipal = el.signPrincipal.value;
    currentData.issueDate = el.issueDate.value;
    currentData.finalStatus = el.finalResultStatus.value;

    renderLiveReportSheet();
  }

  /**
   * Render the Live Report Sheet & compute all aggregates
   */
  function renderLiveReportSheet() {
    // School info
    el.dispSchoolName.textContent = currentData.schoolName;
    el.dispSchoolBoard.textContent = currentData.schoolBoard;
    el.dispSchoolAddress.textContent = `${currentData.schoolAddress} • ${currentData.schoolCode}`;
    el.dispSchoolMotto.textContent = currentData.schoolMotto;
    el.dispExamTitle.textContent = currentData.examTitle;
    el.dispSession.textContent = `SESSION: ${currentData.academicSession}`;

    // Student Info
    el.dispStudentName.textContent = currentData.studentName;
    el.dispRollNo.textContent = currentData.studentRoll;
    el.dispClassSec.textContent = currentData.studentClass;
    el.dispAdmissionNo.textContent = currentData.studentAdmission;
    el.dispFatherName.textContent = currentData.fatherName;
    el.dispMotherName.textContent = currentData.motherName;
    el.dispDob.textContent = currentData.studentDob;

    // Attendance
    const attPct = ((currentData.attendanceAttended / currentData.attendanceTotal) * 100).toFixed(1);
    el.dispAttendance.textContent = `${currentData.attendanceAttended} / ${currentData.attendanceTotal} Days (${attPct}%)`;

    // Subjects Table
    let grandMax = 0;
    let grandObt = 0;
    let totalGp = 0;
    let hasFail = false;

    el.dispMarksTbody.innerHTML = '';
    currentData.subjects.forEach((sub, i) => {
      const code = sub.code || `SUB0${i + 1}`;
      const totalSubMax = (Number(sub.maxTh) || 0) + (Number(sub.maxPr) || 0);
      const totalSubObt = (Number(sub.obtTh) || 0) + (Number(sub.obtPr) || 0);
      const pct = totalSubMax > 0 ? ((totalSubObt / totalSubMax) * 100).toFixed(1) : 0;
      const { grade, gp } = calculateGrade(Number(pct));

      grandMax += totalSubMax;
      grandObt += totalSubObt;
      totalGp += gp;
      if (grade === 'E') hasFail = true;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-code">${code}</td>
        <td class="col-sub">${escapeHtml(sub.name)}</td>
        <td class="col-num">${sub.maxTh}</td>
        <td class="col-num">${sub.obtTh}</td>
        <td class="col-num">${sub.maxPr}</td>
        <td class="col-num">${sub.obtPr}</td>
        <td class="col-num text-bold">${totalSubMax}</td>
        <td class="col-num highlight-col">${totalSubObt}</td>
        <td class="col-pct">${pct}%</td>
        <td class="col-grade grade-badge-table">${grade}</td>
        <td class="col-gp">${gp}</td>
      `;
      el.dispMarksTbody.appendChild(tr);
    });

    // Grand calculations
    const grandPct = grandMax > 0 ? ((grandObt / grandMax) * 100).toFixed(1) : 0;
    const cgpa = currentData.subjects.length > 0 ? (totalGp / currentData.subjects.length).toFixed(1) : '0.0';
    const grandGradeInfo = calculateGrade(Number(grandPct));

    el.dispTotalMax.textContent = grandMax;
    el.dispTotalObt.textContent = grandObt;
    el.dispGrandPct.textContent = `${grandPct}%`;
    el.dispGrandGrade.textContent = grandGradeInfo.grade;
    el.dispGrandCgpa.textContent = cgpa;

    // Co-Scholastic
    el.dispGradeWork.textContent = `Grade ${currentData.gradeWork}`;
    el.dispGradeArt.textContent = `Grade ${currentData.gradeArt}`;
    el.dispGradeHealth.textContent = `Grade ${currentData.gradeHealth}`;
    el.dispGradeDiscipline.textContent = `Grade ${currentData.gradeDiscipline}`;

    // Remarks & Decision
    el.dispRemarks.textContent = currentData.teacherRemarks;
    el.dispFinalStatus.textContent = currentData.finalStatus;
    el.dispSignTeacher.textContent = currentData.signTeacher;
    el.dispSignPrincipal.textContent = currentData.signPrincipal;
    el.dispDateTeacher.textContent = `Date: ${currentData.issueDate}`;

    // Update Analytics Top Bar
    el.statTotalMarks.textContent = `${grandObt} / ${grandMax}`;
    el.statPercentage.textContent = `${grandPct}%`;
    el.statCgpa.textContent = cgpa;
    el.statGrade.textContent = grandGradeInfo.grade;
    el.statGrade.className = `stat-badge ${grandGradeInfo.grade === 'E' ? 'fail' : 'grade-a1'}`;
    el.statAttendance.textContent = `${attPct}%`;

    const isPassed = !hasFail && Number(grandPct) >= 33;
    el.statResult.textContent = isPassed ? 'PASSED' : 'COMPARTMENT';
    el.statResult.className = `stat-badge ${isPassed ? 'pass' : 'fail'}`;
  }

  /**
   * Escape HTML utility
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Show notification toast
   */
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    setTimeout(() => {
      el.toast.classList.remove('show');
    }, 3200);
  }

  /**
   * Copy formatted Parent SMS / WhatsApp Summary
   */
  function copySummaryToClipboard() {
    const totalMax = el.dispTotalMax.textContent;
    const totalObt = el.dispTotalObt.textContent;
    const pct = el.dispGrandPct.textContent;
    const grade = el.dispGrandGrade.textContent;
    const cgpa = el.dispGrandCgpa.textContent;
    const status = currentData.finalStatus;

    const summaryText = `🎓 *OFFICIAL ACADEMIC REPORT CARD NOTIFICATION*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏛️ *Institution:* ${currentData.schoolName}\n` +
      `👤 *Student:* ${currentData.studentName} (Roll: ${currentData.studentRoll})\n` +
      `📚 *Class:* ${currentData.studentClass} | Session: ${currentData.academicSession}\n` +
      `📊 *Grand Aggregate:* ${totalObt} / ${totalMax} (${pct})\n` +
      `🏆 *Overall Grade:* ${grade} | *CGPA:* ${cgpa}\n` +
      `📅 *Attendance:* ${el.dispAttendance.textContent}\n` +
      `✅ *Result:* ${status}\n` +
      `💬 *Teacher's Note:* "${currentData.teacherRemarks}"\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Issued on ${currentData.issueDate} under authorized seal.`;

    navigator.clipboard.writeText(summaryText)
      .then(() => {
        showToast('📋 Summary copied to clipboard for SMS/WhatsApp!');
      })
      .catch(() => {
        showToast('❌ Failed to copy to clipboard.');
      });
  }

  /**
   * Export Current Data to JSON file
   */
  function exportDataAsJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentData, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `ReportCard_${currentData.studentName.replace(/\s+/g, '_')}_${currentData.studentRoll}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`💾 Saved: ${filename}`);
  }

  /**
   * Import Data from JSON file
   */
  function importDataFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && parsed.studentName && Array.isArray(parsed.subjects)) {
          currentData = parsed;
          populateEditorForm();
          renderLiveReportSheet();
          showToast(`📂 Loaded report card for ${parsed.studentName}!`);
        } else {
          showToast('⚠️ Invalid report card file structure.');
        }
      } catch (err) {
        showToast('❌ Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // Presets
    el.presetSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (PRESETS[selected]) {
        currentData = JSON.parse(JSON.stringify(PRESETS[selected]));
        populateEditorForm();
        renderLiveReportSheet();
        showToast(`✨ Preset "${e.target.options[e.target.selectedIndex].text}" loaded!`);
      }
    });

    // Theme selector
    el.themeSelector.addEventListener('change', (e) => {
      el.sheet.className = `report-sheet ${e.target.value} ${el.borderSelector.value}`;
    });

    // Border selector
    el.borderSelector.addEventListener('change', (e) => {
      el.sheet.className = `report-sheet ${el.themeSelector.value} ${e.target.value}`;
    });

    // Toggles
    el.toggleWatermark.addEventListener('change', (e) => {
      el.sheetWatermark.classList.toggle('hidden', !e.target.checked);
    });

    el.toggleSeal.addEventListener('change', (e) => {
      el.sheetSealBlock.classList.toggle('hidden', !e.target.checked);
    });

    el.toggleStudentPhoto.addEventListener('change', (e) => {
      el.studentPhotoContainer.classList.toggle('hidden', !e.target.checked);
    });

    // Accordions
    document.querySelectorAll('.accordion-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const item = button.closest('.accordion-item');
        const isActive = item.classList.contains('active');
        item.classList.toggle('active', !isActive);
        button.setAttribute('aria-expanded', String(!isActive));
      });
    });

    // Form Input Real-time synchronization
    const inputsToWatch = [
      el.schoolName, el.schoolBoard, el.schoolCode, el.schoolAddress, el.schoolMotto,
      el.academicSession, el.examTitle, el.studentName, el.studentRoll, el.studentClass,
      el.studentAdmission, el.studentDob, el.fatherName, el.motherName,
      el.attendanceAttended, el.attendanceTotal, el.gradeDiscipline, el.gradeWork,
      el.gradeArt, el.gradeHealth, el.teacherRemarks, el.signTeacher, el.signPrincipal,
      el.issueDate, el.finalResultStatus
    ];

    inputsToWatch.forEach(input => {
      input.addEventListener('input', updateDataFromInputs);
      input.addEventListener('change', updateDataFromInputs);
    });

    // Subjects List Interactions (Delegation)
    el.subjectsEditorList.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-idx');
      const field = e.target.getAttribute('data-field');
      if (idx !== null && field) {
        if (field === 'name') {
          currentData.subjects[idx].name = e.target.value;
        } else {
          currentData.subjects[idx][field] = Number(e.target.value) || 0;
        }
        renderLiveReportSheet();
      }
    });

    el.subjectsEditorList.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.btn-icon-del');
      if (delBtn) {
        const idx = Number(delBtn.getAttribute('data-del'));
        if (currentData.subjects.length <= 1) {
          showToast('⚠️ At least one subject is required.');
          return;
        }
        currentData.subjects.splice(idx, 1);
        renderSubjectsEditor();
        renderLiveReportSheet();
      }
    });

    // Add Subject
    el.btnAddSubject.addEventListener('click', () => {
      const newIndex = currentData.subjects.length + 1;
      currentData.subjects.push({
        code: `SUB0${newIndex}`,
        name: `New Subject ${newIndex}`,
        maxTh: 80,
        obtTh: 70,
        maxPr: 20,
        obtPr: 18
      });
      renderSubjectsEditor();
      renderLiveReportSheet();
    });

    // Action Buttons
    el.btnExportJson.addEventListener('click', exportDataAsJson);
    el.importJsonInput.addEventListener('change', importDataFromJson);
    el.btnCopySummary.addEventListener('click', copySummaryToClipboard);
    el.btnPrintPdf.addEventListener('click', () => {
      window.print();
    });
  }

  // Initialize
  function init() {
    populateEditorForm();
    renderLiveReportSheet();
    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
