const API_URL = "http://localhost:5000";

const timelineSteps = [
    "PLACED",
    "PAID",
    "RESERVED",
    "CONFIRMED",
    "PREPARING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED"
];

let currentOrderId = null;
let pollingInterval = null;
let lastTrackingStatus = null;

const orderIdElement =
    document.getElementById("order-id");

const paymentBadge =
    document.getElementById("payment-badge");

const orderDateElement =
    document.getElementById("order-date");

const orderTotalMetaElement =
    document.getElementById("order-total-meta");

const subtotalElement =
    document.getElementById("order-subtotal");

const taxElement =
    document.getElementById("order-tax");

const totalElement =
    document.getElementById("order-total");

const timeline =
    document.querySelector(".timeline");

const searchForm =
    document.getElementById("order-search-form");

const orderInput =
    document.getElementById("order-id-input");

const token =
    localStorage.getItem("token");

const formatCurrency = amount => {
    const value = Number(amount) || 0;

    return `₹${value.toFixed(2)}`;
};

const formatDate = date => {
    if (!date) {
        return "--";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "--";
    }

    return parsedDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
};

const formatTime = date => {
    if (!date) {
        return "--";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "--";
    }

    return parsedDate.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
};

const normalizeStatus = status => {
    if (!status) {
        return "PLACED";
    }

    return String(status)
        .trim()
        .toUpperCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");
};

const isValidMongoId = value => {
    return /^[0-9a-fA-F]{24}$/.test(
        String(value || "")
    );
};

const getTrackingIndex = status => {
    return timelineSteps.indexOf(
        normalizeStatus(status)
    );
};

const getHistoryEntry = (
    order,
    status
) => {
    if (
        !Array.isArray(
            order?.trackingHistory
        )
    ) {
        return null;
    }

    return order.trackingHistory.find(
        entry =>
            normalizeStatus(
                entry.status
            ) ===
            normalizeStatus(status)
    );
};

const showMessage = (
    title,
    message
) => {
    const existing =
        document.querySelector(
            ".tracking-message"
        );

    if (existing) {
        existing.remove();
    }

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "tracking-message";

    messageElement.innerHTML = `
        <h2>${title}</h2>
        <p>${message}</p>
    `;

    const dashboard =
        document.querySelector(
            ".tracking-dashboard"
        );

    if (dashboard) {
        dashboard.appendChild(
            messageElement
        );
    }
};

const clearMessage = () => {
    const message =
        document.querySelector(
            ".tracking-message"
        );

    if (message) {
        message.remove();
    }
};

const updateTimelineTimes = order => {
    document
        .querySelectorAll(".timeline-step")
        .forEach(step => {
            const status =
                normalizeStatus(
                    step.dataset.status
                );

            const timeElement =
                step.querySelector("time");

            if (!timeElement) {
                return;
            }

            const historyEntry =
                getHistoryEntry(
                    order,
                    status
                );

            if (
                historyEntry &&
                historyEntry.changedAt
            ) {
                timeElement.textContent =
                    formatTime(
                        historyEntry.changedAt
                    );
            } else {
                timeElement.textContent =
                    "—";
            }
        });
};

const createTruck = () => {
    if (!timeline) {
        return null;
    }

    let truck =
        timeline.querySelector(
            ".tracking-truck"
        );

    if (truck) {
        return truck;
    }

    truck =
        document.createElement("div");

    truck.className =
        "tracking-truck";

    truck.innerHTML = `
        <div class="tracking-truck-icon">
            <svg
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M7 16H39V43H7V16Z"
                    stroke="currentColor"
                    stroke-width="4"
                />

                <path
                    d="M39 25H49L57 33V43H39V25Z"
                    stroke="currentColor"
                    stroke-width="4"
                />

                <circle
                    cx="19"
                    cy="46"
                    r="5"
                    stroke="currentColor"
                    stroke-width="4"
                />

                <circle
                    cx="47"
                    cy="46"
                    r="5"
                    stroke="currentColor"
                    stroke-width="4"
                />

                <path
                    d="M44 29H50L55 34H44V29Z"
                    stroke="currentColor"
                    stroke-width="3"
                />
            </svg>
        </div>
    `;

    timeline.appendChild(truck);

    return truck;
};

const moveTruck = status => {
    const truck =
        createTruck();

    if (!truck) {
        return;
    }

    const steps =
        Array.from(
            document.querySelectorAll(
                ".timeline-step"
            )
        );

    const normalizedStatus =
        normalizeStatus(status);

    const currentIndex =
        steps.findIndex(
            step =>
                normalizeStatus(
                    step.dataset.status
                ) === normalizedStatus
        );

    if (currentIndex === -1) {
        truck.classList.remove(
            "is-visible"
        );

        return;
    }

    const currentStep =
        steps[currentIndex];

    const timelineRect =
        timeline.getBoundingClientRect();

    const marker =
        currentStep.querySelector(
            ".timeline-marker"
        );

    if (!marker) {
        return;
    }

    const markerRect =
        marker.getBoundingClientRect();

    const top =
        markerRect.top -
        timelineRect.top +
        markerRect.height / 2 -
        21;

    truck.style.top =
        `${top}px`;

    truck.classList.add(
        "is-visible"
    );

    if (
        normalizedStatus ===
        "DELIVERED"
    ) {
        truck.classList.remove(
            "is-moving"
        );

        truck.classList.add(
            "is-delivered"
        );
    } else {
        truck.classList.add(
            "is-moving"
        );

        truck.classList.remove(
            "is-delivered"
        );
    }
};

