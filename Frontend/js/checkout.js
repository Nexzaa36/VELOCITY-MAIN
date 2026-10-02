const API_URL = "https://velocity-y30h.onrender.com";

let cart = [];
let subtotal = 0;
let tax = 0;
let total = 0;

// User / token helpers
function getUser() {
    const userData = localStorage.getItem("user");

    if (!userData) {
        return null;
    }

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

// Validation helpers
function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);

    if (!field) {
        return;
    }

    field.classList.add("input-error");

    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);

    if (!field) {
        return;
    }

    field.classList.remove("input-error");

    if (errorElement) {
        errorElement.textContent = "";
    }
}

function clearAllValidationErrors() {
    const fields = [
        "name",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "postal"
    ];

    fields.forEach(clearFieldError);
}

// Validate checkout form
function validateCheckoutForm() {
    clearAllValidationErrors();

    let isValid = true;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value;
    const postal = document.getElementById("postal").value.trim();

    // Name validation
    const nameRegex = /^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/;

    if (!name) {
        setFieldError("name", "Please enter your full name.");
        isValid = false;
    } else if (name.length < 2) {
        setFieldError("name", "Name must contain at least 2 characters.");
        isValid = false;
    } else if (name.length > 50) {
        setFieldError("name", "Name cannot exceed 50 characters.");
        isValid = false;
    } else if (!nameRegex.test(name)) {
        setFieldError(
            "name",
            "Name can contain letters, spaces, hyphens and apostrophes only."
        );
        isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!email) {
        setFieldError("email", "Please enter your email address.");
        isValid = false;
    } else if (!emailRegex.test(email)) {
        setFieldError("email", "Please enter a valid email address.");
        isValid = false;
    }

    // Phone validation
    const phoneRegex = /^[6-9][0-9]{9}$/;

    if (!phone) {
        setFieldError("phone", "Please enter your phone number.");
        isValid = false;
    } else if (!phoneRegex.test(phone)) {
        setFieldError(
            "phone",
            "Enter a valid 10-digit Indian mobile number."
        );
        isValid = false;
    }

    // Address validation
    if (!address) {
        setFieldError("address", "Please enter your street address.");
        isValid = false;
    } else if (address.length < 10) {
        setFieldError("address", "Please enter a more complete address.");
        isValid = false;
    } else if (address.length > 150) {
        setFieldError("address", "Address cannot exceed 150 characters.");
        isValid = false;
    }

    // City validation
    const cityRegex = /^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/;

    if (!city) {
        setFieldError("city", "Please enter your city.");
        isValid = false;
    } else if (city.length < 2) {
        setFieldError("city", "City name is too short.");
        isValid = false;
    } else if (!cityRegex.test(city)) {
        setFieldError(
            "city",
            "City can contain letters, spaces, hyphens and apostrophes only."
        );
        isValid = false;
    }

    // State validation
    if (!state) {
        setFieldError("state", "Please select your state.");
        isValid = false;
    }

    // PIN code validation
    const postalRegex = /^[1-9][0-9]{5}$/;

    if (!postal) {
        setFieldError("postal", "Please enter your PIN code.");
        isValid = false;
    } else if (!postalRegex.test(postal)) {
        setFieldError("postal", "PIN code must be exactly 6 digits.");
        isValid = false;
    }

    return {
        valid: isValid,
        customer: {
            name,
            email,
            phone,
            address,
            city,
            state,
            postal
        }
    };
}

// Load cart
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

// Calculate totals
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

// Render checkout items
function renderCheckoutItems() {
    const container = document.getElementById("checkout-items");

    if (!container) {
        return;
    }

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

        const itemElement = document.createElement("div");

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

// Update order summary
function updateSummary() {
    const subtotalElement = document.getElementById("checkout-subtotal");
    const taxElement = document.getElementById("checkout-tax");
    const totalElement = document.getElementById("checkout-total");

    if (subtotalElement) {
        subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    }

    if (taxElement) {
        taxElement.textContent = `₹${tax.toFixed(2)}`;
    }

    if (totalElement) {
        totalElement.textContent = `₹${total.toFixed(2)}`;
    }
}

// Create VELOCITY order
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
            data.message || "Failed to create VELOCITY order."
        );
    }

    return data;
}

