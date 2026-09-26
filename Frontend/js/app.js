// =============================
// RUNFOLD GLOBAL APP
// =============================


// =========================================
// CART
// =========================================

function getCart() {

    return JSON.parse(
        localStorage.getItem("runfold-cart")
    ) || [];

}


function saveCart(cart) {

    localStorage.setItem(
        "runfold-cart",
        JSON.stringify(cart)
    );

}


function updateCartCount() {

    const cart = getCart();

    const count = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const cartCount =
        document.getElementById("cart-count");

    if (cartCount) {

        cartCount.textContent = count;

    }

}


function addToCart(product) {

    const cart = getCart();

    const existingProduct =
        cart.find(item => item.id === product.id);

    if (existingProduct) {

        existingProduct.quantity++;

    } else {

        cart.push({
            ...product,
            quantity: 1
        });

    }

    saveCart(cart);

    updateCartCount();

}


function formatCurrency(value) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR"

    }).format(value);

}


// =========================================
// AUTHENTICATION NAVIGATION
// =========================================

function updateAuthNavigation() {

    const authNav =
        document.getElementById("auth-nav");

    // Some pages may not have auth navigation
    if (!authNav) {
        return;
    }


    // Check if authentication functions exist
    if (
        typeof isLoggedIn !== "function"
    ) {
        return;
    }


    // User is logged in
    if (isLoggedIn()) {

        const user =
            typeof getCurrentUser === "function"
                ? getCurrentUser()
                : null;


        authNav.innerHTML = `

            <a href="order-tracking.html">
                Track Order
            </a>

            <a
                href="#"
                onclick="logoutUser(); return false;"
            >
                Logout
            </a>

        `;

    }

    // User is not logged in
    else {

        authNav.innerHTML = `

            <a href="login.html">
                Login
            </a>

        `;

    }

}


// =========================================
// DOM READY
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateCartCount();

        updateAuthNavigation();

    }
);