const setTimeline = order => {
    const currentStatus =
        normalizeStatus(
            order.trackingStatus
        );

    const currentIndex =
        getTrackingIndex(
            currentStatus
        );

    document
        .querySelectorAll(
            ".timeline-step"
        )
        .forEach(step => {
            const status =
                normalizeStatus(
                    step.dataset.status
                );

            const stepIndex =
                getTrackingIndex(
                    status
                );

            step.classList.remove(
                "is-complete",
                "is-current",
                "is-pending",
                "complete",
                "current"
            );

            if (
                stepIndex <
                currentIndex
            ) {
                step.classList.add(
                    "is-complete"
                );
            } else if (
                stepIndex ===
                currentIndex
            ) {
                step.classList.add(
                    "is-current"
                );
            } else {
                step.classList.add(
                    "is-pending"
                );
            }
        });

    moveTruck(
        currentStatus
    );

    lastTrackingStatus =
        currentStatus;
};

const updatePaymentBadge = order => {
    if (!paymentBadge) {
        return;
    }

    paymentBadge.classList.remove(
        "success",
        "failed",
        "pending"
    );

    if (
        order.status ===
        "CONFIRMED"
    ) {
        paymentBadge.classList.add(
            "success"
        );

        paymentBadge.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M5 12.5l4 4L19 7"/>
            </svg>
            PAID
        `;
    } else if (
        order.status ===
        "CANCELLED" ||
        order.status ===
        "FAILED"
    ) {
        paymentBadge.classList.add(
            "failed"
        );

        paymentBadge.textContent =
            "✕ FAILED";
    } else {
        paymentBadge.classList.add(
            "pending"
        );

        paymentBadge.textContent =
            "PENDING";
    }
};

const calculateSubtotal = order => {
    if (
        !Array.isArray(
            order?.items
        )
    ) {
        return 0;
    }

    return order.items.reduce(
        (sum, item) => {
            const price =
                Number(
                    item.price
                ) || 0;

            const quantity =
                Number(
                    item.quantity
                ) || 0;

            return (
                sum +
                price *
                quantity
            );
        },
        0
    );
};

const renderCustomer = order => {
    const customerDetails =
        document.getElementById(
            "customer-details"
        );

    if (!customerDetails) {
        return;
    }

    const customerName =
        order.customer?.name ||
        order.userId?.name ||
        "Customer";

    const customerEmail =
        order.customer?.email ||
        order.userId?.email ||
        "";

    const address =
        order.customer?.address ||
        order.shippingAddress ||
        "";

    customerDetails.innerHTML = `
        <strong>${customerName}</strong>
        <span>
            ${
                address ||
                customerEmail ||
                "Shipping details available for this order."
            }
        </span>
    `;
};

const renderItems = order => {
    const itemsContainer =
        document.getElementById(
            "order-items"
        );

    if (!itemsContainer) {
        return;
    }

    itemsContainer.innerHTML = "";

    if (
        !Array.isArray(
            order.items
        ) ||
        order.items.length === 0
    ) {
        return;
    }

    order.items.forEach(item => {
        const product =
            item.productId &&
            typeof item.productId ===
                "object"
                ? item.productId
                : null;

        const name =
            product?.name ||
            item.name ||
            "Product";

        const image =
            product?.image ||
            product?.imageUrl ||
            item.image ||
            "";

        const quantity =
            Number(
                item.quantity
            ) || 1;

        const price =
            Number(
                item.price
            ) || 0;

        const itemElement =
            document.createElement(
                "div"
            );

        itemElement.className =
            "order-item";

        itemElement.innerHTML = `
            ${
                image
                    ? `
                        <img
                            src="${image}"
                            alt="${name}"
                        >
                    `
                    : `
                        <div
                            style="
                                width:72px;
                                height:78px;
                                background:#f4f4f0;
                            "
                        ></div>
                    `
            }

            <div class="order-item-info">
                <h4>${name}</h4>
                <p>Qty: ${quantity}</p>
            </div>

            <div class="order-item-price">
                ${formatCurrency(
                    price *
                    quantity
                )}
            </div>
        `;

        itemsContainer.appendChild(
            itemElement
        );
    });
};

const renderOrder = order => {
    clearMessage();

    if (orderIdElement) {
        orderIdElement.textContent =
            order._id ||
            "--";
    }

    if (orderDateElement) {
        orderDateElement.textContent =
            formatDate(
                order.createdAt
            );
    }

    if (orderTotalMetaElement) {
        orderTotalMetaElement.textContent =
            formatCurrency(
                order.totalAmount
            );
    }

    const subtotal =
        calculateSubtotal(
            order
        );

    const total =
        Number(
            order.totalAmount
        ) || 0;

    const tax =
        Math.max(
            0,
            total - subtotal
        );

    if (subtotalElement) {
        subtotalElement.textContent =
            formatCurrency(
                subtotal
            );
    }

    if (taxElement) {
        taxElement.textContent =
            formatCurrency(
                tax
            );
    }

    if (totalElement) {
        totalElement.textContent =
            formatCurrency(
                total
            );
    }

    updatePaymentBadge(
        order
    );

    renderCustomer(
        order
    );

    renderItems(
        order
    );

    setTimeline(
        order
    );

    updateTimelineTimes(
        order
    );
};

const fetchOrder = async orderId => {
    if (!token) {
        throw new Error(
            "Please login to track your order."
        );
    }

    if (
        !isValidMongoId(
            orderId
        )
    ) {
        throw new Error(
            "Invalid order ID. Please use the order ID generated by VELOCITY."
        );
    }

    const response =
        await fetch(
            `${API_URL}/api/orders/order/${encodeURIComponent(
                orderId
            )}`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                    "Content-Type":
                        "application/json"
                }
            }
        );

    let data = null;

    try {
        data =
            await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            "Failed to fetch order"
        );
    }

    return data.order;
};

const loadOrder = async (
    orderId,
    startPolling = true
) => {
    try {
        const order =
            await fetchOrder(
                orderId
            );

        currentOrderId =
            order._id;

        renderOrder(
            order
        );

        if (
            orderInput &&
            order._id
        ) {
            orderInput.value =
                order._id;
        }

        localStorage.setItem(
            "velocity-current-order",
            JSON.stringify({
                _id: order._id
            })
        );

        if (
            startPolling &&
            !pollingInterval
        ) {
            startTrackingPolling();
        }
    } catch (error) {
        console.error(
            "Tracking error:",
            error.message
        );

        stopTrackingPolling();

        showMessage(
            "Unable to Load Order",
            error.message
        );
    }
};

const startTrackingPolling = () => {
    stopTrackingPolling();

    if (!currentOrderId) {
        return;
    }

    pollingInterval =
        setInterval(
            async () => {
                if (
                    !currentOrderId ||
                    !isValidMongoId(
                        currentOrderId
                    )
                ) {
                    stopTrackingPolling();
                    return;
                }

                try {
                    const order =
                        await fetchOrder(
                            currentOrderId
                        );

                    renderOrder(
                        order
                    );
                } catch (error) {
                    console.error(
                        "Tracking update error:",
                        error.message
                    );

                    stopTrackingPolling();

                    showMessage(
                        "Unable to Load Order",
                        error.message
                    );
                }
            },
            2000
        );
};

const stopTrackingPolling = () => {
    if (pollingInterval) {
        clearInterval(
            pollingInterval
        );

        pollingInterval =
            null;
    }
};

const getStoredOrderId = () => {
    try {
        const stored =
            localStorage.getItem(
                "velocity-current-order"
            );

        if (!stored) {
            return null;
        }

        const parsed =
            JSON.parse(
                stored
            );

        if (
            parsed &&
            isValidMongoId(
                parsed._id
            )
        ) {
            return parsed._id;
        }

        if (
            parsed &&
            isValidMongoId(
                parsed.orderId
            )
        ) {
            return parsed.orderId;
        }

        return null;
    } catch {
        return null;
    }
};

const getUrlOrderId = () => {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const orderId =
        params.get(
            "orderId"
        );

    if (
        orderId &&
        isValidMongoId(
            orderId
        )
    ) {
        return orderId;
    }

    return null;
};

if (searchForm) {
    searchForm.addEventListener(
        "submit",
        event => {
            event.preventDefault();

            const enteredId =
                orderInput?.value.trim();

            if (
                !isValidMongoId(
                    enteredId
                )
            ) {
                showMessage(
                    "Invalid Order ID",
                    "Please enter the MongoDB order ID generated by VELOCITY."
                );

                stopTrackingPolling();

                return;
            }

            const newUrl =
                `${window.location.pathname}?orderId=${encodeURIComponent(
                    enteredId
                )}`;

            window.history.replaceState(
                {},
                "",
                newUrl
            );

            loadOrder(
                enteredId
            );
        }
    );
}

window.addEventListener(
    "resize",
    () => {
        if (
            lastTrackingStatus
        ) {
            moveTruck(
                lastTrackingStatus
            );
        }
    }
);

window.addEventListener(
    "beforeunload",
    () => {
        stopTrackingPolling();
    }
);

const initialOrderId =
    getUrlOrderId() ||
    getStoredOrderId();

if (initialOrderId) {
    currentOrderId =
        initialOrderId;

    if (orderInput) {
        orderInput.value =
            initialOrderId;
    }

    loadOrder(
        initialOrderId
    );
} else {
    showMessage(
        "Track Your Order",
        "Enter your VELOCITY order ID to view the latest tracking status."
    );
}