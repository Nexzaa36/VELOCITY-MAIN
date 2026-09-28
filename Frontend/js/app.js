// =============================
// RUNFOLD GLOBAL APP
// =============================

// =========================================
// AUTH HELPERS
// =========================================

function getLoggedInUserId() {

    const user =
        typeof getCurrentUser === "function"
            ? getCurrentUser()
            : null;

    if (!user) {
        return null;
    }

    return user.id || user._id || null;
}


function getAuthToken() {

    return typeof getToken === "function"
        ? getToken()
        : null;

}


// =========================================
// GET CART FROM MONGODB
// =========================================

async function getCart() {

    const userId =
        getLoggedInUserId();

    const token =
        getAuthToken();


    if (!userId || !token) {

        return [];

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/cart/${userId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data.success ||
            !data.cart
        ) {

            return [];

        }


        return data.cart.items.map(
            item => {

                const product =
                    item.productId;


                return {

                    id:
                        product?.id || null,

                    productId:
                        product?._id ||
                        item.productId,

                    name:
                        product?.name ||
                        "Product",

                    price:
                        Number(item.price) ||
                        Number(product?.price) ||
                        0,

                    category:
                        product?.category ||
                        "",

                    image:
                        product?.image ||
                        "",

                    tags:
                        Array.isArray(product?.tags)
                            ? product.tags
                            : [],

                    sizes:
                        Array.isArray(product?.sizes)
                            ? product.sizes
                            : [],

                    stock:
                        Number(product?.stock) ||
                        0,

                    size:
                        item.size || null,

                    quantity:
                        Number(item.quantity) || 1

                };

            }
        );

    } catch (error) {

        console.error(
            "Get Cart Error:",
            error
        );

        return [];

    }

}


// =========================================
// ADD PRODUCT TO MONGODB CART
// =========================================

async function addToCart(product) {

    const userId =
        getLoggedInUserId();

    const token =
        getAuthToken();


    // =====================================
    // USER MUST BE LOGGED IN
    // =====================================

    if (!userId || !token) {

        alert(
            "Please login before adding products to your cart."
        );

        window.location.href =
            "login.html";

        return;

    }


    // =====================================
    // MONGODB PRODUCT ID
    // =====================================

    const productId =
        product.productId ||
        product._id;


    if (!productId) {

        console.error(
            "MongoDB product ID is missing:",
            product
        );

        alert(
            "Product ID is missing."
        );

        return;

    }


    const stock =
        Number(product.stock) || 0;


    if (stock <= 0) {

        alert(
            "This product is currently out of stock."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/cart/${userId}/items`,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            productId:

                                productId,

                            quantity:
                                1,

                            size:
                                product.size ||
                                null

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Failed to add product to cart."
            );

            return;

        }


        console.log(
            "MongoDB Cart Updated:",
            data.cart
        );


        await updateCartCount();

    } catch (error) {

        console.error(
            "Add To Cart Error:",
            error
        );

        alert(
            "Unable to add product to cart."
        );

    }

}


// =========================================
// UPDATE CART COUNT
// =========================================

async function updateCartCount() {

    const cartCount =
        document.getElementById(
            "cart-count"
        );


    if (!cartCount) {

        return;

    }


    const cart =
        await getCart();


    const count =
        cart.reduce(
            (total, item) =>

                total +
                (Number(item.quantity) || 0),

            0
        );


    cartCount.textContent =
        count;

}


// =========================================
// FORMAT CURRENCY
// =========================================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR"
        }
    ).format(value);

}


// =========================================
// AUTHENTICATION NAVIGATION
// =========================================

function updateAuthNavigation() {

    const authNav =
        document.getElementById(
            "auth-nav"
        );


    if (!authNav) {

        return;

    }


    if (
        typeof isLoggedIn !==
        "function"
    ) {

        return;

    }


    if (isLoggedIn()) {

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
    async function () {

        updateAuthNavigation();

        await updateCartCount();

    }
);