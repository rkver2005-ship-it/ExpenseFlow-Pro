// ======================================================
// SUPABASE CONNECTION
// ======================================================

const SUPABASE_URL =
    "https://tcfogqbmjzfwgeqebndb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_YpM0IqnQYYdQYroahAmnpQ_QzYs7nTm";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
// ======================================================
// EXPENSEFLOW PRO
// LOCAL VERSION - NO SUPABASE
// ======================================================

const EXPENSE_KEY = "expenseflow_expenses";
const USERS_KEY = "expenseflow_users";
const CURRENT_USER_KEY = "expenseflow_current_user";




// ======================================================
// INITIALIZE APP
// ======================================================

function initializeApp() {

    // Supabase Auth is now the source of truth.
    // No local admin account is created here.
}


// ======================================================
// DATA
// ======================================================

function getUsers() {

    try {
        return JSON.parse(
            localStorage.getItem(USERS_KEY)
        ) || [];
    } catch (error) {
        return [];
    }
}


function saveUsers(users) {

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}


function getExpenses() {

    try {
        return JSON.parse(
            localStorage.getItem(EXPENSE_KEY)
        ) || [];
    } catch (error) {
        return [];
    }
}


function saveExpenses(expenses) {

    localStorage.setItem(
        EXPENSE_KEY,
        JSON.stringify(expenses)
    );
}


function getCurrentUser() {

    try {
        return JSON.parse(
            localStorage.getItem(CURRENT_USER_KEY)
        );
    } catch (error) {
        return null;
    }
}


// ======================================================
// SUPABASE LOGIN
// ======================================================

async function login() {

    const usernameInput =
        document.getElementById("username");

    const passwordInput =
        document.getElementById("password");

    if (!usernameInput || !passwordInput) {
        return;
    }

    const email =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    if (!email || !password) {
        alert("Email aur password enter karo.");
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {

        console.error(
            "Supabase Login Error:",
            error
        );

        alert(
            "Login failed.\n\n" +
            error.message
        );

        return;
    }

    if (!data || !data.user) {

        alert(
            "Login failed. User data nahi mila."
        );

        return;
    }

    const supabaseUser =
        data.user;

    // Admin account identification
    const isAdmin =
        supabaseUser.email ===
        "rkver2005@gmail.com";

    const currentUser = {

        id:
            supabaseUser.id,

        username:
            isAdmin
                ? "admin"
                : supabaseUser.email,

        email:
            supabaseUser.email,

        role:
            isAdmin
                ? "admin"
                : "user",

        active:
            true
    };

    // UI/profile ke liye session mirror
    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(currentUser)
    );

    usernameInput.value = "";
    passwordInput.value = "";

    showDashboard();
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

    const {
        error
    } =
        await supabaseClient.auth.signOut();

    if (error) {

        console.error(
            "Supabase Logout Error:",
            error
        );

        alert(
            "Logout nahi hua.\n\n" +
            error.message
        );

        return;
    }

    localStorage.removeItem(
        CURRENT_USER_KEY
    );

    const dashboard =
        document.getElementById(
            "dashboard"
        );

    const loginPage =
        document.getElementById(
            "loginPage"
        );

    if (dashboard) {
        dashboard.classList.add(
            "hidden"
        );
    }

    if (loginPage) {
        loginPage.classList.remove(
            "hidden"
        );
    }

    const adminPanel =
        document.getElementById(
            "adminPanel"
        );

    if (adminPanel) {
        adminPanel.remove();
    }
}


// ======================================================
// SHOW DASHBOARD
// ======================================================

function showDashboard() {

    const loginPage =
        document.getElementById("loginPage");

    const dashboard =
        document.getElementById("dashboard");

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (dashboard) {
        dashboard.classList.remove("hidden");
    }

    updateProfile();

    addAdminButton();

    setDefaultMonth();

    renderDashboard();
}


// ======================================================
// PROFILE
// ======================================================

