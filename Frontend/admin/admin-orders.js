const API_URL = "https://velocity-y30h.onrender.com";

const adminToken =
    localStorage.getItem("adminToken");

const adminRole =
    localStorage.getItem("adminRole");

const state = {
    orders: [],
    filtered: []
};

const el = (id) =>
    document.getElementById(id);

(function checkAdminAccess() {
    if (
        !adminToken ||
        adminRole !== "admin"
    ) {
        window.location.replace(
            "./admin-login.html"
        );

        return;
    }

    document.body.classList.add(
        "orders-page"
    );
})();

function setupAdminPageUI() {
    const sidebarItems =
        document.querySelectorAll(
            ".sidebar .side-item"
        );

    sidebarItems.forEach(item => {
        item.classList.remove("active");
    });

    sidebarItems.forEach(item => {
        const text =
            item.textContent
                .trim()
                .toLowerCase();

        if (text === "orders") {
            item.classList.add("active");

            item.setAttribute(
                "href",
                "./admin-orders.html"
            );
        }

        if (text === "dashboard") {
            item.classList.remove("active");

            item.setAttribute(
                "href",
                "./admin-dashboard.html"
            );
        }
    });

    const eyebrow =
        document.querySelector(
            ".intro .eyebrow"
        );

    const heading =
        document.querySelector(
            ".intro h1"
        );

    const introText =
        document.querySelector(
            ".intro p"
        );

    if (eyebrow) {
        eyebrow.textContent =
            "ORDER MANAGEMENT";
    }

    if (heading) {
        heading.innerHTML = `
            Manage your<br>
            <span>Orders.</span>
        `;
    }

    if (introText) {
        introText.textContent =
            "View customer orders, track delivery progress, and manage order status.";
    }
}

setupAdminPageUI();

