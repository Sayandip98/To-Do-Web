(() => {
  const listEl = document.getElementById("list");
  const newTaskEl = document.getElementById("newTask");
  const addBtn = document.getElementById("addBtn");
  const countEl = document.getElementById("count");
  const chips = Array.from(document.querySelectorAll(".chip"));
  const searchEl = document.getElementById("search");
  const themeToggle = document.getElementById("themeToggle");
  const clearCompletedBtn = document.getElementById("clearCompleted");
  const clearAllBtn = document.getElementById("clearAll");

  let tasks = [];
  let filter = "all";
  let query = "";

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const save = () => localStorage.setItem("mr_todo_v1", JSON.stringify(tasks));
  const load = () => JSON.parse(localStorage.getItem("mr_todo_v1") || "[]");

  const init = () => {
    tasks = load();
    render();
    const t =
      localStorage.getItem("mr_todo_theme") ||
      (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme:light)").matches
        ? "light"
        : "dark");
    if (t === "light") document.body.classList.add("light");
  };

  function createTaskEl(task) {
    const el = document.createElement("div");
    el.className = "todo";
    el.draggable = true;
    el.dataset.id = task.id;

    const left = document.createElement("div");
    left.className = "left";
    const check = document.createElement("div");
    check.className = "check";
    check.tabIndex = 0;
    if (task.done) {
      check.classList.add("checked");
      check.innerHTML = "&#10003;";
    }
    const txt = document.createElement("div");
    txt.className = "text";
    txt.textContent = task.text;
    if (task.done) txt.classList.add("done");
    left.appendChild(check);
    left.appendChild(txt);

    const actions = document.createElement("div");
    actions.className = "actions";
    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.innerHTML = "✎";
    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.innerHTML = "✕";
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = new Date(task.created).toLocaleString();
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    el.appendChild(left);
    el.appendChild(actions);
    el.appendChild(meta);

    check.addEventListener("click", () => {
      toggleDone(task.id);
    });
    delBtn.addEventListener("click", () => {
      removeTask(task.id);
    });
    editBtn.addEventListener("click", () => {
      editTaskInline(el, task);
    });
    txt.addEventListener("dblclick", () => {
      editTaskInline(el, task);
    });

    el.addEventListener("dragstart", (e) => {
      el.classList.add("dragging");
      e.dataTransfer.setData("text/plain", task.id);
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      save();
      render();
    });

    return el;
  }

  function render() {
    const q = query.trim().toLowerCase();
    let shown = tasks.filter((t) => {
      if (filter === "active" && t.done) return false;
      if (filter === "completed" && !t.done) return false;
      if (q && !t.text.toLowerCase().includes(q)) return false;
      return true;
    });

    listEl.innerHTML = "";
    if (shown.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.innerHTML =
        '<strong>No tasks</strong><div style="margin-top:8px;color:var(--muted)">Add a task to get started</div>';
      listEl.appendChild(empty);
    } else {
      shown.forEach((t) => listEl.appendChild(createTaskEl(t)));
    }

    const remaining = tasks.filter((t) => !t.done).length;
    countEl.textContent = `${remaining} ${
      remaining === 1 ? "item" : "items"
    } left`;
    chips.forEach((c) =>
      c.classList.toggle("active", c.dataset.filter === filter)
    );
    listEl.addEventListener("dragover", handleDragOver);
  }

  function handleDragOver(e) {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const after = getDragAfterElement(listEl, e.clientY);
    if (!dragging) return;
    if (after == null) listEl.appendChild(dragging);
    else listEl.insertBefore(dragging, after);
    const ids = Array.from(listEl.querySelectorAll(".todo")).map(
      (el) => el.dataset.id
    );
    tasks = ids.map((id) => tasks.find((t) => t.id === id)).filter(Boolean);
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".todo:not(.dragging)"),
    ];
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset)
          return { offset, element: child };
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  function addTask(text) {
    if (!text.trim()) return;
    const t = {
      id: uid(),
      text: text.trim(),
      done: false,
      created: Date.now(),
    };
    tasks.unshift(t);
    save();
    render();
  }

  function removeTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  function toggleDone(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    save();
    render();
  }

  function editTaskInline(el, task) {
    const txt = el.querySelector(".text");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "input";
    input.value = task.text;
    txt.replaceWith(input);
    input.focus();
    function saveEdit() {
      const v = input.value.trim();
      if (v) {
        task.text = v;
      } else {
        removeTask(task.id);
      }
      save();
      render();
    }
    input.addEventListener("blur", saveEdit, { once: true });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
      if (e.key === "Escape") render();
    });
  }

  addBtn.addEventListener("click", () => {
    addTask(newTaskEl.value);
    newTaskEl.value = "";
    newTaskEl.focus();
  });
  newTaskEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addTask(newTaskEl.value);
      newTaskEl.value = "";
    }
  });

  chips.forEach((c) =>
    c.addEventListener("click", () => {
      filter = c.dataset.filter;
      render();
    })
  );
  searchEl.addEventListener("input", (e) => {
    query = e.target.value;
    render();
  });

  clearCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter((t) => !t.done);
    save();
    render();
  });
  clearAllBtn.addEventListener("click", () => {
    if (confirm("Clear ALL tasks?")) {
      tasks = [];
      save();
      render();
    }
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem(
      "mr_todo_theme",
      document.body.classList.contains("light") ? "light" : "dark"
    );
  });

  if (!localStorage.getItem("mr_todo_v1")) {
    tasks = [
      {
        id: uid(),
        text: "Welcome! Add your tasks here",
        done: false,
        created: Date.now(),
      },
      {
        id: uid(),
        text: "Try double-click to edit",
        done: false,
        created: Date.now(),
      },
      {
        id: uid(),
        text: "Drag to reorder tasks",
        done: false,
        created: Date.now(),
      },
    ];
    save();
  }

  init();
})();