// Create Razorpay order
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
            data.message || "Failed to create Razorpay order."
        );
    }

    return data;
}

// Verify payment
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
            data.message || "Payment verification failed."
        );
    }

    return data;
}

// Report payment failure
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
            data.message || "Failed to report payment failure."
        );
    }

    return data;
}

// Open Razorpay checkout
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
        description: `Payment for Order ${velocityOrderId}`,
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
            console.log("Razorpay payment successful.");

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

                if (typeof updateCartCount === "function") {
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
                console.log("Razorpay checkout closed.");

                const button =
                    document.querySelector(".place-order-btn");

                if (button) {
                    button.disabled = false;
                    button.textContent = "🔒 Pay Now";
                }
            }
        }
    };

    const razorpay = new Razorpay(options);

    razorpay.on(
        "payment.failed",
        async function (response) {
            console.error(
                "Razorpay payment failed:",
                response.error
            );

            const error = response.error || {};
            const metadata = error.metadata || {};

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

            try {
                await reportPaymentFailure({
                    orderId: velocityOrderId,
                    razorpayOrderId,
                    razorpayPaymentId,
                    reason,
                    errorCode: error.code || null,
                    errorSource: error.source || null,
                    errorStep: error.step || null
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
                    document.querySelector(".place-order-btn");

                if (button) {
                    button.disabled = false;
                    button.textContent = "🔒 Pay Now";
                }

                return;
            }

            alert(
                reason ||
                "Payment failed. Please try again."
            );

            const button =
                document.querySelector(".place-order-btn");

            if (button) {
                button.disabled = false;
                button.textContent = "🔒 Pay Now";
            }
        }
    );

    razorpay.open();
}

// Handle checkout
async function handleCheckout(event) {
    event.preventDefault();

    const button =
        document.querySelector(".place-order-btn");

    const validation = validateCheckoutForm();

    if (!validation.valid) {
        const firstError =
            document.querySelector(".input-error");

        if (firstError) {
            firstError.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            firstError.focus();
        }

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Creating Order...";
    }

    try {
        const user = getUser();
        const token = getToken();

        if (!user || !token) {
            throw new Error("Please login before checkout.");
        }

        if (!cart || cart.length === 0) {
            throw new Error("Your cart is empty.");
        }

        const customer = validation.customer;

        console.log("Checkout validation successful.");
        console.log("Creating VELOCITY order...");

        const velocityOrder =
            await createVelocityOrder(customer);

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
            button.textContent = "Opening Payment...";
        }

        console.log("Creating Razorpay order...");

        const razorpayData =
            await createRazorpayOrder(velocityOrderId);

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
        console.error("Checkout error:", error);

        alert(
            error.message ||
            "Something went wrong during checkout."
        );

        if (button) {
            button.disabled = false;
            button.textContent = "🔒 Pay Now";
        }
    }
}

// Real-time input handling
document.addEventListener(
    "DOMContentLoaded",
    function () {
        const form =
            document.getElementById("checkout-form");

        if (form) {
            form.addEventListener(
                "submit",
                handleCheckout
            );
        }

        const phone =
            document.getElementById("phone");

        if (phone) {
            phone.addEventListener(
                "input",
                function () {
                    this.value = this.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                }
            );
        }

        const postal =
            document.getElementById("postal");

        if (postal) {
            postal.addEventListener(
                "input",
                function () {
                    this.value = this.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                }
            );
        }

        const fields = [
            "name",
            "email",
            "phone",
            "address",
            "city",
            "state",
            "postal"
        ];

        fields.forEach(function (fieldId) {
            const field =
                document.getElementById(fieldId);

            if (!field) {
                return;
            }

            field.addEventListener(
                "input",
                function () {
                    clearFieldError(fieldId);
                }
            );

            field.addEventListener(
                "change",
                function () {
                    clearFieldError(fieldId);
                }
            );
        });

        loadCart();
    }
);