function updateProfile() {

    const user =
        getCurrentUser();

    if (!user) return;

    const profileName =
        document.querySelector(
            ".profile-info strong"
        );

    const profileRole =
        document.querySelector(
            ".profile-info small"
        );

    const avatar =
        document.querySelector(".avatar");

    if (profileName) {

        profileName.textContent =
            user.username;
    }

    if (profileRole) {

        profileRole.textContent =
            user.role === "admin"
                ? "Administrator"
                : "User";
    }

    if (avatar) {

        avatar.textContent =
            user.username
                .charAt(0)
                .toUpperCase();
    }
}


// ======================================================
// ADMIN BUTTON
// ======================================================

function addAdminButton() {

    const user =
        getCurrentUser();

    if (!user || user.role !== "admin") {
        return;
    }

    if (
        document.getElementById(
            "adminPanelBtn"
        )
    ) {
        return;
    }

    const nav =
        document.querySelector(
            ".sidebar-nav"
        );

    if (!nav) {
        console.warn(
            "Sidebar navigation not found."
        );
        return;
    }

    const adminButton =
        document.createElement("a");

    adminButton.href = "#";

    adminButton.id =
        "adminPanelBtn";

    adminButton.className =
        "nav-item admin-nav-item";

    adminButton.innerHTML = `
        <span>⚙</span>
        <span>Admin Panel</span>
    `;

    adminButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openAdminPanel();
        }
    );

    nav.appendChild(adminButton);
}


// ======================================================
// MONTH
// ======================================================

function setDefaultMonth() {

    const monthFilter =
        document.getElementById(
            "monthFilter"
        );

    if (!monthFilter) return;

    if (!monthFilter.value) {

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        monthFilter.value =
            `${year}-${month}`;
    }
}


function changeMonth() {

    renderDashboard();
}


// ======================================================
// USER EXPENSES
// ======================================================

async function getUserExpenses() {

    const {
        data: {
            user: supabaseUser
        },
        error: userError
    } =
        await supabaseClient.auth.getUser();

    if (
        userError ||
        !supabaseUser
    ) {
        return [];
    }

    const {
        data: expenses,
        error
    } =
        await supabaseClient
            .from("expenses")
            .select("*")
            .eq(
                "user_id",
                supabaseUser.id
            )
            .order(
                "expense_date",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "Supabase Fetch Error:",
            error
        );

        return [];
    }

    return expenses.map(
        expense => ({

            id:
                expense.id,

            userId:
                expense.user_id,

            amount:
                Number(
                    expense.amount
                ),

            category:
                expense.category,

            date:
                expense.expense_date,

            where:
                expense.where,

            createdAt:
                expense.created_at
        })
    );
}


// ======================================================
// OPEN EXPENSE
// ======================================================

function openExpense() {

    const modal =
        document.getElementById(
            "expenseModal"
        );

    if (!modal) return;

    modal.classList.remove("hidden");

    const dateInput =
        document.getElementById(
            "expenseDate"
        );

    if (
        dateInput &&
        !dateInput.value
    ) {

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                today.getDate()
            ).padStart(2, "0");

        dateInput.value =
            `${year}-${month}-${day}`;
    }
}


// ======================================================
// CLOSE EXPENSE
// ======================================================

function closeExpense() {

    const modal =
        document.getElementById(
            "expenseModal"
        );

    if (modal) {

        modal.classList.add(
            "hidden"
        );
    }
}


// ======================================================
// SAVE EXPENSE
// ======================================================

