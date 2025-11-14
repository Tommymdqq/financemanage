// Inicializar iconos de Lucide (para la barra de navegación y la modal)
lucide.createIcons();

// ----------------------------------------------------
// 1. DATOS Y FUNCIONES ORIGINALES DE LA APP
// ----------------------------------------------------

// Data
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let receivables = JSON.parse(localStorage.getItem('receivables')) || [];
let initialAmount = parseFloat(localStorage.getItem('initialAmount')) || 0;
let editingId = null;
let editingReceivableId = null;
let activeTab = localStorage.getItem('activeTab') || 'home';

// Categorías disponibles
const categories = [
    { name: 'Comida', icon: 'utensils' },
    { name: 'Transporte', icon: 'car' },
    { name: 'Entretenimiento', icon: 'laugh' },
    { name: 'Salud', icon: 'heart' },
    { name: 'Educación', icon: 'book-open' },
    { name: 'Casa', icon: 'home' },
    { name: 'Ropa', icon: 'shirt' },
    { name: 'Tecnología', icon: 'smartphone' },
    { name: 'Viajes', icon: 'plane' },
    { name: 'Mascotas', icon: 'paw-print' },
    { name: 'Regalos', icon: 'gift' },
    { name: 'Deportes', icon: 'dumbbell' },
    { name: 'Belleza', icon: 'sparkles' },
    { name: 'Servicios', icon: 'wrench' },
    { name: 'Inversiones', icon: 'trending-up' },
    { name: 'Ahorro', icon: 'piggy-bank' },
    { name: 'Trabajo', icon: 'briefcase' },
    { name: 'Familia', icon: 'users' },
    { name: 'Otros', icon: 'more-horizontal' },
];

// Función de formato (ej: 1230.50 -> $1.230,50)
const formatCurrency = (amount) => {
    // Limitar el monto para evitar deformaciones en la UI
    const limitedAmount = Math.abs(amount) > 999999999 ? 999999999 : amount;
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(limitedAmount);
};

// Función para obtener la clase de color basada en el porcentaje
const getRiskColor = (percentage) => {
    if (percentage >= 91) return 'bg-danger';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-success';
};

// Función para obtener icono de categoría
const getCategoryIcon = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category ? category.icon : 'more-horizontal';
};

// ----------------------------------------------------
// 2. RENDERING DEL DASHBOARD
// ----------------------------------------------------

