const API_URL = "https://velocity-y30h.onrender.com";

const adminToken =
    localStorage.getItem("adminToken");

const adminRole =
    localStorage.getItem("adminRole");


const state = {
    sagaPage: 1,
    sagaLimit: 30,

    eventPage: 1,
    eventLimit: 50
};


const el = (id) =>
    document.getElementById(id);


// ADMIN ACCESS

(function checkAdminAccess() {

    const loading =
        el("admin-page-loading");

    if (
        !adminToken ||
        adminRole !== "admin"
    ) {
        window.location.replace(
            "./admin-login.html"
        );

        return;
    }

    if (loading) {
        loading.classList.add(
            "hidden"
        );
    }

})();


// HEADERS

function headers() {

    return {
        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${adminToken}`
    };

}


// PROFILE

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


        if (
            user.name &&
            el("profile-name")
        ) {
            el("profile-name")
                .textContent =
                user.name;
        }


        if (
            user.email &&
            el("profile-email")
        ) {
            el("profile-email")
                .textContent =
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


// PROFILE MENU

function setupProfileMenu() {

    const button =
        el("profile-button");

    const menu =
        el("profile-menu");

    if (
        !button ||
        !menu
    ) {
        return;
    }


    button.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            const open =
                menu.classList.contains(
                    "show"
                );

            menu.classList.toggle(
                "show",
                !open
            );

            button.setAttribute(
                "aria-expanded",
                String(!open)
            );

        }
    );


    menu.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

        }
    );


    document.addEventListener(
        "click",
        function() {

            menu.classList.remove(
                "show"
            );

            button.setAttribute(
                "aria-expanded",
                "false"
            );

        }
    );

}

setupProfileMenu();


// LOGOUT

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


el("logout-btn")
    ?.addEventListener(
        "click",
        logoutAdmin
    );


el("sidebar-logout")
    ?.addEventListener(
        "click",
        logoutAdmin
    );


// HTML SAFETY

function escapeHtml(value) {

    return String(
        value ?? ""
    )
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


// DATE

function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


// STATUS CLASS

function statusClass(value) {

    const status =
        String(
            value || ""
        ).toUpperCase();


    if (
        status.includes("FAIL") ||
        status.includes("COMPENSAT")
    ) {
        return "status-red";
    }


    if (
        status.includes("WAIT") ||
        status.includes("PROGRESS")
    ) {
        return "status-amber";
    }


    if (
        status.includes("CONFIRM") ||
        status.includes("PAID") ||
        status.includes("RESERVED") ||
        status.includes("PUBLISHED") ||
        status.includes("COMPLETED") ||
        status.includes("UP")
    ) {
        return "status-green";
    }


    if (
        status.includes("PLACED") ||
        status.includes("PROCESS")
    ) {
        return "status-blue";
    }


    return "status-neutral";

}


// FETCH

async function apiGet(
    endpoint
) {

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                method: "GET",
                headers: headers()
            }
        );


    if (
        response.status === 401 ||
        response.status === 403
    ) {

        logoutAdmin();

        throw new Error(
            "Admin authentication expired"
        );

    }


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Request failed"
        );

    }


    return data;

}


// HEALTH

async function loadHealth() {

    try {

        const data =
            await apiGet(
                "/api/admin/observability/health"
            );


        const health =
            data.health || {};


        const setHealth =
            (
                id,
                value
            ) => {

                const element =
                    el(id);

                if (!element) {
                    return;
                }

                element.textContent =
                    value || "—";

                element.className =
                    `health-value ${statusClass(value)}`;

            };


        setHealth(
            "health-api",
            health.api?.status
        );

        setHealth(
            "health-mongodb",
            health.mongodb?.status
        );

        setHealth(
            "health-rabbitmq",
            health.rabbitmq?.status
        );

        setHealth(
            "health-payment",
            health.payment?.status
        );

        setHealth(
            "health-notification",
            health.notification?.status
        );


        const overall =
            el("overall-health");


        if (overall) {

            overall.textContent =
                data.status ||
                "UNKNOWN";

            overall.className =
                `health-badge ${statusClass(
                    data.status
                )}`;

        }

    } catch (error) {

        console.error(
            "Health error:",
            error
        );

        el("overall-health")
            .textContent =
            "ERROR";

    }

}


// METRICS

async function loadMetrics() {

    try {

        const data =
            await apiGet(
                "/api/admin/observability/metrics"
            );


        const metrics =
            data.metrics || {};


        const orders =
            metrics.orders || {};

        const events =
            metrics.events || {};

        const inventory =
            metrics.inventory || {};

        const payments =
            metrics.payments || {};


        el("metric-orders")
            .textContent =
            orders.total || 0;


        el("metric-confirmed")
            .textContent =
            orders.successful || 0;


        el("metric-failed-orders")
            .textContent =
            orders.failed || 0;


        el("metric-events")
            .textContent =
            events.total || 0;


        el("metric-published")
            .textContent =
            events.published || 0;


        el("metric-failed-events")
            .textContent =
            events.failed || 0;


        el("metric-reserved")
            .textContent =
            inventory.reserved || 0;


        el("metric-payments")
            .textContent =
            payments.successful || 0;


        renderEventBreakdown(
            events.eventBreakdown ||
            metrics.eventBreakdown ||
            []
        );

    } catch (error) {

        console.error(
            "Metrics error:",
            error
        );

    }

}


// EVENT BREAKDOWN

function renderEventBreakdown(
    breakdown
) {

    const container =
        el("event-breakdown");


    if (
        !Array.isArray(breakdown) ||
        breakdown.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                No events recorded yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        breakdown
            .map(item => {

                return `
                    <div class="breakdown-row">

                        <div class="breakdown-event">
                            ${escapeHtml(
                                item._id
                            )}
                        </div>

                        <div class="breakdown-count">
                            ${Number(
                                item.count || 0
                            )}
                        </div>

                    </div>
                `;

            })
            .join("");

}


// SAGA

async function loadSagas() {

    const body =
        el("saga-table-body");


    body.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="table-loading"
            >
                Loading SAGA data...
            </td>
        </tr>
    `;


    try {

        const data =
            await apiGet(
                `/api/admin/observability/sagas?page=${state.sagaPage}&limit=${state.sagaLimit}`
            );


        renderSagas(
            data.sagas || []
        );


        renderPagination(
            "saga-pagination",
            data.pagination,
            "saga"
        );

    } catch (error) {

        console.error(
            "SAGA error:",
            error
        );


        body.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-loading"
                >
                    Unable to load SAGA data.
                </td>
            </tr>
        `;

    }

}


function renderSagas(
    sagas
) {

    const body =
        el("saga-table-body");


    if (
        !Array.isArray(sagas) ||
        sagas.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-loading"
                >
                    No SAGA records found.
                </td>
            </tr>
        `;

        return;
    }


    body.innerHTML =
        sagas
            .map(
                saga => {

                    const orderId =
                        saga.orderId || "";


                    return `
                        <tr>

                            <td>
                                <span class="order-id">
                                    ${escapeHtml(
                                        orderId
                                    )}
                                </span>
                            </td>


                            <td>

                                <span class="status-badge ${statusClass(
                                    saga.orderStatus
                                )}">
                                    ${escapeHtml(
                                        saga.orderStatus
                                    )}
                                </span>

                            </td>


                            <td>

                                <span class="status-badge ${statusClass(
                                    saga.trackingStatus
                                )}">
                                    ${escapeHtml(
                                        saga.trackingStatus
                                    )}
                                </span>

                            </td>


                            <td>

                                <span class="status-badge ${statusClass(
                                    saga.sagaStatus
                                )}">
                                    ${escapeHtml(
                                        saga.sagaStatus
                                    )}
                                </span>

                            </td>


                            <td>
                                ${Number(
                                    saga.events?.length || 0
                                )}
                            </td>


                            <td>
                                ${formatDate(
                                    saga.createdAt
                                )}
                            </td>


                            <td>

                                <button
                                    class="view-btn"
                                    type="button"
                                    data-order-id="${escapeHtml(
                                        orderId
                                    )}"
                                >
                                    Inspect
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");


    body
        .querySelectorAll(
            ".view-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function() {

                    const orderId =
                        this.dataset.orderId;

                    inspectOrder(
                        orderId
                    );

                }
            );

        });

}


// EVENTS

async function loadEvents() {

    const body =
        el("event-table-body");


    body.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="table-loading"
            >
                Loading event history...
            </td>
        </tr>
    `;


    const status =
        el("event-status-filter")
            .value;


    const params =
        new URLSearchParams({

            page:
                String(
                    state.eventPage
                ),

            limit:
                String(
                    state.eventLimit
                )

        });


    if (status) {
        params.set(
            "status",
            status
        );
    }


    try {

        const data =
            await apiGet(
                `/api/admin/observability/events?${params.toString()}`
            );


        renderEvents(
            data.events || []
        );


        renderPagination(
            "event-pagination",
            data.pagination,
            "event"
        );

    } catch (error) {

        console.error(
            "Event history error:",
            error
        );


        body.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-loading"
                >
                    Unable to load events.
                </td>
            </tr>
        `;

    }

}


function renderEvents(
    events
) {

    const body =
        el("event-table-body");


    if (
        !Array.isArray(events) ||
        events.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-loading"
                >
                    No events found.
                </td>
            </tr>
        `;

        return;
    }


    body.innerHTML =
        events
            .map(event => {

                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    event.eventType
                                )}
                            </strong>
                        </td>


                        <td>
                            ${escapeHtml(
                                event.routingKey
                            )}
                        </td>


                        <td>

                            <span class="order-id">
                                ${escapeHtml(
                                    event.orderId ||
                                    "—"
                                )}
                            </span>

                        </td>


                        <td>

                            <span class="status-badge ${statusClass(
                                event.status
                            )}">
                                ${escapeHtml(
                                    event.status
                                )}
                            </span>

                        </td>


                        <td>
                            ${formatDate(
                                event.timestamp
                            )}
                        </td>

                    </tr>
                `;

            })
            .join("");

}


// PAGINATION

function renderPagination(
    containerId,
    pagination,
    type
) {

    const container =
        el(containerId);


    if (
        !pagination ||
        pagination.totalPages <= 1
    ) {

        container.innerHTML = "";

        return;
    }


    const current =
        Number(
            pagination.page || 1
        );

    const total =
        Number(
            pagination.totalPages || 1
        );


    let html = "";


    html += `
        <button
            class="page-btn"
            type="button"
            data-page="${current - 1}"
            ${current <= 1 ? "disabled" : ""}
        >
            ←
        </button>
    `;


    const start =
        Math.max(
            1,
            current - 2
        );

    const end =
        Math.min(
            total,
            current + 2
        );


    for (
        let page = start;
        page <= end;
        page++
    ) {

        html += `
            <button
                class="page-btn ${page === current ? "active" : ""}"
                type="button"
                data-page="${page}"
            >
                ${page}
            </button>
        `;

    }


    html += `
        <button
            class="page-btn"
            type="button"
            data-page="${current + 1}"
            ${current >= total ? "disabled" : ""}
        >
            →
        </button>
    `;


    container.innerHTML =
        html;


    container
        .querySelectorAll(
            ".page-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function() {

                    if (
                        this.disabled
                    ) {
                        return;
                    }

                    const page =
                        Number(
                            this.dataset.page
                        );


                    if (
                        type === "saga"
                    ) {

                        state.sagaPage =
                            page;

                        loadSagas();

                    } else {

                        state.eventPage =
                            page;

                        loadEvents();

                    }

                }
            );

        });

}


// ORDER SAGA INSPECTION

async function inspectOrder(
    orderId
) {

    if (!orderId) {
        return;
    }


    el("order-id-input")
        .value =
        orderId;


    const container =
        el("saga-detail");


    container.innerHTML = `
        <div class="empty-state">
            Loading SAGA...
        </div>
    `;


    try {

        const data =
            await apiGet(
                `/api/admin/observability/sagas/${encodeURIComponent(
                    orderId
                )}`
            );


        renderSagaDetail(
            data.saga
        );


    } catch (error) {

        console.error(
            "SAGA inspection error:",
            error
        );


        container.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;

    }

}


function renderSagaDetail(
    saga
) {

    const container =
        el("saga-detail");


    if (!saga) {

        container.innerHTML = `
            <div class="empty-state">
                No SAGA information found.
            </div>
        `;

        return;
    }


    const events =
        saga.events || [];


    container.innerHTML = `

        <div class="detail-card">


            <div class="detail-header">

                <div class="detail-field">

                    <span>
                        Order ID
                    </span>

                    <strong class="order-id">
                        ${escapeHtml(
                            saga.orderId
                        )}
                    </strong>

                </div>


                <div class="detail-field">

                    <span>
                        Order Status
                    </span>

                    <strong>
                        ${escapeHtml(
                            saga.orderStatus
                        )}
                    </strong>

                </div>


                <div class="detail-field">

                    <span>
                        SAGA Status
                    </span>

                    <strong>
                        ${escapeHtml(
                            saga.sagaStatus
                        )}
                    </strong>

                </div>


                <div class="detail-field">

                    <span>
                        Tracking
                    </span>

                    <strong>
                        ${escapeHtml(
                            saga.trackingStatus
                        )}
                    </strong>

                </div>

            </div>


            <div class="detail-events">

                ${
                    events.length
                        ? events
                            .map(
                                event => `
                                    <div class="detail-event">

                                        <div class="detail-event-type">
                                            ${escapeHtml(
                                                event.eventType
                                            )}
                                        </div>

                                        <div class="detail-event-routing">
                                            ${escapeHtml(
                                                event.routingKey
                                            )}
                                        </div>

                                        <div class="detail-event-time">
                                            ${formatDate(
                                                event.timestamp
                                            )}
                                        </div>

                                    </div>
                                `
                            )
                            .join("")
                        : `
                            <div class="empty-state">
                                No events recorded for this order.
                            </div>
                        `
                }

            </div>

        </div>

    `;

}


// REFRESH

async function refreshDashboard() {

    el("refresh-btn")
        .textContent =
        "Refreshing...";


    await Promise.all([
        loadHealth(),
        loadMetrics(),
        loadSagas(),
        loadEvents()
    ]);


    el("last-updated")
        .textContent =
        `Updated ${new Date().toLocaleTimeString(
            "en-IN"
        )}`;


    el("refresh-btn")
        .textContent =
        "Refresh";

}


// BUTTONS

el("refresh-btn")
    ?.addEventListener(
        "click",
        refreshDashboard
    );


el("load-events-btn")
    ?.addEventListener(
        "click",
        function() {

            state.eventPage = 1;

            loadEvents();

        }
    );


el("inspect-order-btn")
    ?.addEventListener(
        "click",
        function() {

            const orderId =
                el("order-id-input")
                    .value
                    .trim();

            if (!orderId) {

                el("saga-detail")
                    .innerHTML = `
                        <div class="empty-state">
                            Please enter an order ID.
                        </div>
                    `;

                return;
            }

            inspectOrder(
                orderId
            );

        }
    );


el("order-id-input")
    ?.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                el("inspect-order-btn")
                    .click();

            }

        }
    );


// INITIAL LOAD

refreshDashboard();


// AUTO REFRESH

setInterval(
    function() {

        loadHealth();
        loadMetrics();

        el("last-updated")
            .textContent =
            `Updated ${new Date().toLocaleTimeString(
                "en-IN"
            )}`;

    },
    30000
);