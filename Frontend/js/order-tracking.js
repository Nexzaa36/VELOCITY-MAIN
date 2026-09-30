const order = JSON.parse(
    localStorage.getItem("velocity-current-order")
);

const orderIdElement = document.getElementById("order-id");
const orderStatusElement = document.getElementById("order-status");
const deliveryDateElement = document.getElementById("delivery-date");
const customerDetails = document.getElementById("customer-details");
const orderItems = document.getElementById("order-items");
const orderTotal = document.getElementById("order-total");
const orderTotalMeta = document.getElementById("order-total-meta");
const orderSubtotal = document.getElementById("order-subtotal");
const orderTax = document.getElementById("order-tax");
const orderIdInput = document.getElementById("order-id-input");
const searchForm = document.getElementById("order-search-form");
const timeline = document.getElementById("order-timeline");

const formatCurrency = value =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const formatDate = value => {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const normalizeStatus = status => {
    const value = String(status || "").toUpperCase().replace(/[\s-]+/g, "_");

    if (value.includes("DELIVER")) return "DELIVERED";
    if (value.includes("OUT_FOR")) return "OUT_FOR_DELIVERY";
    if (value.includes("SHIP")) return "SHIPPED";
    if (value.includes("PREPAR")) return "PREPARING";
    if (value.includes("CONFIRM")) return "CONFIRMED";
    if (value.includes("RESERV")) return "RESERVED";
    if (value.includes("PAID") || value.includes("PAYMENT")) return "PAID";
    return "PLACED";
};

const setTimeline = status => {
    const steps = [...timeline.querySelectorAll(".timeline-step")];

    const orderMap = [
        "PLACED",
        "PAID",
        "RESERVED",
        "CONFIRMED",
        "PREPARING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED"
    ];

    const currentIndex = orderMap.indexOf(normalizeStatus(status));

    steps.forEach((step, index) => {
        step.classList.remove("complete", "current", "pending");

        if (index < currentIndex) {
            step.classList.add("complete");
            step.querySelector(".timeline-marker").textContent = "✓";
        } else if (index === currentIndex) {
            step.classList.add("current");
            step.querySelector(".timeline-marker").textContent = "○";
        } else {
            step.classList.add("pending");
            step.querySelector(".timeline-marker").textContent = "○";
        }
    });
};

const showNoOrder = () => {
    document.querySelector(".tracking-content").innerHTML = `
        <div class="empty-order">
            <span class="label">ORDER TRACKING</span>
            <h2>No active order found.</h2>
            <p>Enter an Order ID above or place an order first.</p>
            <a href="catalogue.html">Browse Products →</a>
        </div>
    `;
};

const renderOrder = currentOrder => {
    if (!currentOrder) {
        showNoOrder();
        return;
    }

    orderIdElement.textContent = currentOrder.orderId || "--";

    const status = currentOrder.status || "Processing";
    setTimeline(status);

    const deliveryDate = currentOrder.estimatedDelivery || "--";
    deliveryDateElement.textContent = formatDate(deliveryDate);

    const total = (currentOrder.items || []).reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
    );

    const tax = Number(currentOrder.tax || 0);
    const subtotal = Number(currentOrder.subtotal || (total - tax));

    orderTotal.textContent = formatCurrency(total);
    orderTotalMeta.textContent = formatCurrency(total);
    orderSubtotal.textContent = formatCurrency(subtotal);
    orderTax.textContent = formatCurrency(tax);

    const orderDate = currentOrder.createdAt || currentOrder.orderDate;
    document.getElementById("order-date").textContent = formatDate(orderDate);

    if (currentOrder.customer) {
        const customer = currentOrder.customer;

        customerDetails.innerHTML = `
            <strong>${customer.name || "--"}</strong>
            <span>${customer.address || "--"}</span>
            <span>${customer.city || ""}${customer.postal ? ` - ${customer.postal}` : ""}</span>
            <span>${customer.email || ""}</span>
        `;
    }

    orderItems.innerHTML = "";

    (currentOrder.items || []).forEach(item => {
        const row = document.createElement("div");
        row.className = "summary-product";

        row.innerHTML = `
            <div class="product-thumb">
                ${item.image ? `<img src="${item.image}" alt="">` : `<span>VE</span>`}
            </div>
            <div class="product-info">
                <strong>${item.name || "Product"}</strong>
                <span>Quantity: ${item.quantity || 1}</span>
                <b>${formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</b>
            </div>
        `;

        orderItems.appendChild(row);
    });

    const paymentBadge = document.getElementById("payment-badge");

    if (String(status).toUpperCase().includes("PAID") || String(status).toUpperCase().includes("CONFIRM")) {
        paymentBadge.textContent = "✓ PAID";
        paymentBadge.classList.add("is-paid");
    } else {
        paymentBadge.textContent = "ORDER";
        paymentBadge.classList.remove("is-paid");
    }
};

searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const enteredId = orderIdInput.value.trim();

    if (!enteredId) {
        orderIdInput.focus();
        return;
    }

    if (order && String(order.orderId) === enteredId) {
        renderOrder(order);
        return;
    }

    if (order && !enteredId) {
        renderOrder(order);
        return;
    }

    alert("Order not found. Please check your Order ID.");
});

const params = new URLSearchParams(window.location.search);
const queryOrderId = params.get("orderId");

if (queryOrderId) {
    orderIdInput.value = queryOrderId;
}

if (order) {
    renderOrder(order);

    if (!queryOrderId) {
        orderIdInput.value = order.orderId || "";
    }
} else {
    showNoOrder();
}

const logoutLink = document.getElementById("logout-link");

if (logoutLink) {
    logoutLink.addEventListener("click", event => {
        event.preventDefault();

        localStorage.removeItem("velocity-current-order");
        localStorage.removeItem("token");
        localStorage.removeItem("velocity-cart");

        window.location.href = "index.html";
    });
}
