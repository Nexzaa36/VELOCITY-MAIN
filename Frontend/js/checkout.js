const API_URL = "http://localhost:5000";

let cart = [];
let subtotal = 0;
let tax = 0;
let total = 0;

function getUser() {
    const userData = localStorage.getItem("user");

    if (!userData) return null;

    try {
        return JSON.parse(userData);
    } catch (error) {
        console.error("Invalid user data:", error);
        return null;
    }
}

function getToken() {
    return localStorage.getItem("token");
}

async function loadCart() {
    const user = getUser();
    const token = getToken();

    if (!user || !token) {
        alert("Please login before checkout.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/cart/${user.id}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load cart");
        }

        const data = await response.json();
        cart = data.cart?.items || [];

        if (cart.length === 0) {
            alert("Your cart is empty.");
            window.location.href = "cart.html";
            return;
        }

        calculateTotals();
        renderCheckoutItems();
        updateSummary();
    } catch (error) {
        console.error("Cart loading error:", error);
        alert("Unable to load your cart. Please try again.");
    }
}

function calculateTotals() {
    subtotal = 0;

    cart.forEach((item) => {
        const price = Number(
            item.productId?.price || item.price || 0
        );

        const quantity = Number(item.quantity || 0);

        subtotal += price * quantity;
    });

    tax = subtotal * 0.05;
    total = subtotal + tax;
}

function renderCheckoutItems() {
    const container =
        document.getElementById("checkout-items");

    if (!container) return;

    container.innerHTML = "";

    cart.forEach((item) => {
        const product = item.productId;

        const name = product?.name || "Product";

        const price = Number(
            product?.price || item.price || 0
        );

        const quantity = Number(item.quantity || 0);

        const image =
            product?.image ||
            product?.imageUrl ||
            "assets/images/product-placeholder.png";

        const itemTotal = price * quantity;

        const itemElement =
            document.createElement("div");

        itemElement.className = "checkout-item";

        itemElement.innerHTML = `
            <div class="checkout-item-image">
                <img
                    src="${image}"
                    alt="${name}"
                    onerror="this.style.display='none'"
                >
            </div>

            <div class="checkout-item-info">
                <h3>${name}</h3>
                <p>Qty: ${quantity}</p>
            </div>

            <strong>
                ₹${itemTotal.toFixed(2)}
            </strong>
        `;

        container.appendChild(itemElement);
    });
}

function updateSummary() {
    const subtotalElement =
        document.getElementById("checkout-subtotal");

    const taxElement =
        document.getElementById("checkout-tax");

    const totalElement =
        document.getElementById("checkout-total");

    if (subtotalElement) {
        subtotalElement.textContent =
            `₹${subtotal.toFixed(2)}`;
    }

    if (taxElement) {
        taxElement.textContent =
            `₹${tax.toFixed(2)}`;
    }

    if (totalElement) {
        totalElement.textContent =
            `₹${total.toFixed(2)}`;
    }
}

function getCustomerDetails() {
    return {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value,
        postal: document.getElementById("postal").value.trim()
    };
}