function renderDashboard() {
    // Calcular datos reales
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalReceivables = receivables.reduce((sum, rec) => sum + rec.amount, 0);
    const saldoTotal = initialAmount + totalReceivables - totalExpenses;

    // Calcular gastos e ingresos del mes actual
    const now = new Date();
    const currentMonthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });
    const gastoMes = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Para ingresos, asumimos que los receivables son ingresos pendientes
    const currentMonthReceivables = receivables.filter(rec => {
        // Asumimos que no tienen fecha, o podemos agregar lógica
        return true; // Por simplicidad, todos los receivables son ingresos del mes
    });
    const ingresoMes = currentMonthReceivables.reduce((sum, rec) => sum + rec.amount, 0);

    // 1. Saldo Total y Resumen Mensual
    document.getElementById('saldo-total').textContent = formatCurrency(saldoTotal);
    document.getElementById('monto-gasto').textContent = formatCurrency(gastoMes);
    document.getElementById('monto-ingreso').textContent = formatCurrency(ingresoMes);
    document.getElementById('saldo-neto').textContent = formatCurrency(ingresoMes - gastoMes);

    // 2. Presupuestos en Riesgo (usando datos reales de localStorage)
    const budgets = JSON.parse(localStorage.getItem('budgets')) || [
        { category: 'Comida', limit: 500, spent: 0 },
        { category: 'Transporte', limit: 300, spent: 0 },
        { category: 'Entretenimiento', limit: 200, spent: 0 }
    ];

    // Calcular gastos por categoría
    const spentByCategory = {};
    expenses.forEach(exp => {
        spentByCategory[exp.category] = (spentByCategory[exp.category] || 0) + exp.amount;
    });

    const riesgoContainer = document.getElementById('riesgo-cards');
    const noRiesgoMsg = document.getElementById('no-riesgo-msg');
    riesgoContainer.innerHTML = '';

    const presupuestosEnRiesgo = budgets
        .map(budget => ({
            ...budget,
            spent: spentByCategory[budget.category] || 0,
            percentage: ((spentByCategory[budget.category] || 0) / budget.limit) * 100,
            icon: getCategoryIcon(budget.category)
        }))
        .filter(b => b.percentage >= 75 && b.percentage <= 100)
        .slice(0, 3);

    if (presupuestosEnRiesgo.length === 0) {
        noRiesgoMsg.classList.remove('hidden');
    } else {
        noRiesgoMsg.classList.add('hidden');
        presupuestosEnRiesgo.forEach(p => {
            const colorClass = getRiskColor(p.percentage).replace('bg-', 'text-');
            const fillClass = getRiskColor(p.percentage);
            const card = `
                <div class="card-bg p-3 rounded-xl flex flex-col items-start w-full">
                    <div class="flex items-center space-x-2 mb-2">
                        <i data-lucide="${p.icon}" class="w-5 h-5 ${colorClass}"></i>
                        <span class="text-sm font-medium">${p.category}</span>
                    </div>
                    <p class="text-xs font-bold ${colorClass}">${formatCurrency(p.spent)} / ${formatCurrency(p.limit)}</p>
                    <div class="progress-bar-container w-full">
                        <div class="progress-fill ${fillClass}" style="width: ${Math.min(p.percentage, 100)}%;"></div>
                    </div>
                    <p class="text-xs mt-1 opacity-70">${Math.round(p.percentage)}% usado</p>
                </div>
            `;
            riesgoContainer.innerHTML += card;
        });
    }
    lucide.createIcons();

    // 3. Transacciones Recientes (últimas 5)
    const transaccionesList = document.getElementById('transacciones-list');
    transaccionesList.innerHTML = '';

    const recentTransactions = [...expenses.map(e => ({ ...e, type: 'expense' })), ...receivables.map(r => ({ ...r, type: 'income' }))]
        .sort((a, b) => (b.id || 0) - (a.id || 0)) // Ordenar por ID (más reciente primero)
        .slice(0, 5);

    if (recentTransactions.length === 0) {
        transaccionesList.innerHTML = '<p class="text-center text-sm opacity-60 py-4">No hay transacciones recientes.</p>';
    } else {
        recentTransactions.forEach(t => {
            const isExpense = t.type === 'expense';
            const amountClass = isExpense ? 'text-danger' : 'text-success';
            const sign = isExpense ? '-' : '+';
            const icon = getCategoryIcon(t.category);
            const transactionId = t.id;
            const deleteFunction = isExpense ? `deleteExpenseFromList(${transactionId})` : `deleteIncomeFromList(${transactionId})`;
            const editFunction = isExpense ? `editExpenseFromList(${transactionId})` : `editIncomeFromList(${transactionId})`;
            const listItem = `
                <li class="flex justify-between items-center p-3 card-bg rounded-xl transition duration-150 hover:opacity-90" data-id="${transactionId}">
                    <div class="flex items-center space-x-3">
                        <div class="p-2 rounded-full bg-gray-700">
                            <i data-lucide="${icon}" class="w-5 h-5 text-white opacity-70"></i>
                        </div>
                        <div>
                            <p class="font-semibold">${t.name || t.category}</p>
                            <p class="text-xs opacity-70">${t.category}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <p class="font-bold text-lg ${amountClass}">${sign}${formatCurrency(t.amount)}</p>
                        <div class="flex space-x-1">
                            <button onclick="${editFunction}" class="text-xs text-primary hover:opacity-80" title="Editar">✏️</button>
                            <button onclick="${deleteFunction}" class="text-xs text-danger hover:opacity-80" title="Eliminar">🗑️</button>
                        </div>
                    </div>
                </li>
            `;
            transaccionesList.innerHTML += listItem;
        });
    }
    lucide.createIcons();
}