function headers() {
    return {
        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${adminToken}`
    };
}

function loadProfile() {
    try {
        const storedUser =
            localStorage.getItem(
                "adminUser"
            );

        if (!storedUser) {
            return;
        }

        const user =
            JSON.parse(
                storedUser
            );

        const nameElement =
            el("profile-name");

        const emailElement =
            el("profile-email");

        if (
            nameElement &&
            user.name
        ) {
            nameElement.textContent =
                user.name;
        }

        if (
            emailElement &&
            user.email
        ) {
            emailElement.textContent =
                user.email;
        }
    } catch (error) {
        console.warn(
            "Unable to load admin profile.",
            error
        );
    }
}

loadProfile();

function setupProfileMenu() {
    const profileButton =
        el("profile-button");

    const profileMenu =
        el("profile-menu");

    if (
        !profileButton ||
        !profileMenu
    ) {
        return;
    }

    profileMenu.classList.remove(
        "show"
    );

    profileButton.setAttribute(
        "aria-expanded",
        "false"
    );

    profileButton.addEventListener(
        "click",
        function(event) {
            event.preventDefault();
            event.stopPropagation();

            const isOpen =
                profileMenu.classList.contains(
                    "show"
                );

            if (isOpen) {
                profileMenu.classList.remove(
                    "show"
                );

                profileButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            } else {
                profileMenu.classList.add(
                    "show"
                );

                profileButton.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }
        }
    );

    profileMenu.addEventListener(
        "click",
        function(event) {
            event.stopPropagation();
        }
    );

    document.addEventListener(
        "click",
        function() {
            profileMenu.classList.remove(
                "show"
            );

            profileButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    );

    const logoutButton =
        el("logout-btn");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            function(event) {
                event.preventDefault();
                event.stopPropagation();

                logoutAdmin();
            }
        );
    }
}

setupProfileMenu();

function logoutAdmin() {
    localStorage.removeItem(
        "adminToken"
    );

    localStorage.removeItem(
        "adminUser"
    );

    localStorage.removeItem(
        "adminRole"
    );

    window.location.replace(
        "./admin-login.html"
    );
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

function formatMoney(value) {
    return `₹ ${Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )}`;
}

function formatDate(date) {
    if (!date) {
        return {
            day: "—",
            time: ""
        };
    }

    const d =
        new Date(date);

    return {
        day:
            d.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ),

        time:
            d.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
    };
}

function prettyStatus(value) {
    return String(
        value || "UNKNOWN"
    )
        .replaceAll(
            "_",
            " "
        )
        .toLowerCase()
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}

function statusClass(value) {
    return String(
        value || ""
    )
        .toLowerCase()
        .replaceAll(
            "_",
            "-"
        );
}

function paymentLabel(order) {
    if (
        order.status === "FAILED" ||
        order.status === "CANCELLED"
    ) {
        return "Failed";
    }

    if (
        order.status === "PENDING"
    ) {
        return "Pending";
    }

    return "Paid";
}

function renderMetrics() {
    const orders =
        state.orders;

    const total =
        orders.length;

    const pending =
        orders.filter(
            order =>
                order.status ===
                "PENDING"
        ).length;

    const delivered =
        orders.filter(
            order =>
                order.trackingStatus ===
                "DELIVERED"
        ).length;

    const revenue =
        orders
            .filter(
                order =>
                    order.status !==
                        "FAILED" &&
                    order.status !==
                        "CANCELLED"
            )
            .reduce(
                (
                    sum,
                    order
                ) =>
                    sum +
                    Number(
                        order.totalAmount ||
                        0
                    ),
                0
            );

    if (el("metric-total")) {
        el("metric-total").textContent =
            total;
    }

    if (el("metric-pending")) {
        el("metric-pending").textContent =
            pending;
    }

    if (el("metric-delivered")) {
        el("metric-delivered").textContent =
            delivered;
    }

    if (el("metric-revenue")) {
        el("metric-revenue").textContent =
            formatMoney(revenue);
    }

    [
        "metric-total-trend",
        "metric-pending-trend",
        "metric-revenue-trend",
        "metric-delivered-trend"
    ].forEach(id => {
        const element = el(id);

        if (element) {
            element.textContent =
                "Live";
        }
    });

    const navCount =
        el("nav-order-count");

    if (navCount) {
        navCount.textContent =
            total;
    }
}

function renderTable() {
    const body =
        el("orders-body");

    const empty =
        el("empty");

    if (!body) {
        return;
    }

    body.innerHTML = "";

    if (!state.filtered.length) {
        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        return;
    }

    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }

    state.filtered.forEach(
        order => {
            const customer =
                order.userId || {};

            const date =
                formatDate(
                    order.createdAt
                );

            const payment =
                paymentLabel(order);

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>

                    <div class="order-id">
                        ${escapeHtml(
                            order._id
                        )}
                    </div>

                </td>

                <td>

                    <div class="customer-name">
                        ${escapeHtml(
                            customer.name ||
                            "Customer"
                        )}
                    </div>

                    <div class="customer-email">
                        ${escapeHtml(
                            customer.email ||
                            "No email"
                        )}
                    </div>

                </td>

                <td>

                    <div class="date-main">
                        ${date.day}
                    </div>

                    <div class="date-time">
                        ${date.time}
                    </div>

                </td>

                <td>

                    <span class="amount">
                        ${formatMoney(
                            order.totalAmount
                        )}
                    </span>

                </td>

                <td>

                    <span
                        class="
                            badge
                            payment-${payment.toLowerCase()}
                        "
                    >
                        ${escapeHtml(
                            payment
                        )}
                    </span>

                </td>

                <td>

                    <span
                        class="
                            badge
                            tracking
                            tracking-${statusClass(
                                order.trackingStatus
                            )}
                        "
                    >
                        ${escapeHtml(
                            prettyStatus(
                                order.trackingStatus
                            )
                        )}
                    </span>

                </td>

                <td>

                    <span
                        class="
                            badge
                            status-${statusClass(
                                order.status
                            )}
                        "
                    >
                        ${escapeHtml(
                            prettyStatus(
                                order.status
                            )
                        )}
                    </span>

                </td>

                <td>

                    <button
                        class="view-button"
                        data-id="${escapeHtml(
                            order._id
                        )}"
                        type="button"
                    >
                        View
                    </button>

                </td>
            `;

            body.appendChild(row);
        }
    );
}

