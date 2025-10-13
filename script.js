// Elements
const initialAmountInput = document.getElementById('initial-amount');
const updateInitialBtn = document.getElementById('update-initial');
const totalAmountSpan = document.getElementById('total-amount');
const percentageSpentSpan = document.getElementById('percentage-spent');
const totalSpentSpan = document.getElementById('total-spent');
const numExpensesSpan = document.getElementById('num-expenses');
const avgExpenseSpan = document.getElementById('avg-expense');
const totalReceivableSpan = document.getElementById('total-receivable');
const numReceivablesSpan = document.getElementById('num-receivables');
const avgReceivableSpan = document.getElementById('avg-receivable');
const toggleThemeBtn = document.getElementById('toggle-theme');
const expenseForm = document.getElementById('expense-form');
const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategoryInput = document.getElementById('expense-category');
const expenseTbody = document.getElementById('expense-tbody');
const receivableForm = document.getElementById('receivable-form');
const receivableNameInput = document.getElementById('receivable-name');
const receivableAmountInput = document.getElementById('receivable-amount');
const receivableCategoryInput = document.getElementById('receivable-category');
const receivableTbody = document.getElementById('receivable-tbody');
const exportCsvBtn = document.getElementById('export-csv');

// Data
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let receivables = JSON.parse(localStorage.getItem('receivables')) || [];
let initialAmount = parseFloat(localStorage.getItem('initialAmount')) || 10000;
let editingId = null;
let editingReceivableId = null;
let activeTab = localStorage.getItem('activeTab') || 'home';

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderExpenses();
    renderReceivables();
    updateDisplay();
    loadTheme();
    switchToTab(activeTab);
});

// Load theme
function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleThemeBtn.textContent = 'Modo Claro';
    } else {
        toggleThemeBtn.textContent = 'Modo Oscuro';
    }
}

// Switch tab
function switchToTab(tab) {
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    document.getElementById(tab + '-tab').style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    localStorage.setItem('activeTab', tab);
}

// Tab event listeners
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchToTab(tab);
    });
});

// Toggle theme
toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    toggleThemeBtn.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
});

// Export to CSV
exportCsvBtn.addEventListener('click', exportToCSV);

// Update initial amount
updateInitialBtn.addEventListener('click', () => {
    const newAmount = parseFloat(initialAmountInput.value);
    if (newAmount >= 0) {
        initialAmount = newAmount;
        localStorage.setItem('initialAmount', initialAmount);
        updateDisplay();
    } else {
        alert('El monto inicial debe ser positivo.');
    }
});

// Form submit
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = expenseNameInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const category = expenseCategoryInput.value.trim();

    if (!name || amount <= 0) {
        alert('Por favor, ingresa un nombre válido y un monto positivo.');
        return;
    }

    if (editingId !== null) {
        // Edit existing
        const expense = expenses.find(e => e.id === editingId);
        if (expense) {
            expense.name = name;
            expense.amount = amount;
            expense.category = category;
        }
        editingId = null;
        expenseForm.querySelector('button[type="submit"]').textContent = 'Agregar Gasto';
    } else {
        // Add new
        const newExpense = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            name,
            amount,
            category
        };
        expenses.unshift(newExpense); // Newest first
    }

    saveData();
    renderExpenses();
    updateDisplay();
    expenseForm.reset();
    alert('Gasto agregado correctamente.');
});

// Receivable form submit
receivableForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = receivableNameInput.value.trim();
    const amount = parseFloat(receivableAmountInput.value);
    const category = receivableCategoryInput.value.trim();

    if (!name || amount <= 0) {
        alert('Por favor, ingresa un nombre válido y un monto positivo.');
        return;
    }

    if (editingReceivableId !== null) {
        // Edit existing
        const receivable = receivables.find(r => r.id === editingReceivableId);
        if (receivable) {
            receivable.name = name;
            receivable.amount = amount;
            receivable.category = category;
        }
        editingReceivableId = null;
        receivableForm.querySelector('button[type="submit"]').textContent = 'Agregar Monto a Cobrar';
    } else {
        // Add new
        const newReceivable = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            name,
            amount,
            category
        };
        receivables.unshift(newReceivable); // Newest first
    }

    saveData();
    renderReceivables();
    updateDisplay();
    receivableForm.reset();
    alert('Monto a cobrar agregado correctamente.');
});

// Render expenses
function renderExpenses() {
    expenseTbody.innerHTML = '';
    const expenseCards = document.getElementById('expense-cards');
    expenseCards.innerHTML = '';

    expenses.forEach(expense => {
        // Table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.name}</td>
            <td>${expense.category}</td>
            <td>$${expense.amount.toFixed(2)}</td>
            <td class="actions">
                <button class="edit-btn" data-id="${expense.id}">Editar</button>
                <button class="delete-btn" data-id="${expense.id}">Eliminar</button>
            </td>
        `;
        expenseTbody.appendChild(row);

        // Mobile card
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="date">${expense.date}</div>
            <div class="details">
                <span><strong>${expense.name}</strong> - ${expense.category}</span>
                <span>$${expense.amount.toFixed(2)}</span>
            </div>
            <div class="actions">
                <button class="edit-btn" data-id="${expense.id}">Editar</button>
                <button class="delete-btn" data-id="${expense.id}">Eliminar</button>
            </div>
        `;
        expenseCards.appendChild(card);
    });

    // Add event listeners for edit/delete
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            editExpense(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteExpense(id);
        });
    });

    // Draw chart
    drawChart();
}