// ----------------------------------------------------
// 3. LÓGICA DE LA MODAL (Quick Entry)
// ----------------------------------------------------

// --- NUEVA FUNCIÓN: Muestra un Toast de notificación ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');

    // Determinar color de fondo
    let bgColor = 'bg-success';
    if (type === 'error') bgColor = 'bg-danger';
    if (type === 'warning') bgColor = 'bg-warning';

    const toast = document.createElement('div');
    toast.className = `p-3 rounded-xl shadow-2xl text-white ${bgColor} transition-opacity duration-300 mb-2`;
    toast.textContent = message;

    container.appendChild(toast);

    // Mostrar y luego ocultar después de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300); // Esperar que la transición termine
    }, 3000);
}

function toggleModal(show) {
    const modal = document.getElementById('expense-modal');
    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('modal-enter');
        // Haptic Feedback (Simulación)
        if (navigator.vibrate) navigator.vibrate(50);
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('modal-enter');
        // Limpiar el monto al cerrar
        document.getElementById('monto').value = '';
    }
}

function toggleOptionalFields() {
    const content = document.getElementById('optional-content');
    const icon = document.getElementById('details-icon');
    content.classList.toggle('hidden');

    if (content.classList.contains('hidden')) {
        icon.style.transform = 'rotate(0deg)';
    } else {
        icon.style.transform = 'rotate(180deg)';
    }
}

function renderCategoryCarousel() {
    const carousel = document.getElementById('category-carousel');
    carousel.innerHTML = '';
    categories.forEach((cat, index) => {
        const isSelected = index === 0; // Seleccionamos la primera por defecto
        const item = `
            <div class="flex flex-col items-center flex-shrink-0 cursor-pointer w-16 h-16 justify-center p-2 rounded-xl transition duration-150 hover:opacity-80 ${isSelected ? 'bg-primary' : 'bg-gray-700'}" data-category="${cat.name}">
                <i data-lucide="${cat.icon}" class="w-6 h-6"></i>
                <span class="text-xs mt-1 truncate">${cat.name}</span>
            </div>
        `;
        carousel.innerHTML += item;
    });
    lucide.createIcons();

    // Lógica para seleccionar categoría
    carousel.querySelectorAll('div').forEach(item => {
        item.addEventListener('click', function() {
            carousel.querySelectorAll('div').forEach(i => i.classList.remove('bg-primary'));
            this.classList.add('bg-primary');
            // Aquí se guardaría la categoría seleccionada en un estado
            console.log('Categoría seleccionada:', this.dataset.category);
        });
    });
}

