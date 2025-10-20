class Todo {
    constructor() {
        this.tasks = [];
        this.term = "";
        this.loadTasks();

        this.taskList = document.getElementById("taskList");
        this.newTaskInput = document.getElementById("newTaskInput");
        this.newTaskDate = document.getElementById("newTaskDate");
        this.addTaskBtn = document.getElementById("addTaskBtn");
        this.searchInput = document.getElementById("searchInput");

        this.addTaskBtn.addEventListener("click", () => this.addTask());

        this.searchInput.addEventListener("input", () => {
            this.term = this.searchInput.value.trim().toLowerCase();
            this.draw();
        });        

        this.draw();
    }

    get filteredTasks() {
        if (this.term.length < 2) return this.tasks; // jeśli fraza < 2 znaki, pokazujemy wszystkie
        return this.tasks.filter(task => task.text.toLowerCase().includes(this.term));
    }

    saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem("tasks");
        if (saved) {
            this.tasks = JSON.parse(saved);
        }
    }

    addTask() {
        const text = this.newTaskInput.value.trim();
        const date = this.newTaskDate.value;

        if (text.length < 3 || text.length > 255) {
            alert("Zadanie musi mieć od 3 do 255 znaków!");
            return;
        }
        if (date && new Date(date) < new Date()) {
            alert("Data musi być w przyszłości!");
            return;
        }

        this.tasks.push({ text, deadline: date });
        this.newTaskInput.value = "";
        this.newTaskDate.value = "";

        this.saveTasks();
        this.draw();
    }

    deleteTask(index) {
        this.tasks.splice(index, 1);
        this.saveTasks();
        this.draw();
    }

    editTask(index) {
        const task = this.tasks[index];
        const li = this.taskList.children[index];
        li.innerHTML = ""; // wyczyść li

        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.value = task.text;
        textInput.style.marginRight = "5px";

        const dateInput = document.createElement("input");
        dateInput.type = "datetime-local";
        dateInput.value = task.deadline || "";
        dateInput.style.marginRight = "5px";

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Zapisz";
        saveBtn.addEventListener("click", () => {
            const newText = textInput.value.trim();
            const newDate = dateInput.value;

            if (newText.length < 3 || newText.length > 255) {
                alert("Zadanie musi mieć od 3 do 255 znaków!");
                return;
            }
            if (newDate && new Date(newDate) < new Date()) {
                alert("Data musi być w przyszłości!");
                return;
            }

            task.text = newText;
            task.deadline = newDate;
            this.saveTasks();
            this.draw();
        });

        li.appendChild(textInput);
        li.appendChild(dateInput);
        li.appendChild(saveBtn);
    }

    draw() {
        this.taskList.innerHTML = "";
    
        this.filteredTasks.forEach((task, index) => {
            const li = document.createElement("li");
    
            // Tekst zadania z wyróżnieniem frazy
            const textSpan = document.createElement("span");
            textSpan.className = "task-text";
            if (this.term.length >= 2) {
                const regex = new RegExp(`(${this.term})`, "gi");
                textSpan.innerHTML = task.text.replace(regex, '<span class="highlight">$1</span>');
            } else {
                textSpan.textContent = task.text;
            }
    
            // Termin
            const dateSpan = document.createElement("span");
            dateSpan.className = "task-date";
            if (task.deadline) {
                const formatted = new Date(task.deadline).toLocaleString("pl-PL");
                dateSpan.textContent = `Termin: ${formatted}`;
            } else {
                dateSpan.textContent = "Brak terminu";
            }
    
            // Przycisk edycji
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edytuj";
            editBtn.style.marginLeft = "5px";
            editBtn.addEventListener("click", () => this.editTask(index));
    
            // Przycisk usuwania
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑️";
            deleteBtn.className = "delete-btn";
            deleteBtn.addEventListener("click", () => this.deleteTask(index));
    
            li.appendChild(textSpan);
            li.appendChild(dateSpan);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
    
            this.taskList.appendChild(li);
        });
    }
    
}

// inicjalizacja
window.addEventListener("DOMContentLoaded", () => {
    window.todoApp = new Todo();
});