async function saveExpense() {

    const amountInput =
        document.getElementById("amount");

    const categoryInput =
        document.getElementById("category");

    const dateInput =
        document.getElementById("expenseDate");

    const whereInput =
        document.getElementById("where");

    if (
        !amountInput ||
        !categoryInput ||
        !dateInput ||
        !whereInput
    ) {

        alert(
            "Expense form fields nahi mile."
        );

        return;
    }

    const amount =
        parseFloat(
            amountInput.value
        );

    const category =
        categoryInput.value;

    const date =
        dateInput.value;

    const where =
        whereInput.value.trim();

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert(
            "Valid amount enter karo."
        );

        return;
    }

    if (!date) {

        alert(
            "Date select karo."
        );

        return;
    }

    if (!where) {

        alert(
            "Where Spent enter karo."
        );

        return;
    }

    // Supabase se current logged-in user
    const {
        data: {
            user: supabaseUser
        },
        error: userError
    } =
        await supabaseClient.auth.getUser();

    if (
        userError ||
        !supabaseUser
    ) {

        alert(
            "Please login first."
        );

        return;
    }

    // Supabase expenses table me save
    const {
        data,
        error
    } =
        await supabaseClient
            .from("expenses")
            .insert([
                {
                    user_id:
                        supabaseUser.id,

                    amount:
                        amount,

                    category:
                        category,

                    expense_date:
                        date,

                    where:
                        where
                }
            ])
            .select();

    if (error) {

        console.error(
            "Supabase Expense Error:",
            error
        );

        alert(
            "Expense save nahi hua.\n\n" +
            error.message
        );

        return;
    }

    console.log(
        "Expense saved to Supabase:",
        data
    );

    amountInput.value = "";

    whereInput.value = "";

    closeExpense();

    renderDashboard();

    alert(
        "Expense successfully added."
    );
}


// ======================================================
// DELETE EXPENSE
// ======================================================

async function deleteExpense(id) {

    const {
        data: {
            user: supabaseUser
        },
        error: userError
    } =
        await supabaseClient.auth.getUser();

    if (
        userError ||
        !supabaseUser
    ) {
        alert(
            "Please login first."
        );

        return;
    }

    if (
        !confirm(
            "Delete this expense?"
        )
    ) {
        return;
    }

    const {
        error
    } =
        await supabaseClient
            .from("expenses")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "user_id",
                supabaseUser.id
            );

    if (error) {

        console.error(
            "Supabase Delete Error:",
            error
        );

        alert(
            "Expense delete nahi hua.\n\n" +
            error.message
        );

        return;
    }

    await renderDashboard();

}


// ======================================================
// DASHBOARD
// ======================================================

async function renderDashboard() {

    const monthFilter =
        document.getElementById(
            "monthFilter"
        );

    if (!monthFilter) return;

    const selectedMonth =
        monthFilter.value;

    const expenses =
        await getUserExpenses();

    const monthlyExpenses =
        expenses.filter(
            expense =>
                String(
                    expense.date
                ).startsWith(
                    selectedMonth
                )
        );

    updateKPIs(
        monthlyExpenses
    );

    updateTransactions(
        monthlyExpenses
    );

    updateCategoryChart(
        monthlyExpenses
    );

    updateMonthlyChart(
        monthlyExpenses
    );

    updateMonthStatus(
        selectedMonth
    );
}


// ======================================================
// KPI
// ======================================================

function updateKPIs(expenses) {

    const total =
        expenses.reduce(
            (sum, expense) =>
                sum +
                Number(expense.amount || 0),
            0
        );

    const count =
        expenses.length;

    const average =
        count > 0
            ? total / count
            : 0;

    const categoryTotals = {};

    expenses.forEach(
        expense => {

            const category =
                expense.category ||
                "Other";

            categoryTotals[
                category
            ] =
                (
                    categoryTotals[
                        category
                    ] || 0
                ) +
                Number(
                    expense.amount || 0
                );
        }
    );

    let topCategory = "-";

    let highest = 0;

    Object.keys(
        categoryTotals
    ).forEach(
        category => {

            if (
                categoryTotals[
                    category
                ] > highest
            ) {

                highest =
                    categoryTotals[
                        category
                    ];

                topCategory =
                    category;
            }
        }
    );

    const totalSpend =
        document.getElementById(
            "totalSpend"
        );

    const totalTransactions =
        document.getElementById(
            "totalTransactions"
        );

    const topCategoryElement =
        document.getElementById(
            "topCategory"
        );

    const dailyAverage =
        document.getElementById(
            "dailyAverage"
        );

    const chartTotal =
        document.getElementById(
            "chartTotal"
        );

    if (totalSpend) {

        totalSpend.textContent =
            formatCurrency(total);
    }

    if (totalTransactions) {

        totalTransactions.textContent =
            count;
    }

    if (topCategoryElement) {

        topCategoryElement.textContent =
            topCategory;
    }

    if (dailyAverage) {

        dailyAverage.textContent =
            formatCurrency(
                average
            );
    }

    if (chartTotal) {

        chartTotal.textContent =
            formatCurrency(
                total
            );
    }
}


