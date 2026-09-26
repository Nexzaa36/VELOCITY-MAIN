// =====================================
// VELOCITY ORDER TRACKING
// =====================================

const order =
    JSON.parse(
        localStorage.getItem(
            "velocity-current-order"
        )
    );


// =====================================
// NO ORDER FOUND
// =====================================

if (!order) {

    document.body.innerHTML = `

        <div
            style="
                text-align:center;
                padding:100px 20px;
            "
        >

            <h1>
                No Active Order Found
            </h1>

            <p>
                Place an order first.
            </p>

            <a
                href="catalogue.html"
                class="btn btn-primary"
            >
                Browse Products
            </a>

        </div>

    `;

}


// =====================================
// ELEMENTS
// =====================================

const orderId =
    document.getElementById(
        "order-id"
    );

const orderStatus =
    document.getElementById(
        "order-status"
    );

const deliveryDate =
    document.getElementById(
        "delivery-date"
    );

const customerDetails =
    document.getElementById(
        "customer-details"
    );

const orderItems =
    document.getElementById(
        "order-items"
    );

const orderTotal =
    document.getElementById(
        "order-total"
    );


// =====================================
// LOAD DATA
// =====================================

if (order) {

    orderId.textContent =
        order.orderId;

    orderStatus.textContent =
        order.status;

    deliveryDate.textContent =
        order.estimatedDelivery;


    // CUSTOMER

    customerDetails.innerHTML = `

        <p>
            <strong>Name:</strong>
            ${order.customer.name}
        </p>

        <p>
            <strong>Email:</strong>
            ${order.customer.email}
        </p>

        <p>
            <strong>Address:</strong>
            ${order.customer.address}
        </p>

        <p>
            <strong>City:</strong>
            ${order.customer.city}
        </p>

        <p>
            <strong>Postal Code:</strong>
            ${order.customer.postal}
        </p>

    `;


    // ITEMS

    let total = 0;

    order.items.forEach(item => {

        total +=
            item.price *
            item.quantity;

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "order-item";

        row.innerHTML = `

            <span>
                ${item.name}
                ×
                ${item.quantity}
            </span>

            <strong>
                ₹${(
                    item.price *
                    item.quantity
                ).toLocaleString("en-IN")}
            </strong>

        `;

        orderItems.appendChild(
            row
        );

    });


    orderTotal.textContent =
        `₹${total.toLocaleString("en-IN")}`;

}