function saveTransaction() {
    const monto = parseFloat(document.getElementById('monto').value);
    const selectedCategoryElement = document.querySelector('#category-carousel .bg-primary');
    const category = selectedCategoryElement ? selectedCategoryElement.dataset.category : null;
    const fuente = document.getElementById('fuente').value;
    const fecha = document.getElementById('fecha').value || new Date().toISOString().split('T')[0];
    const nota = document.getElementById('nota').value;

    if (!monto || monto <= 0) {
        showToast("Por favor, ingresa un monto válido.", 'error');
        return;
    }

    if (!category) {
        showToast("Por favor, selecciona una categoría.", 'error');
        return;
    }

    // Crear el gasto usando la lógica original
    const expense = {
        id: Date.now(),
        amount: Math.min(monto, 999999999), // Limitar monto máximo
        category: category,
        name: (nota || category).substring(0, 50), // Limitar nombre a 50 caracteres
        date: fecha,
        note: nota ? nota.substring(0, 100) : '' // Limitar nota a 100 caracteres
    };

    // Agregar a expenses y guardar
    expenses.unshift(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    // Mostrar mensaje de éxito
    showToast("¡Gasto agregado con éxito!");

    // Cerrar modal y refrescar dashboard
    toggleModal(false);
    renderDashboard();
}

// ----------------------------------------------------
// 4. INICIALIZACIÓN Y FUNCIONES ADICIONALES
// ----------------------------------------------------

// Función para cambiar nombre de usuario
function changeUserName() {
    const newName = prompt('Ingresa tu nombre:');
    if (newName && newName.trim()) {
        // Limitar el nombre a 20 caracteres para evitar deformaciones
        const limitedName = newName.trim().substring(0, 20);
        localStorage.setItem('userName', limitedName);
        document.getElementById('user-name').textContent = limitedName;
    }
}

// Función para editar gasto (desde transacciones recientes)
function editExpenseFromList(expenseId) {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
        // Usar la modal de gasto existente para editar
        document.getElementById('monto').value = expense.amount;
        document.getElementById('nota').value = expense.name || '';
        document.getElementById('fecha').value = expense.date || new Date().toISOString().split('T')[0];

        // Seleccionar categoría
        const categoryItems = document.querySelectorAll('#category-carousel .flex');
        categoryItems.forEach(item => {
            if (item.dataset.category === expense.category) {
                item.classList.add('bg-primary');
            } else {
                item.classList.remove('bg-primary');
            }
        });

        // Cambiar el botón de guardar para editar
        const saveBtn = document.querySelector('#expense-modal button[onclick="saveTransaction()"]');
        saveBtn.textContent = 'Actualizar Gasto';
        saveBtn.onclick = () => updateExpense(expenseId);

        toggleModal(true);
    }
}

// Función para editar ingreso
function editIncomeFromList(incomeId) {
    const income = receivables.find(r => r.id === incomeId);
    if (income) {
        document.getElementById('income-amount').value = income.amount;
        document.getElementById('income-category').value = income.category;
        document.getElementById('income-name').value = income.name;

        // Cambiar el botón de guardar para editar
        const saveBtn = document.querySelector('#income-modal button[onclick="saveIncome()"]');
        saveBtn.textContent = 'Actualizar Ingreso';
        saveBtn.onclick = () => updateIncome(incomeId);

        toggleIncomeModal(true);
    }
}

// Función para actualizar gasto
function updateExpense(expenseId) {
    const monto = parseFloat(document.getElementById('monto').value);
    const selectedCategoryElement = document.querySelector('#category-carousel .bg-primary');
    const category = selectedCategoryElement ? selectedCategoryElement.dataset.category : null;
    const nota = document.getElementById('nota').value;
    const fecha = document.getElementById('fecha').value || new Date().toISOString().split('T')[0];

    if (!monto || monto <= 0 || !category) {
        showToast("Datos inválidos.", 'error');
        return;
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
        expense.amount = monto;
        expense.category = category;
        expense.name = nota || category;
        expense.date = fecha;

        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderDashboard();
        showToast('Gasto actualizado.');
        toggleModal(false);

        // Restaurar botón original
        const saveBtn = document.querySelector('#expense-modal button');
        saveBtn.textContent = 'Guardar Gasto';
        saveBtn.onclick = saveTransaction;
    }
}

// Función para actualizar ingreso
function updateIncome(incomeId) {
    const amount = parseFloat(document.getElementById('income-amount').value);
    const category = document.getElementById('income-category').value;
    const name = document.getElementById('income-name').value;

    if (!amount || amount <= 0 || !name.trim()) {
        showToast("Datos inválidos.", 'error');
        return;
    }

    const income = receivables.find(r => r.id === incomeId);
    if (income) {
        income.amount = amount;
        income.category = category;
        income.name = name.trim();

        localStorage.setItem('receivables', JSON.stringify(receivables));
        renderDashboard();
        showToast('Ingreso actualizado.');
        toggleIncomeModal(false);

        // Restaurar botón original
        const saveBtn = document.querySelector('#income-modal button');
        saveBtn.textContent = 'Guardar Ingreso';
        saveBtn.onclick = saveIncome;
    }
}

// Función para eliminar gasto
function deleteExpenseFromList(expenseId) {
    if (confirm('¿Eliminar este gasto?')) {
        expenses = expenses.filter(e => e.id !== expenseId);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderDashboard();
        showToast('Gasto eliminado.');
    }
}