// ======================================================
// TRANSACTIONS
// ======================================================

function updateTransactions(expenses) {

    const table =
        document.getElementById(
            "expenseTable"
        );

    const countElement =
        document.getElementById(
            "transactionCount"
        );

    if (!table) return;

    const sorted =
        [...expenses].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    table.innerHTML = "";

    if (
        sorted.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td colspan="5"
                    class="empty-state">
                    No transactions found.
                </td>
            </tr>
        `;

    } else {

        sorted.forEach(
            expense => {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>
                        ${formatDate(
                            expense.date
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            expense.where
                        )}
                    </td>

                    <td>
                        <span class="category-pill">
                            ${escapeHTML(
                                expense.category
                            )}
                        </span>
                    </td>

                    <td class="amount">
                        ${formatCurrency(
                            expense.amount
                        )}
                    </td>

                    <td>
                        <button
                            class="delete-btn"
                            onclick="deleteExpense('${expense.id}')"
                        >
                            Delete
                        </button>
                    </td>
                `;

                table.appendChild(
                    row
                );
            }
        );
    }

    if (countElement) {

        countElement.textContent =
            `${sorted.length} transaction${
                sorted.length !== 1
                    ? "s"
                    : ""
            }`;
    }
}


// ======================================================
// CATEGORY CHART
// ======================================================

let categoryChartInstance = null;


function updateCategoryChart(
    expenses
) {

    const canvas =
        document.getElementById(
            "categoryChart"
        );

    if (!canvas) return;

    const categoryTotals = {};

    expenses.forEach(
        expense => {

            const category =
                expense.category ||
                "Other";

            categoryTotals[
                category
            ] =
                (
                    categoryTotals[
                        category
                    ] || 0
                ) +
                Number(
                    expense.amount || 0
                );
        }
    );

    const labels =
        Object.keys(
            categoryTotals
        );

    const values =
        Object.values(
            categoryTotals
        );

    if (
        categoryChartInstance
    ) {

        categoryChartInstance.destroy();

        categoryChartInstance =
            null;
    }

    if (
        labels.length > 0 &&
        typeof Chart !== "undefined"
    ) {

        categoryChartInstance =
            new Chart(
                canvas,
                {

                    type:
                        "doughnut",

                    data: {

                        labels:
                            labels,

                        datasets: [
                            {
                                data:
                                    values,

                                borderWidth:
                                    0
                            }
                        ]
                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            "70%",

                        plugins: {

                            legend: {
                                display:
                                    false
                            }
                        }
                    }
                }
            );
    }

    updateCategoryBreakdown(
        categoryTotals
    );
}


// ======================================================
// CATEGORY BREAKDOWN
// ======================================================

