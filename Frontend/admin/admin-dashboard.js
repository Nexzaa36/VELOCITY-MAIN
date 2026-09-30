const API_URL = "http://localhost:5000";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");


/* =========================================
   ELEMENT HELPER
   ========================================= */

const el = (id) => document.getElementById(id);


/* =========================================
   ADMIN ACCESS
   ========================================= */

(function checkAdminAccess() {

    const loading = el("admin-page-loading");

    if (!token || role !== "admin") {

        window.location.replace("./admin-login.html");

        return;
    }

    loading.classList.add("hidden");

})();


/* =========================================
   AUTH HEADERS
   ========================================= */

function headers() {

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

}


/* =========================================
   PROFILE
   ========================================= */

function loadProfile() {

    try {

        const storedUser =
            localStorage.getItem("user");

        if (!storedUser) {
            return;
        }

        const user =
            JSON.parse(storedUser);

        if (user.name) {

            el("profile-name").textContent =
                user.name;

        }

        if (user.email) {

            el("profile-email").textContent =
                user.email;

        }

    } catch (error) {

        console.warn(
            "Unable to load administrator profile."
        );

    }

}

loadProfile();


/* =========================================
   PROFILE MENU
   ========================================= */

const profileButton =
    el("profile-button");

const profileMenu =
    el("profile-menu");


profileButton.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        const isOpen =
            profileMenu.classList.contains("show");

        profileMenu.classList.toggle("show");

        profileButton.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );

    }
);


document.addEventListener(
    "click",
    (event) => {

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

    }
);


/* =========================================
   LOGOUT
   ========================================= */

function logoutAdmin() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    window.location.replace(
        "./admin-login.html"
    );

}


el("logout-btn").addEventListener(
    "click",
    logoutAdmin
);


el("sidebar-logout").addEventListener(
    "click",
    logoutAdmin
);


/* =========================================
   HELPERS
   ========================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatMoney(value) {

    return `₹ ${Number(value || 0).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )}`;

}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function prettyStatus(value) {

    return String(value || "UNKNOWN")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


/* =========================================
   LOAD DASHBOARD
   ========================================= */

async function loadDashboard() {

    const loading =
        el("dashboard-loading");

    const error =
        el("dashboard-error");

    try {

        loading.classList.remove("hidden");
        error.classList.add("hidden");

        const response =
            await fetch(
                `${API_URL}/api/orders/admin/all`,
                {
                    headers: headers()
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load dashboard data."
            );

        }

        const orders =
            Array.isArray(data.orders)
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

        error.textContent =
            errorObject.message;

        error.classList.remove("hidden");

    } finally {

        loading.classList.add("hidden");

    }

}


/* =========================================
   METRICS
   ========================================= */

function updateMetrics(orders) {

    const total =
        orders.length;

    const pending =
        orders.filter(
            order =>
                order.status === "PENDING"
        ).length;

    const delivered =
        orders.filter(
            order =>
                order.trackingStatus === "DELIVERED"
        ).length;

    const revenue =
        orders
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


    el("metric-total").textContent =
        total;

    el("metric-pending").textContent =
        pending;

    el("metric-delivered").textContent =
        delivered;

    el("metric-revenue").textContent =
        formatMoney(revenue);

    el("nav-order-count").textContent =
        total;

}


/* =========================================
   STATUS DISTRIBUTION
   ========================================= */

function updateStatus(orders) {

    const total =
        Math.max(orders.length, 1);


    const pending =
        orders.filter(
            order =>
                order.status === "PENDING"
        ).length;

    const confirmed =
        orders.filter(
            order =>
                order.status === "CONFIRMED"
        ).length;

    const failed =
        orders.filter(
            order =>
                order.status === "FAILED"
        ).length;

    const cancelled =
        orders.filter(
            order =>
                order.status === "CANCELLED"
        ).length;

    const delivered =
        orders.filter(
            order =>
                order.trackingStatus === "DELIVERED"
        ).length;


    el("status-pending").textContent =
        pending;

    el("status-confirmed").textContent =
        confirmed;

    el("status-failed").textContent =
        failed;

    el("status-cancelled").textContent =
        cancelled;

    el("status-delivered").textContent =
        delivered;


    setBar(
        "bar-pending",
        pending,
        total
    );

    setBar(
        "bar-confirmed",
        confirmed,
        total
    );

    setBar(
        "bar-failed",
        failed,
        total
    );

    setBar(
        "bar-cancelled",
        cancelled,
        total
    );

    setBar(
        "bar-delivered",
        delivered,
        total
    );

}


function setBar(
    id,
    value,
    total
) {

    const percentage =
        Math.min(
            (value / total) * 100,
            100
        );

    el(id).style.width =
        `${percentage}%`;

}


/* =========================================
   RECENT ORDERS
   ========================================= */

function renderRecentOrders(orders) {

    const container =
        el("recent-orders-list");

    if (!orders.length) {

        container.innerHTML = `
            <div class="dashboard-message">
                No orders found.
            </div>
        `;

        return;
    }


    const recent =
        [...orders]
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

        }).join("");

}


/* =========================================
   START
   ========================================= */

if (token && role === "admin") {
    loadDashboard();
}