// ========================================
// VELOCITY GLOBAL APP
// MongoDB Cart Version
// ========================================


// ========================================
// AUTH HELPERS
// ========================================

function getLoggedInUserId() {

    const user =
        typeof getCurrentUser === "function"
            ? getCurrentUser()
            : null;


    if (!user) {

        return null;

    }


    return (
        user.id ||
        user._id ||
        null
    );

}


function getAuthToken() {

    return typeof getToken === "function"
        ? getToken()
        : null;

}


// ========================================
// GET CART FROM MONGODB
// ========================================

async function getCart() {

    const userId =
        getLoggedInUserId();

    const token =
        getAuthToken();


    console.log(
        "================================="
    );

    console.log(
        "GET CART"
    );

    console.log(
        "Frontend User ID:",
        userId
    );

    console.log(
        "Token exists:",
        !!token
    );

    console.log(
        "API URL:",
        `${API_BASE_URL}/cart/${userId}`
    );

    console.log(
        "================================="
    );


    if (
        !userId ||
        !token
    ) {

        console.warn(
            "Cannot get cart: user or token missing"
        );

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


        console.log(
            "Cart API Status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "Cart API Response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `HTTP ${response.status}`
            );

        }


        if (
            !data.success ||
            !data.cart
        ) {

            console.warn(
                "Cart API returned no cart"
            );

            return [];

        }


        const items =
            Array.isArray(
                data.cart.items
            )
                ? data.cart.items
                : [];


        console.log(
            "MongoDB Cart Items:",
            items
        );


        return items.map(
            item => {

                const product =
                    item.productId;


                /*
                 * Mongoose populate may return
                 * either a product object or an
                 * ObjectId.
                 */

                const productId =
                    product &&
                    typeof product === "object"
                        ? (
                            product._id ||
                            product.id
                        )
                        : product;


                return {

                    id:
                        productId
                            ? productId.toString()
                            : null,

                    productId:
                        productId
                            ? productId.toString()
                            : null,

                    name:
                        product &&
                        typeof product === "object" &&
                        product.name
                            ? product.name
                            : "Product",

                    price:
                        Number(item.price) ||
                        (
                            product &&
                            typeof product === "object"
                                ? Number(
                                    product.price
                                )
                                : 0
                        ) ||
                        0,

                    category:
                        product &&
                        typeof product === "object"
                            ? (
                                product.category ||
                                ""
                            )
                            : "",

                    image:
                        product &&
                        typeof product === "object"
                            ? (
                                product.image ||
                                ""
                            )
                            : "",

                    tags:
                        product &&
                        typeof product === "object" &&
                        Array.isArray(product.tags)
                            ? product.tags
                            : [],

                    sizes:
                        product &&
                        typeof product === "object" &&
                        Array.isArray(product.sizes)
                            ? product.sizes
                            : [],

                    stock:
                        product &&
                        typeof product === "object"
                            ? Number(
                                product.stock
                            ) || 0
                            : 0,

                    size:
                        item.size ||
                        null,

                    quantity:
                        Number(
                            item.quantity
                        ) || 1

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


// ========================================
// ADD PRODUCT TO MONGODB CART
// ========================================

async function addToCart(product) {

    const userId =
        getLoggedInUserId();

    const token =
        getAuthToken();


    // ========================================
    // LOGIN CHECK
    // ========================================

    if (
        !userId ||
        !token
    ) {

        alert(
            "Please login before adding products to your cart."
        );


        window.location.href =
            "login.html";


        return;

    }


    // ========================================
    // GET MONGODB PRODUCT ID
    // ========================================

    const productId =
        product.productId ||
        product._id ||
        product.id;


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


    // ========================================
    // STOCK CHECK
    // ========================================

    const stock =
        Number(
            product.stock
        ) || 0;


    if (
        stock <= 0
    ) {

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


        console.log(
            "Add To Cart Response:",
            data
        );


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


// ========================================
// UPDATE CART COUNT
// ========================================

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
            (
                total,
                item
            ) => {

                return (
                    total +
                    (
                        Number(
                            item.quantity
                        ) || 0
                    )
                );

            },
            0
        );


    cartCount.textContent =
        count;


    console.log(
        "Cart count:",
        count
    );

}


// ========================================
// FORMAT CURRENCY
// ========================================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style:
                "currency",

            currency:
                "INR"
        }
    ).format(
        Number(value) || 0
    );

}


// ========================================
// AUTHENTICATION NAVIGATION
// ========================================

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


    if (
        isLoggedIn()
    ) {

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


// ========================================
// DOM READY
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        updateAuthNavigation();

        await updateCartCount();

    }
);