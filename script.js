// ===== Helpers for localStorage =====
function getData(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ===== Quotes / tips for dashboard =====
const tips = [
  "Block 25-minute focus sessions and reward yourself with 5-minute breaks.",
  "Start with the hardest topic first while your mind is fresh.",
  "Teach a concept to a friend or imaginary class to test understanding.",
  "Turn big chapters into tiny daily goals to avoid last-minute panic.",
  "Summarize what you learned today in 3 bullet points."
];

function initDashboard() {
  const quoteEl = document.getElementById("quote");
  const tTasks = document.getElementById("totalTasks");
  const uTasks = document.getElementById("upcomingTasks");
  const tNotes = document.getElementById("totalNotes");

  if (!quoteEl && !tTasks) return;

  const dayIndex = new Date().getDate() % tips.length;
  if (quoteEl) quoteEl.textContent = tips[dayIndex];

  const tasks = getData("eduhub_tasks", []);
  const notes = getData("eduhub_notes", []);

  const pendingCount = tasks.filter(t => t.status === "pending").length;

  if (tTasks) tTasks.textContent = tasks.length;
  if (uTasks) uTasks.textContent = pendingCount;
  if (tNotes) tNotes.textContent = notes.length;
}

// ===== Study Planner page =====
function initPlanner() {
  const form = document.getElementById("plannerForm");
  const tbody = document.getElementById("tasksBody");
  if (!form || !tbody) return;

  let tasks = getData("eduhub_tasks", []);

  function renderTasks() {
    tbody.innerHTML = "";
    if (tasks.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "No tasks added yet. Start by creating a subject and topic.";
      td.style.color = "#9ca3af";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    tasks.forEach((t, index) => {
      const tr = document.createElement("tr");

      const sTd = document.createElement("td");
      sTd.textContent = t.subject;
      tr.appendChild(sTd);

      const topicTd = document.createElement("td");
      topicTd.textContent = t.topic;
      tr.appendChild(topicTd);

      const dTd = document.createElement("td");
      dTd.textContent = t.date || "-";
      tr.appendChild(dTd);

      const stTd = document.createElement("td");
      const span = document.createElement("span");
      span.className = "status-pill " + (t.status === "done" ? "status-done" : "status-pending");
      span.textContent = t.status === "done" ? "Done" : "Pending";
      stTd.appendChild(span);
      tr.appendChild(stTd);

      const actTd = document.createElement("td");
      const doneBtn = document.createElement("button");
      doneBtn.textContent = "Mark Done";
      doneBtn.style.marginRight = "6px";
      doneBtn.onclick = () => {
        tasks[index].status = "done";
        setData("eduhub_tasks", tasks);
        renderTasks();
      };

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.style.background = "#ef4444";
      delBtn.onclick = () => {
        tasks.splice(index, 1);
        setData("eduhub_tasks", tasks);
        renderTasks();
      };

      actTd.appendChild(doneBtn);
      actTd.appendChild(delBtn);
      tr.appendChild(actTd);

      tbody.appendChild(tr);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const subject = document.getElementById("subject").value.trim();
    const topic = document.getElementById("topic").value.trim();
    const date = document.getElementById("date").value;

    if (!subject || !topic) {
      alert("Please enter both subject and topic.");
      return;
    }

    tasks.push({
      subject,
      topic,
      date,
      status: "pending",
      createdAt: new Date().toISOString()
    });
    setData("eduhub_tasks", tasks);
    form.reset();
    renderTasks();
  });

  renderTasks();
}

// ===== Notes page =====
function initNotes() {
  const form = document.getElementById("noteForm");
  const container = document.getElementById("notesContainer");
  const filterSel = document.getElementById("filterSubject");
  if (!form || !container) return;

  let notes = getData("eduhub_notes", []);

  function fillFilter() {
    if (!filterSel) return;
    const subjects = Array.from(new Set(notes.map(n => n.subject.trim()))).filter(Boolean).sort();
    filterSel.innerHTML = '<option value="all">All subjects</option>';
    subjects.forEach(s => {
      const o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      filterSel.appendChild(o);
    });
  }

  function renderNotes(filter = "all") {
    container.innerHTML = "";
    let data = notes;
    if (filter !== "all") {
      data = notes.filter(n => n.subject === filter);
    }

    if (data.length === 0) {
      const p = document.createElement("p");
      p.textContent = "No notes yet. Create your first note above.";
      p.style.color = "#9ca3af";
      container.appendChild(p);
      return;
    }

    data.forEach(note => {
      const card = document.createElement("div");
      card.className = "note-card";

      const tag = document.createElement("div");
      tag.className = "note-tag";
      tag.textContent = note.subject || "General";
      card.appendChild(tag);

      const title = document.createElement("h4");
      title.textContent = note.title;
      card.appendChild(title);

      const preview = document.createElement("p");
      const text = note.content.length > 140 ? note.content.slice(0, 140) + "..." : note.content;
      preview.textContent = text;
      card.appendChild(preview);

      const meta = document.createElement("small");
      meta.style.color = "#9ca3af";
      meta.textContent = "Created: " + new Date(note.createdAt).toLocaleString();
      card.appendChild(meta);

      const btn = document.createElement("button");
      btn.textContent = "Delete";
      btn.style.marginTop = "6px";
      btn.style.background = "#ef4444";
      btn.onclick = () => {
        const idx = notes.indexOf(note);
        if (idx > -1) {
          notes.splice(idx, 1);
          setData("eduhub_notes", notes);
          fillFilter();
          renderNotes(filterSel ? filterSel.value : "all");
        }
      };
      card.appendChild(btn);

      container.appendChild(card);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("noteTitle").value.trim();
    const subject = document.getElementById("noteSubject").value.trim();
    const content = document.getElementById("noteContent").value.trim();

    if (!title || !subject || !content) {
      alert("Please fill in all note fields.");
      return;
    }

    notes.push({
      title,
      subject,
      content,
      createdAt: new Date().toISOString()
    });
    setData("eduhub_notes", notes);
    form.reset();
    fillFilter();
    renderNotes(filterSel ? filterSel.value : "all");
  });

  if (filterSel) {
    filterSel.addEventListener("change", () => {
      renderNotes(filterSel.value);
    });
  }

  fillFilter();
  renderNotes();
}

// ===== Profile page =====
function initProfile() {
  const sEl = document.getElementById("profileTotalSubjects");
  const nEl = document.getElementById("profileTotalNotes");
  const cEl = document.getElementById("profileCompletedTasks");
  if (!sEl || !nEl || !cEl) return;

  const tasks = getData("eduhub_tasks", []);
  const notes = getData("eduhub_notes", []);

  const uniqueSubjects = Array.from(new Set(tasks.map(t => t.subject)));
  const completed = tasks.filter(t => t.status === "done").length;

  sEl.textContent = uniqueSubjects.length;
  nEl.textContent = notes.length;
  cEl.textContent = completed;
}

// ===== Init per page =====
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  initPlanner();
  initNotes();
  initProfile();
});