function updateCategoryBreakdown(
    categoryTotals
) {

    const container =
        document.getElementById(
            "categoryBreakdown"
        );

    if (!container) return;

    const entries =
        Object.entries(
            categoryTotals
        ).sort(
            (a, b) =>
                b[1] - a[1]
        );

    container.innerHTML = "";

    if (
        entries.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                No category data for this month.
            </div>
        `;

        return;
    }

    const total =
        entries.reduce(
            (sum, item) =>
                sum + Number(item[1]),
            0
        );

    entries.forEach(
        ([category, amount]) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "category-item";

            const percentage =
                total > 0
                    ? (
                        amount /
                        total *
                        100
                    ).toFixed(1)
                    : 0;

            item.innerHTML = `

                <div>

                    <div class="category-name">
                        ${escapeHTML(
                            category
                        )}
                    </div>

                    <div class="category-percent">
                        ${percentage}%
                    </div>

                </div>

                <div class="category-amount">
                    ${formatCurrency(
                        amount
                    )}
                </div>

            `;

            container.appendChild(
                item
            );
        }
    );
}


// ======================================================
// MONTHLY CHART
// ======================================================

let monthlyChartInstance = null;


function updateMonthlyChart(
    expenses
) {

    const canvas =
        document.getElementById(
            "monthlyChart"
        );

    if (!canvas) return;

    const dailyTotals = {};

    expenses.forEach(
        expense => {

            const date =
                expense.date;

            dailyTotals[date] =
                (
                    dailyTotals[date] ||
                    0
                ) +
                Number(
                    expense.amount || 0
                );
        }
    );

    const dates =
        Object.keys(
            dailyTotals
        ).sort();

    const values =
        dates.map(
            date =>
                dailyTotals[date]
        );

    if (
        monthlyChartInstance
    ) {

        monthlyChartInstance.destroy();

        monthlyChartInstance =
            null;
    }

    if (
        dates.length === 0 ||
        typeof Chart === "undefined"
    ) {
        return;
    }

    monthlyChartInstance =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        dates.map(
                            formatDate
                        ),

                    datasets: [

                        {
                            label:
                                "Daily Spending",

                            data:
                                values,

                            tension:
                                0.35,

                            fill:
                                true,

                            borderWidth:
                                2,

                            pointRadius:
                                3
                        }
                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display:
                                false
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true
                        }
                    }
                }
            }
        );
}


// ======================================================
// MONTH STATUS
// ======================================================

function updateMonthStatus(
    month
) {

    const status =
        document.getElementById(
            "monthStatus"
        );

    if (!status) return;

    const current =
        new Date();

    const currentMonth =
        `${current.getFullYear()}-${String(
            current.getMonth() + 1
        ).padStart(2, "0")}`;

    if (
        month === currentMonth
    ) {

        status.textContent =
            "Current Month";

    } else {

        const date =
            new Date(
                month + "-01"
            );

        status.textContent =
            date.toLocaleDateString(
                "en-IN",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            );
    }
}


// ======================================================
// ADMIN PANEL
// ======================================================

function openAdminPanel() {

    const user =
        getCurrentUser();

    if (
        !user ||
        user.role !== "admin"
    ) {

        alert(
            "Admin access required."
        );

        return;
    }

    let panel =
        document.getElementById(
            "adminPanel"
        );

    if (!panel) {

        panel =
            document.createElement(
                "div"
            );

        panel.id =
            "adminPanel";

        // IMPORTANT:
        // These classes match FINAL CSS

        panel.className =
            "admin-panel-overlay";

        document.body.appendChild(
            panel
        );

        panel.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === panel
                ) {

                    closeAdminPanel();
                }
            }
        );
    }

    renderAdminPanel();

    panel.classList.remove(
        "hidden"
    );
}


// ======================================================
// CLOSE ADMIN PANEL
// ======================================================

function closeAdminPanel() {

    const panel =
        document.getElementById(
            "adminPanel"
        );

    if (panel) {

        panel.classList.add(
            "hidden"
        );
    }
}


// ======================================================
// ADMIN PANEL UI
// ======================================================

function renderAdminPanel() {

    const panel =
        document.getElementById(
            "adminPanel"
        );

    if (!panel) return;

    const users =
        getUsers();

    const expenses =
        getExpenses();

    const normalUsers =
        users.filter(
            user =>
                user.role !== "admin"
        );

    panel.innerHTML = `

        <div class="admin-panel">

            <div class="admin-header">

                <div>

                    <span class="admin-label">
                        ADMINISTRATION
                    </span>

                    <h2>
                        Admin Panel
                    </h2>

                    <p>
                        Manage customers and ExpenseFlow accounts.
                    </p>

                </div>

                <button
                    class="admin-close"
                    onclick="closeAdminPanel()"
                    type="button"
                >
                    ×
                </button>

            </div>


            <div class="admin-stats-grid">

                <div class="admin-stat">

                    <span class="admin-stat-icon">
                        👥
                    </span>

                    <div>

                        <strong>
                            ${normalUsers.length}
                        </strong>

                        <small>
                            Customers
                        </small>

                    </div>

                </div>


                <div class="admin-stat">

                    <span class="admin-stat-icon">
                        💳
                    </span>

                    <div>

                        <strong>
                            ${expenses.length}
                        </strong>

                        <small>
                            Total Expenses
                        </small>

                    </div>

                </div>


                <div class="admin-stat">

                    <span class="admin-stat-icon">
                        ✓
                    </span>

                    <div>

                        <strong>
                            ${
                                normalUsers.filter(
                                    user =>
                                        user.active !== false
                                ).length
                            }
                        </strong>

                        <small>
                            Active Customers
                        </small>

                    </div>

                </div>

            </div>


            <div class="create-user-area">

                <div class="create-user-form">

                    <div class="create-user-title">

                        <div>

                            <span class="admin-label">
                                CUSTOMER ACCOUNT
                            </span>

                            <h3>
                                Create New Customer
                            </h3>

                            <p>
                                Create login credentials for a new customer.
                            </p>

                        </div>

                    </div>


                    <div class="form-grid">

                        <div>

                            <label>
                                Username
                            </label>

                            <input
                                type="text"
                                id="newUsername"
                                placeholder="Enter username"
                                autocomplete="off"
                            >

                        </div>


                        <div>

                            <label>
                                Password
                            </label>

                            <input
                                type="password"
                                id="newPassword"
                                placeholder="Minimum 6 characters"
                                autocomplete="new-password"
                            >

                        </div>

                        <div class="create-user-buttons">

                            <button
                                class="admin-primary"
                                onclick="createUser()"
                                type="button"
                            >
                                + Create Customer
                            </button>

                        </div>

                    </div>

                </div>

            </div>


            <div class="users-card">

                <div class="users-card-header">

                    <div>

                        <h3>
                            Customer Accounts
                        </h3>

                    </div>

                    <span>
                        ${normalUsers.length}
                        ${
                            normalUsers.length === 1
                                ? "Customer"
                                : "Customers"
                        }
                    </span>

                </div>


                ${
                    normalUsers.length === 0

                    ? `

                        <div class="empty-users">

                            <div>
                                👤
                            </div>

                            <h3>
                                No customers yet
                            </h3>

                            <p>
                                Create your first customer account above.
                            </p>

                        </div>

                    `

                    : `

                        ${normalUsers.map(
                            user => `

                            <div class="user-row">

                                <div class="user-avatar">
                                    ${escapeHTML(
                                        user.username
                                            .charAt(0)
                                            .toUpperCase()
                                    )}
                                </div>


                                <div class="user-info">

                                    <strong>
                                        ${escapeHTML(
                                            user.username
                                        )}
                                    </strong>

                                    <span>
                                        Customer account
                                    </span>

                                </div>


                                <div class="user-role">
                                    USER
                                </div>


                                <div
                                    class="user-status ${
                                        user.active
                                            ? "active"
                                            : "inactive"
                                    }"
                                >
                                    ${
                                        user.active
                                            ? "● Active"
                                            : "● Inactive"
                                    }
                                </div>


                                <button
                                    class="user-toggle"
                                    onclick="toggleUser('${user.id}')"
                                    type="button"
                                >
                                    ${
                                        user.active
                                            ? "Deactivate"
                                            : "Activate"
                                    }
                                </button>

                            </div>

                        `
                        ).join("")}

                    `
                }

            </div>

        </div>
    `;
}


// ======================================================
// CREATE USER
// ======================================================

function createUser() {

    const usernameInput =
        document.getElementById(
            "newUsername"
        );

    const passwordInput =
        document.getElementById(
            "newPassword"
        );

    if (
        !usernameInput ||
        !passwordInput
    ) {

        alert(
            "Customer form nahi mila."
        );

        return;
    }

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    if (
        !username ||
        !password
    ) {

        alert(
            "Username aur password enter karo."
        );

        return;
    }

    if (
        username.length < 3
    ) {

        alert(
            "Username minimum 3 characters ka hona chahiye."
        );

        return;
    }

    if (
        password.length < 6
    ) {

        alert(
            "Password minimum 6 characters ka hona chahiye."
        );

        return;
    }

    const users =
        getUsers();

    const exists =
        users.some(
            user =>
                String(
                    user.username
                ).toLowerCase() ===
                username.toLowerCase()
        );

    if (exists) {

        alert(
            "Username already exists."
        );

        return;
    }

    const newUser = {

        id:
            "user-" +
            Date.now(),

        username:
            username,

        password:
            password,

        role:
            "user",

        active:
            true
    };

    users.push(
        newUser
    );

    saveUsers(
        users
    );

    usernameInput.value =
        "";

    passwordInput.value =
        "";

    renderAdminPanel();

    alert(
        `Customer "${username}" successfully created.`
    );
}


// ======================================================
// ACTIVATE / DEACTIVATE USER
// ======================================================

function toggleUser(
    userId
) {

    const currentUser =
        getCurrentUser();

    if (
        !currentUser ||
        currentUser.role !== "admin"
    ) {

        alert(
            "Admin access required."
        );

        return;
    }

    const users =
        getUsers();

    const user =
        users.find(
            u =>
                u.id === userId
        );

    if (!user) return;

    user.active =
        !user.active;

    saveUsers(
        users
    );

    renderAdminPanel();
}


// ======================================================
// EXPORT PDF
// ======================================================

function exportPDF() {

    window.print();
}


// ======================================================
// FORMAT CURRENCY
// ======================================================

function formatCurrency(
    value
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style:
                "currency",

            currency:
                "INR",

            maximumFractionDigits:
                2
        }
    ).format(
        Number(value) || 0
    );
}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
    dateString
) {

    if (!dateString) {
        return "-";
    }

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );

    return date.toLocaleDateString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        initializeApp();

        const {
            data: {
                session
            },
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Supabase Session Error:",
                error
            );
        }

        if (
            session &&
            session.user
        ) {

            const supabaseUser =
                session.user;

            const isAdmin =
                supabaseUser.email ===
                "rkver2005@gmail.com";

            const currentUser = {

                id:
                    supabaseUser.id,

                username:
                    isAdmin
                        ? "admin"
                        : supabaseUser.email,

                email:
                    supabaseUser.email,

                role:
                    isAdmin
                        ? "admin"
                        : "user",

                active:
                    true
            };

            localStorage.setItem(
                CURRENT_USER_KEY,
                JSON.stringify(
                    currentUser
                )
            );

            showDashboard();

        } else {

            localStorage.removeItem(
                CURRENT_USER_KEY
            );

            const loginPage =
                document.getElementById(
                    "loginPage"
                );

            const dashboard =
                document.getElementById(
                    "dashboard"
                );

            if (loginPage) {

                loginPage.classList.remove(
                    "hidden"
                );
            }

            if (dashboard) {

                dashboard.classList.add(
                    "hidden"
                );
            }
        }
    }
);