function applyFilters() {
    const searchInput =
        el("search-input");

    const statusFilter =
        el("status-filter");

    const query =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const status =
        statusFilter
            ? statusFilter.value
            : "ALL";

    state.filtered =
        state.orders.filter(
            order => {
                const customer =
                    order.userId || {};

                const searchable = [
                    order._id,
                    customer.name,
                    customer.email
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const queryMatch =
                    !query ||
                    searchable.includes(
                        query
                    );

                const statusMatch =
                    status === "ALL" ||
                    order.status === status;

                return (
                    queryMatch &&
                    statusMatch
                );
            }
        );

    renderTable();
}

async function loadOrders() {
    const loading =
        el("loading");

    const error =
        el("error");

    if (loading) {
        loading.classList.remove(
            "hidden"
        );
    }

    if (error) {
        error.classList.add(
            "hidden"
        );
    }

    try {
        const response =
            await fetch(
                `${API_URL}/api/orders/admin/all`,
                {
                    headers:
                        headers()
                }
            );

        const data =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            logoutAdmin();
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to load orders."
            );
        }

        state.orders =
            Array.isArray(
                data.orders
            )
                ? data.orders
                : [];

        state.filtered = [
            ...state.orders
        ];

        renderMetrics();
        applyFilters();
    } catch (error) {
        console.error(
            "Admin orders error:",
            error
        );

        if (el("error")) {
            el("error").textContent =
                error.message;

            el("error")
                .classList
                .remove(
                    "hidden"
                );
        }
    } finally {
        if (loading) {
            loading.classList.add(
                "hidden"
            );
        }
    }
}

function trackingOptions(current) {
    const statuses = [
        "PLACED",
        "PAID",
        "RESERVED",
        "CONFIRMED",
        "PREPARING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED"
    ];

    return statuses
        .map(
            status => `
                <option
                    value="${status}"
                    ${
                        status === current
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeHtml(
                        prettyStatus(
                            status
                        )
                    )}
                </option>
            `
        )
        .join("");
}