async function createVelocityOrder(customer) {
    const user = getUser();
    const token = getToken();

    if (!user || !token) {
        throw new Error("User is not authenticated.");
    }

    const response = await fetch(
        `${API_URL}/api/orders/${user.id}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ customer })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Failed to create VELOCITY order."
        );
    }

    return data;
}

async function createRazorpayOrder(orderId) {
    const token = getToken();

    const response = await fetch(
        `${API_URL}/api/payments/create-order`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ orderId })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Failed to create Razorpay order."
        );
    }

    return data;
}

async function verifyRazorpayPayment(paymentData) {
    const token = getToken();

    const response = await fetch(
        `${API_URL}/api/payments/verify`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Payment verification failed."
        );
    }

    return data;
}

async function reportPaymentFailure(failureData) {
    const token = getToken();

    if (!token) {
        throw new Error("User is not authenticated.");
    }

    const response = await fetch(
        `${API_URL}/api/payments/failure`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(failureData)
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Failed to report payment failure."
        );
    }

    return data;
}

function openRazorpayCheckout(
    razorpayData,
    velocityOrderId,
    customer
) {
    if (typeof Razorpay === "undefined") {
        throw new Error(
            "Razorpay Checkout SDK is not loaded."
        );
    }

    const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency || "INR",
        name: "VELOCITY",
        description:
            `Payment for Order ${velocityOrderId}`,
        order_id: razorpayData.razorpayOrderId,

        prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone
        },

        notes: {
            velocityOrderId
        },

        theme: {
            color: "#111111"
        },

        handler: async function (response) {
            console.log(
                "Razorpay payment successful."
            );

            try {
                const verificationResult =
                    await verifyRazorpayPayment({
                        orderId: velocityOrderId,
                        razorpayOrderId:
                            response.razorpay_order_id,
                        razorpayPaymentId:
                            response.razorpay_payment_id,
                        razorpaySignature:
                            response.razorpay_signature
                    });

                console.log(
                    "Payment verification successful:",
                    verificationResult
                );

                if (
                    typeof updateCartCount ===
                    "function"
                ) {
                    updateCartCount();
                }

                window.location.href =
                    `order-tracking.html?orderId=${velocityOrderId}`;
            } catch (error) {
                console.error(
                    "Payment verification error:",
                    error
                );

                alert(
                    "Payment was completed, but verification failed. " +
                    "Please contact support with your order ID: " +
                    velocityOrderId
                );
            }
        },

        modal: {
            ondismiss: function () {
                console.log(
                    "Razorpay checkout closed."
                );

                const button =
                    document.querySelector(
                        ".place-order-btn"
                    );

                if (button) {
                    button.disabled = false;
                    button.textContent =
                        "🔒 Pay Now";
                }
            }
        }
    };

    const razorpay =
        new Razorpay(options);

    razorpay.on(
        "payment.failed",
        async function (response) {
            console.error(
                "Razorpay payment failed:",
                response.error
            );

            const error =
                response.error || {};

            const metadata =
                error.metadata || {};

            const razorpayPaymentId =
                metadata.payment_id || null;

            const razorpayOrderId =
                metadata.order_id ||
                razorpayData.razorpayOrderId ||
                null;

            const reason =
                error.description ||
                error.reason ||
                "Razorpay payment failed";

            console.log(
                "Payment failed for order:",
                velocityOrderId
            );

            try {
                await reportPaymentFailure({
                    orderId: velocityOrderId,
                    razorpayOrderId,
                    razorpayPaymentId,
                    reason,
                    errorCode:
                        error.code || null,
                    errorSource:
                        error.source || null,
                    errorStep:
                        error.step || null
                });

                console.log(
                    "Payment failure reported successfully."
                );
            } catch (backendError) {
                console.error(
                    "Could not report payment failure:",
                    backendError
                );

                alert(
                    "Payment failed, but VELOCITY could not update " +
                    "the order automatically. Order ID: " +
                    velocityOrderId
                );

                const button =
                    document.querySelector(
                        ".place-order-btn"
                    );

                if (button) {
                    button.disabled = false;
                    button.textContent =
                        "🔒 Pay Now";
                }

                return;
            }

            alert(
                reason ||
                "Payment failed. Please try again."
            );

            const button =
                document.querySelector(
                    ".place-order-btn"
                );

            if (button) {
                button.disabled = false;
                button.textContent =
                    "🔒 Pay Now";
            }
        }
    );

    razorpay.open();
}

async function handleCheckout(event) {
    event.preventDefault();

    const button =
        document.querySelector(
            ".place-order-btn"
        );

    if (button) {
        button.disabled = true;
        button.textContent =
            "Creating Order...";
    }

    try {
        const user = getUser();
        const token = getToken();

        if (!user || !token) {
            throw new Error(
                "Please login before checkout."
            );
        }

        if (!cart || cart.length === 0) {
            throw new Error(
                "Your cart is empty."
            );
        }

        const customer =
            getCustomerDetails();

        console.log(
            "Creating VELOCITY order..."
        );

        const velocityOrder =
            await createVelocityOrder(
                customer
            );

        console.log(
            "VELOCITY order created:",
            velocityOrder
        );

        const velocityOrderId =
            velocityOrder.order?._id ||
            velocityOrder.order?.id ||
            velocityOrder.orderId;

        if (!velocityOrderId) {
            throw new Error(
                "VELOCITY order ID was not returned by the server."
            );
        }

        if (button) {
            button.textContent =
                "Opening Payment...";
        }

        console.log(
            "Creating Razorpay order..."
        );

        const razorpayData =
            await createRazorpayOrder(
                velocityOrderId
            );

        console.log(
            "Razorpay order created:",
            razorpayData
        );

        openRazorpayCheckout(
            razorpayData,
            velocityOrderId,
            customer
        );
    } catch (error) {
        console.error(
            "Checkout error:",
            error
        );

        alert(
            error.message ||
            "Something went wrong during checkout."
        );

        if (button) {
            button.disabled = false;
            button.textContent =
                "🔒 Pay Now";
        }
    }
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const form =
            document.getElementById(
                "checkout-form"
            );

        if (form) {
            form.addEventListener(
                "submit",
                handleCheckout
            );
        }

        loadCart();
    }
);