// Función para eliminar ingreso
function deleteIncomeFromList(incomeId) {
    if (confirm('¿Eliminar este ingreso?')) {
        receivables = receivables.filter(r => r.id !== incomeId);
        localStorage.setItem('receivables', JSON.stringify(receivables));
        renderDashboard();
        showToast('Ingreso eliminado.');
    }
}

// Funciones para modales
function toggleIncomeModal(show) {
    const modal = document.getElementById('income-modal');
    if (show) {
        modal.classList.remove('hidden');
        document.getElementById('income-amount').focus();
    } else {
        modal.classList.add('hidden');
        // Limpiar campos
        document.getElementById('income-amount').value = '';
        document.getElementById('income-category').value = 'Trabajo';
        document.getElementById('income-name').value = '';
    }
}

function toggleSettingsModal(show) {
    const modal = document.getElementById('settings-modal');
    if (show) {
        modal.classList.remove('hidden');
        document.getElementById('initial-amount').value = initialAmount;
        document.getElementById('initial-amount').focus();
    } else {
        modal.classList.add('hidden');
    }
}

// Categorías de ingresos disponibles
const incomeCategories = [
    { name: 'Trabajo', icon: 'briefcase' },
    { name: 'Préstamo', icon: 'credit-card' },
    { name: 'Venta', icon: 'shopping-bag' },
    { name: 'Regalo', icon: 'gift' },
    { name: 'Inversión', icon: 'trending-up' },
    { name: 'Reembolso', icon: 'refresh-cw' },
    { name: 'Freelance', icon: 'laptop' },
    { name: 'Bonos', icon: 'award' },
    { name: 'Dividendos', icon: 'dollar-sign' },
    { name: 'Otros', icon: 'more-horizontal' },
];

// Función para guardar ingreso
function saveIncome() {
    const amount = parseFloat(document.getElementById('income-amount').value);
    const category = document.getElementById('income-category').value;
    const name = document.getElementById('income-name').value;

    if (!amount || amount <= 0) {
        showToast("Por favor, ingresa un monto válido.", 'error');
        return;
    }

    if (!name.trim()) {
        showToast("Por favor, ingresa una descripción.", 'error');
        return;
    }

    const receivable = {
        id: Date.now(),
        amount: Math.min(amount, 999999999), // Limitar monto máximo
        category: category,
        name: name.trim().substring(0, 50) // Limitar nombre a 50 caracteres
    };

    receivables.push(receivable);
    localStorage.setItem('receivables', JSON.stringify(receivables));
    renderDashboard();
    showToast('Ingreso agregado exitosamente.');
    toggleIncomeModal(false);
}

// Función para guardar monto inicial
function saveInitialAmount() {
    const newAmount = parseFloat(document.getElementById('initial-amount').value);
    if (newAmount >= 0) {
        initialAmount = Math.min(newAmount, 999999999); // Limitar monto máximo
        localStorage.setItem('initialAmount', initialAmount);
        renderDashboard();
        showToast('Monto inicial actualizado.');
        toggleSettingsModal(false);
    } else {
        showToast('El monto inicial debe ser positivo.', 'error');
    }
}

// Agregar event listeners para navegación
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners para navegación inferior
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === 'reports') {
                showReports();
            } else if (tab === 'budgets') {
                showBudgets();
            } else if (tab === 'settings') {
                showSettings();
            } else {
                showToast('Ya estás en el Dashboard.');
            }
        });
    });

    // Hacer que el nombre de usuario sea clickeable para cambiarlo
    document.getElementById('user-name').addEventListener('click', changeUserName);

    // Agregar menú contextual a transacciones (click derecho o largo)
    document.getElementById('transacciones-list').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showToast('Mantén presionado para opciones.');
    });
});