async function openOrder(id) {
    const modal =
        el("modal");

    const body =
        el("modal-body");

    if (
        !modal ||
        !body
    ) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    body.innerHTML = `
        <div class="state-message">
            Loading order...
        </div>
    `;

    try {
        const response =
            await fetch(
                `${API_URL}/api/orders/admin/${encodeURIComponent(
                    id
                )}`,
                {
                    headers:
                        headers()
                }
            );

        const data =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            logoutAdmin();
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to load order."
            );
        }

        const order =
            data.order;

        const customer =
            order.userId || {};

        const items =
            order.items || [];

        const products =
            items
                .map(item => {
                    const product =
                        item.productId ||
                        {};

                    const line =
                        Number(
                            item.price || 0
                        ) *
                        Number(
                            item.quantity || 0
                        );

                    return `
                        <div class="product-row">

                            <div>

                                <div class="product-name">
                                    ${escapeHtml(
                                        product.name ||
                                        "Product"
                                    )}
                                </div>

                                <div class="product-meta">
                                    Qty
                                    ${escapeHtml(
                                        item.quantity
                                    )}
                                    ×
                                    ${formatMoney(
                                        item.price
                                    )}
                                </div>

                            </div>

                            <strong>
                                ${formatMoney(
                                    line
                                )}
                            </strong>

                        </div>
                    `;
                })
                .join("");

        body.innerHTML = `
            <div class="modal-kicker">
                ORDER MANAGEMENT
            </div>

            <h2 class="modal-title">
                Order details
            </h2>

            <div class="modal-order-id">
                ${escapeHtml(
                    order._id
                )}
            </div>

            <div class="detail-grid">

                <div class="detail-block">

                    <div class="detail-label">
                        Customer
                    </div>

                    <div class="detail-value">
                        ${escapeHtml(
                            customer.name ||
                            "Unknown"
                        )}
                    </div>

                </div>

                <div class="detail-block">

                    <div class="detail-label">
                        Email
                    </div>

                    <div class="detail-value">
                        ${escapeHtml(
                            customer.email ||
                            "Not available"
                        )}
                    </div>

                </div>

                <div class="detail-block">

                    <div class="detail-label">
                        Order status
                    </div>

                    <div class="detail-value">
                        ${escapeHtml(
                            prettyStatus(
                                order.status
                            )
                        )}
                    </div>

                </div>

                <div class="detail-block">

                    <div class="detail-label">
                        Total amount
                    </div>

                    <div class="detail-value">
                        ${formatMoney(
                            order.totalAmount
                        )}
                    </div>

                </div>

            </div>

            <div class="product-list">

                ${
                    products ||
                    `
                        <div class="state-message">
                            No products in this order.
                        </div>
                    `
                }

            </div>

            <div class="tracking-edit">

                <label for="tracking-select">
                    TRACKING STATUS
                </label>

                <div class="tracking-edit-row">

                    <select
                        id="tracking-select"
                    >
                        ${trackingOptions(
                            order.trackingStatus
                        )}
                    </select>

                    <button
                        id="update-tracking"
                        class="update-button"
                        type="button"
                    >
                        Update
                    </button>

                </div>

            </div>
        `;

        const updateButton =
            el("update-tracking");

        if (updateButton) {
            updateButton.addEventListener(
                "click",
                async () => {
                    const button =
                        el("update-tracking");

                    const select =
                        el("tracking-select");

                    if (
                        !button ||
                        !select
                    ) {
                        return;
                    }

                    const trackingStatus =
                        select.value;

                    button.disabled = true;
                    button.textContent =
                        "Updating...";

                    try {
                        const response =
                            await fetch(
                                `${API_URL}/api/orders/admin/${encodeURIComponent(
                                    id
                                )}/tracking`,
                                {
                                    method:
                                        "PATCH",

                                    headers:
                                        headers(),

                                    body:
                                        JSON.stringify({
                                            trackingStatus
                                        })
                                }
                            );

                        const data =
                            await response.json();

                        if (
                            response.status === 401 ||
                            response.status === 403
                        ) {
                            logoutAdmin();
                            return;
                        }

                        if (!response.ok) {
                            throw new Error(
                                data.message ||
                                "Failed to update tracking."
                            );
                        }

                        closeModal();

                        await loadOrders();
                    } catch (error) {
                        console.error(
                            error
                        );

                        alert(
                            error.message
                        );
                    } finally {
                        button.disabled =
                            false;

                        button.textContent =
                            "Update";
                    }
                }
            );
        }
    } catch (error) {
        console.error(error);

        body.innerHTML = `
            <div class="state-message error-state">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

function closeModal() {
    const modal =
        el("modal");

    if (!modal) {
        return;
    }

    modal.classList.add(
        "hidden"
    );
}

const ordersBody =
    el("orders-body");

if (ordersBody) {
    ordersBody.addEventListener(
        "click",
        event => {
            const button =
                event.target.closest(
                    ".view-button"
                );

            if (button) {
                openOrder(
                    button.dataset.id
                );
            }
        }
    );
}

const searchInput =
    el("search-input");

if (searchInput) {
    searchInput.addEventListener(
        "input",
        applyFilters
    );
}

const statusFilter =
    el("status-filter");

if (statusFilter) {
    statusFilter.addEventListener(
        "change",
        applyFilters
    );
}

const refreshButton =
    el("refresh-btn");

if (refreshButton) {
    refreshButton.addEventListener(
        "click",
        loadOrders
    );
}

const viewAllButton =
    el("view-all-btn");

if (viewAllButton) {
    viewAllButton.addEventListener(
        "click",
        () => {
            if (statusFilter) {
                statusFilter.value =
                    "ALL";
            }

            if (searchInput) {
                searchInput.value = "";
            }

            applyFilters();

            const recentOrders =
                el("recent-orders");

            if (recentOrders) {
                recentOrders.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    );
}

const closeModalButton =
    el("close-modal");

if (closeModalButton) {
    closeModalButton.addEventListener(
        "click",
        closeModal
    );
}

const modalBackdrop =
    document.querySelector(
        ".modal-backdrop"
    );

if (modalBackdrop) {
    modalBackdrop.addEventListener(
        "click",
        closeModal
    );
}

document.addEventListener(
    "keydown",
    event => {
        if (event.key === "Escape") {
            closeModal();
        }
    }
);

if (
    adminToken &&
    adminRole === "admin"
) {
    loadOrders();
}