// Render receivables
function renderReceivables() {
    receivableTbody.innerHTML = '';
    const receivableCards = document.getElementById('receivable-cards');
    receivableCards.innerHTML = '';

    receivables.forEach(receivable => {
        // Table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${receivable.date}</td>
            <td>${receivable.name}</td>
            <td>${receivable.category}</td>
            <td>$${receivable.amount.toFixed(2)}</td>
            <td class="actions">
                <button class="edit-receivable-btn" data-id="${receivable.id}">Editar</button>
                <button class="delete-receivable-btn" data-id="${receivable.id}">Eliminar</button>
            </td>
        `;
        receivableTbody.appendChild(row);

        // Mobile card
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="date">${receivable.date}</div>
            <div class="details">
                <span><strong>${receivable.name}</strong> - ${receivable.category}</span>
                <span>$${receivable.amount.toFixed(2)}</span>
            </div>
            <div class="actions">
                <button class="edit-receivable-btn" data-id="${receivable.id}">Editar</button>
                <button class="delete-receivable-btn" data-id="${receivable.id}">Eliminar</button>
            </div>
        `;
        receivableCards.appendChild(card);
    });

    // Add event listeners for edit/delete
    document.querySelectorAll('.edit-receivable-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            editReceivable(id);
        });
    });

    document.querySelectorAll('.delete-receivable-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteReceivable(id);
        });
    });
}

// Edit expense
function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
        expenseNameInput.value = expense.name;
        expenseAmountInput.value = expense.amount;
        expenseCategoryInput.value = expense.category;
        editingId = id;
        expenseForm.querySelector('button[type="submit"]').textContent = 'Actualizar Gasto';
    }
}

// Delete expense
function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    saveData();
    renderExpenses();
    updateDisplay();
}

// Edit receivable
function editReceivable(id) {
    const receivable = receivables.find(r => r.id === id);
    if (receivable) {
        receivableNameInput.value = receivable.name;
        receivableAmountInput.value = receivable.amount;
        receivableCategoryInput.value = receivable.category;
        editingReceivableId = id;
        receivableForm.querySelector('button[type="submit"]').textContent = 'Actualizar Monto a Cobrar';
    }
}

// Delete receivable
function deleteReceivable(id) {
    receivables = receivables.filter(r => r.id !== id);
    saveData();
    renderReceivables();
    updateDisplay();
}

// Update display
function updateDisplay() {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalReceivable = receivables.reduce((sum, r) => sum + r.amount, 0);
    const remaining = initialAmount + totalReceivable - totalSpent;
    totalAmountSpan.textContent = remaining.toFixed(2);
    const percentage = initialAmount > 0 ? (totalSpent / initialAmount * 100).toFixed(2) : 0;
    percentageSpentSpan.textContent = `${percentage}%`;

    // Summary stats
    totalSpentSpan.textContent = totalSpent.toFixed(2);
    numExpensesSpan.textContent = expenses.length;
    avgExpenseSpan.textContent = expenses.length > 0 ? (totalSpent / expenses.length).toFixed(2) : '0.00';
    totalReceivableSpan.textContent = totalReceivable.toFixed(2);
    numReceivablesSpan.textContent = receivables.length;
    avgReceivableSpan.textContent = receivables.length > 0 ? (totalReceivable / receivables.length).toFixed(2) : '0.00';
}

// Save data
function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('receivables', JSON.stringify(receivables));
    localStorage.setItem('initialAmount', initialAmount);
}

// Load data
function loadData() {
    initialAmountInput.value = initialAmount;
}

// Draw expense chart
function drawChart() {
    const canvas = document.getElementById('expense-chart');
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate data
    const categorySums = {};
    expenses.forEach(exp => {
        categorySums[exp.category] = (categorySums[exp.category] || 0) + exp.amount;
    });

    const categories = Object.keys(categorySums);
    const amounts = Object.values(categorySums);

    if (amounts.length === 0) {
        ctx.font = '20px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('No hay gastos para mostrar', canvas.width / 2, canvas.height / 2);
        return;
    }

    const total = amounts.reduce((a, b) => a + b, 0);

    // Colors
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

    // Draw pie
    let startAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    amounts.forEach((amount, i) => {
        const sliceAngle = (amount / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        startAngle += sliceAngle;
    });

    // Legend
    const legendX = 20;
    let legendY = 20;
    categories.forEach((cat, i) => {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(legendX, legendY, 15, 15);
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${cat}: $${amounts[i].toFixed(2)}`, legendX + 20, legendY + 12);
        legendY += 25;
    });
}

// Export expenses to CSV
function exportToCSV() {
    let csv = 'Fecha,Nombre,Categoria,Monto\n';
    expenses.forEach(e => {
        csv += `${e.date},"${e.name}",${e.category},${e.amount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gastos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