// Función para mostrar reportes con gráfica
function showReports() {
    // Crear modal de reportes
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.innerHTML = `
        <div class="card-bg p-6 rounded-3xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold">📊 Reportes Financieros</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <div class="space-y-6">
                <!-- Resumen -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="card-bg p-4 rounded-xl text-center">
                        <p class="text-sm opacity-70">Saldo Total</p>
                        <p class="text-lg font-bold text-primary">${formatCurrency(initialAmount + receivables.reduce((sum, r) => sum + r.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0))}</p>
                    </div>
                    <div class="card-bg p-4 rounded-xl text-center">
                        <p class="text-sm opacity-70">Transacciones</p>
                        <p class="text-lg font-bold">${expenses.length + receivables.length}</p>
                    </div>
                </div>

                <!-- Gráfica de Gastos por Categoría -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Gastos por Categoría</h4>
                    <canvas id="categoryChart" width="300" height="200"></canvas>
                </div>

                <!-- Lista de Gastos por Categoría -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">Detalle por Categoría</h4>
                    <div class="space-y-2" id="categoryList"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    // Calcular datos para la gráfica
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    // Crear gráfica
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'white',
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    // Llenar lista de categorías
    const categoryList = document.getElementById('categoryList');
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
        const percentage = ((amount / amounts.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
        categoryList.innerHTML += `
            <div class="flex justify-between items-center p-3 card-bg rounded-xl">
                <span class="font-medium">${cat}</span>
                <div class="text-right">
                    <p class="font-bold">${formatCurrency(amount)}</p>
                    <p class="text-xs opacity-70">${percentage}%</p>
                </div>
            </div>
        `;
    });

    // Nueva función: Gráfica de tendencia de gastos
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    const monthlyData = calculateMonthlyTrendData();

    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [{
                label: 'Gastos Mensuales',
                data: monthlyData.data,
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white',
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

// Nueva función auxiliar para calcular datos mensuales
function calculateMonthlyTrendData() {
    const now = new Date();
    const months = [];
    const data = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

        const monthExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear();
        });

        const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        months.push(monthName);
        data.push(total);
    }

    return { labels: months, data: data };
}

// Función para mostrar presupuestos
function showBudgets() {
    const budgets = JSON.parse(localStorage.getItem('budgets')) || [
        { category: 'Comida', limit: 500 },
        { category: 'Transporte', limit: 300 },
        { category: 'Entretenimiento', limit: 200 }
    ];

    const spentByCategory = {};
    expenses.forEach(exp => {
        spentByCategory[exp.category] = (spentByCategory[exp.category] || 0) + exp.amount;
    });

    // Crear modal de presupuestos
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.innerHTML = `
        <div class="card-bg p-6 rounded-3xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white p-2 -m-2">
                    <i data-lucide="arrow-left" class="w-6 h-6"></i>
                </button>
                <h3 class="text-xl font-bold">💰 Presupuestos</h3>
                <div></div> <!-- Espaciador para centrar el título -->
            </div>

            <div class="space-y-4">
                ${budgets.map(budget => {
                    const spent = spentByCategory[budget.category] || 0;
                    const percentage = Math.round((spent / budget.limit) * 100);
                    const colorClass = percentage >= 91 ? 'text-danger' : percentage >= 75 ? 'text-warning' : 'text-success';
                    const fillClass = percentage >= 91 ? 'bg-danger' : percentage >= 75 ? 'bg-warning' : 'bg-success';

                    return `
                        <div class="card-bg p-4 rounded-xl">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium">${budget.category}</span>
                                <span class="text-sm opacity-70">${percentage}%</span>
                            </div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm opacity-70">${formatCurrency(spent)} gastado</span>
                                <span class="text-sm opacity-70">${formatCurrency(budget.limit)} límite</span>
                            </div>
                            <div class="progress-bar-container w-full">
                                <div class="progress-fill ${fillClass}" style="width: ${Math.min(percentage, 100)}%;"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
}

// Función para mostrar ajustes
function showSettings() {
    // Crear modal de ajustes
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.innerHTML = `
        <div class="card-bg p-6 rounded-3xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white p-2 -m-2">
                    <i data-lucide="arrow-left" class="w-6 h-6"></i>
                </button>
                <h3 class="text-xl font-bold">⚙️ Ajustes</h3>
                <div></div> <!-- Espaciador para centrar el título -->
            </div>

            <div class="space-y-6">
                <!-- Información del Usuario -->
                <div class="card-bg p-4 rounded-xl">
                    <h4 class="font-semibold mb-3">Información del Usuario</h4>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm opacity-70 mb-1">Nombre</label>
                            <p class="font-medium" id="settings-user-name">${localStorage.getItem('userName') || 'Usuario'}</p>
                        </div>
                        <button onclick="changeUserName()" class="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                            Cambiar Nombre
                        </button>
                    </div>
                </div>

                <!-- Configuración Financiera -->
                <div class="card-bg p-4 rounded-xl">
                    <h4 class="font-semibold mb-3">Configuración Financiera</h4>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm opacity-70 mb-1">Monto Inicial</label>
                            <p class="font-medium">${formatCurrency(initialAmount)}</p>
                        </div>
                        <button onclick="toggleSettingsModal(true); this.closest('.fixed').remove()" class="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                            Cambiar Monto Inicial
                        </button>
                    </div>
                </div>

                <!-- Estadísticas -->
                <div class="card-bg p-4 rounded-xl">
                    <h4 class="font-semibold mb-3">Estadísticas</h4>
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p class="text-2xl font-bold text-danger">${expenses.length}</p>
                            <p class="text-sm opacity-70">Gastos</p>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-success">${receivables.length}</p>
                            <p class="text-sm opacity-70">Ingresos</p>
                        </div>
                    </div>
                </div>

                <!-- Acciones -->
                <div class="card-bg p-4 rounded-xl">
                    <h4 class="font-semibold mb-3">Acciones</h4>
                    <div class="space-y-2">
                        <button onclick="toggleIncomeModal(true); this.closest('.fixed').remove()" class="w-full bg-success text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                            + Agregar Ingreso
                        </button>
                        <button onclick="exportData()" class="w-full bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                            Exportar Datos (JSON)
                        </button>
                        <button onclick="exportToCSV()" class="w-full bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                            Exportar Datos (CSV)
                        </button>
                        <button onclick="clearAllData()" class="w-full bg-danger text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">
                            Limpiar Todos los Datos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
}

// Función para exportar datos a JSON
function exportData() {
    const data = {
        userName: localStorage.getItem('userName') || 'Usuario',
        initialAmount: initialAmount,
        expenses: expenses,
        receivables: receivables,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Datos exportados exitosamente.');
}

// Función para exportar datos a CSV
function exportToCSV() {
    // Combinar gastos e ingresos
    const allTransactions = [
        ...expenses.map(e => ({ tipo: 'Gasto', monto: e.amount, categoria: e.category, descripcion: e.name || '', fecha: e.date || '', nota: e.note || '' })),
        ...receivables.map(r => ({ tipo: 'Ingreso', monto: r.amount, categoria: r.category, descripcion: r.name || '', fecha: '', nota: '' }))
    ];

    // Encabezados
    const headers = ['Tipo', 'Monto', 'Categoría', 'Descripción', 'Fecha', 'Nota'];

    // Crear filas
    const rows = allTransactions.map(t => [
        t.tipo,
        t.monto.toString().replace('.', ','), // Formato argentino
        t.categoria,
        t.descripcion,
        t.fecha,
        t.nota
    ]);

    // Combinar en CSV
    const csvContent = [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas-transacciones-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Datos exportados a CSV exitosamente.');
}

// Función para limpiar todos los datos
function clearAllData() {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
        localStorage.clear();
        expenses = [];
        receivables = [];
        initialAmount = 0;
        renderDashboard();
        showToast('Todos los datos han sido eliminados.');
    }
}

window.onload = () => {
    // Cargar nombre de usuario
    const userName = localStorage.getItem('userName') || 'Usuario';
    document.getElementById('user-name').textContent = userName;

    renderDashboard();
    renderCategoryCarousel();
};
