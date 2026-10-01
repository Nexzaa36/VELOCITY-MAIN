const API_URL = "http://localhost:5000";

const adminToken = localStorage.getItem("adminToken");
const adminRole = localStorage.getItem("adminRole");

const el = (id) => document.getElementById(id);

(function checkAdminAccess() {
    const loading = el("admin-page-loading");

    if (!adminToken || adminRole !== "admin") {
        window.location.replace("./admin-login.html");
        return;
    }

    if (loading) {
        loading.classList.add("hidden");
    }
})();

function headers() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
    };
}

function loadProfile() {
    try {
        const storedUser = localStorage.getItem("adminUser");

        if (!storedUser) {
            return;
        }

        const user = JSON.parse(storedUser);

        if (user.name && el("profile-name")) {
            el("profile-name").textContent = user.name;
        }

        if (user.email && el("profile-email")) {
            el("profile-email").textContent = user.email;
        }
    } catch (error) {
        console.warn("Unable to load administrator profile.", error);
    }
}

loadProfile();

const profileButton = el("profile-button");
const profileMenu = el("profile-menu");

if (profileButton && profileMenu) {
    profileButton.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpen = profileMenu.classList.contains("show");

        profileMenu.classList.toggle("show");

        profileButton.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );
    });

    document.addEventListener("click", (event) => {
        if (
            !profileMenu.contains(event.target) &&
            !profileButton.contains(event.target)
        ) {
            profileMenu.classList.remove("show");

            profileButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });
}

function logoutAdmin() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminRole");

    window.location.replace("./admin-login.html");
}

const logoutButton = el("logout-btn");

if (logoutButton) {
    logoutButton.addEventListener("click", logoutAdmin);
}

const sidebarLogout = el("sidebar-logout");

if (sidebarLogout) {
    sidebarLogout.addEventListener("click", logoutAdmin);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMoney(value) {
    return `₹ ${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}

function formatDate(date) {
    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function prettyStatus(value) {
    return String(value || "UNKNOWN")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
}

async function loadDashboard() {
    const loading = el("dashboard-loading");
    const error = el("dashboard-error");

    try {
        if (loading) {
            loading.classList.remove("hidden");
        }

        if (error) {
            error.classList.add("hidden");
        }

        const response = await fetch(
            `${API_URL}/api/orders/admin/all`,
            {
                headers: headers()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (
                response.status === 401 ||
                response.status === 403
            ) {
                logoutAdmin();
                return;
            }

            throw new Error(
                data.message ||
                "Unable to load dashboard data."
            );
        }

        const orders = Array.isArray(data.orders)
            ? data.orders
            : [];

        updateMetrics(orders);
        updateStatus(orders);
        renderRecentOrders(orders);
    } catch (errorObject) {
        console.error(
            "Dashboard error:",
            errorObject
        );

        if (error) {
            error.textContent =
                errorObject.message ||
                "Unable to load dashboard.";

            error.classList.remove("hidden");
        }
    } finally {
        if (loading) {
            loading.classList.add("hidden");
        }
    }
}

function updateMetrics(orders) {
    const total = orders.length;

    const pending = orders.filter(
        order =>
            order.status === "PENDING"
    ).length;

    const delivered = orders.filter(
        order =>
            order.trackingStatus === "DELIVERED"
    ).length;

    const revenue = orders
        .filter(
            order =>
                order.status !== "FAILED" &&
                order.status !== "CANCELLED"
        )
        .reduce(
            (sum, order) =>
                sum +
                Number(order.totalAmount || 0),
            0
        );

    if (el("metric-total")) {
        el("metric-total").textContent = total;
    }

    if (el("metric-pending")) {
        el("metric-pending").textContent = pending;
    }

    if (el("metric-delivered")) {
        el("metric-delivered").textContent = delivered;
    }

    if (el("metric-revenue")) {
        el("metric-revenue").textContent =
            formatMoney(revenue);
    }

    if (el("nav-order-count")) {
        el("nav-order-count").textContent = total;
    }
}

function updateStatus(orders) {
    const total = Math.max(
        orders.length,
        1
    );

    const pending = orders.filter(
        order =>
            order.status === "PENDING"
    ).length;

    const confirmed = orders.filter(
        order =>
            order.status === "CONFIRMED"
    ).length;

    const failed = orders.filter(
        order =>
            order.status === "FAILED"
    ).length;

    const cancelled = orders.filter(
        order =>
            order.status === "CANCELLED"
    ).length;

    const delivered = orders.filter(
        order =>
            order.trackingStatus === "DELIVERED"
    ).length;

    if (el("status-pending")) {
        el("status-pending").textContent = pending;
    }

    if (el("status-confirmed")) {
        el("status-confirmed").textContent = confirmed;
    }

    if (el("status-failed")) {
        el("status-failed").textContent = failed;
    }

    if (el("status-cancelled")) {
        el("status-cancelled").textContent = cancelled;
    }

    if (el("status-delivered")) {
        el("status-delivered").textContent = delivered;
    }

    setBar("bar-pending", pending, total);
    setBar("bar-confirmed", confirmed, total);
    setBar("bar-failed", failed, total);
    setBar("bar-cancelled", cancelled, total);
    setBar("bar-delivered", delivered, total);
}

function setBar(id, value, total) {
    const element = el(id);

    if (!element) {
        return;
    }

    const percentage = Math.min(
        (value / total) * 100,
        100
    );

    element.style.width =
        `${percentage}%`;
}

function renderRecentOrders(orders) {
    const container =
        el("recent-orders-list");

    if (!container) {
        return;
    }

    if (!orders.length) {
        container.innerHTML = `
            <div class="dashboard-message">
                No orders found.
            </div>
        `;

        return;
    }

    const recent = [...orders]
        .sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        )
        .slice(0, 6);

    container.innerHTML =
        recent.map(order => {
            const customer =
                order.userId || {};

            return `
                <div class="recent-order">

                    <div>

                        <div class="recent-id">
                            ${escapeHtml(order._id)}
                        </div>

                        <div class="recent-date">
                            ${formatDate(order.createdAt)}
                        </div>

                    </div>

                    <div class="recent-customer">

                        <strong>
                            ${escapeHtml(
                                customer.name ||
                                "Customer"
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                customer.email ||
                                "No email"
                            )}
                        </small>

                    </div>

                    <div class="recent-amount">
                        ${formatMoney(
                            order.totalAmount
                        )}
                    </div>

                    <div class="recent-status">
                        ${escapeHtml(
                            prettyStatus(
                                order.status
                            )
                        )}
                    </div>

                </div>
            `;
        })
        .join("");
}

if (adminToken && adminRole === "admin") {
    loadDashboard();
}