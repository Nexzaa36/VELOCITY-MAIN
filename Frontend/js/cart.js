// =====================================
// RUNFOLD CART
// =====================================


// =====================================
// ELEMENTS
// =====================================

const cartItemsContainer =
    document.getElementById(
        "cart-items"
    );

const subtotalElement =
    document.getElementById(
        "cart-subtotal"
    );

const totalElement =
    document.getElementById(
        "cart-total"
    );


// =====================================
// CART DATA
// =====================================

let cart = [];


// =====================================
// FORMAT PRICE
// =====================================

function formatPrice(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(value);

}


// =====================================
// LOAD CART FROM MONGODB
// =====================================

async function loadCart() {

    cart =
        await getCart();

    updateCartCount();

    renderCart();

}


// =====================================
// UPDATE NAV CART COUNT
// =====================================

function updateCartCount() {

    const countElement =
        document.getElementById(
            "cart-count"
        );


    if (!countElement) {

        return;

    }


    const totalItems =
        cart.reduce(
            (total, item) =>

                total +
                (Number(item.quantity) || 0),

            0
        );


    countElement.textContent =
        totalItems;

}


// =====================================
// RENDER CART
// =====================================

function renderCart() {

    if (!cartItemsContainer) {

        return;

    }


    cartItemsContainer.innerHTML = "";


    // =====================================
    // EMPTY CART
    // =====================================

    if (cart.length === 0) {

        cartItemsContainer.innerHTML = `

            <div class="empty-cart">

                <h2>
                    Your cart is empty
                </h2>

                <p>
                    Add products from catalogue.
                </p>

                <a
                    href="catalogue.html"
                    class="btn btn-primary"
                >
                    Start Shopping
                </a>

            </div>

        `;

        updateSummary();

        return;

    }


    // =====================================
    // CART PRODUCTS
    // =====================================

    cart.forEach(
        (item, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "cart-item";


            card.innerHTML = `

                <div class="cart-image">

                    <img
                        src="${item.image}"
                        alt="${item.name}"
                        onerror="
                            this.src='images/p1.jpg'
                        "
                    >

                </div>


                <div class="cart-details">

                    <h3>
                        ${item.name}
                    </h3>


                    <p>
                        Size:
                        ${item.size || "-"}
                    </p>


                    <div class="cart-price">

                        ${formatPrice(
                            item.price
                        )}

                    </div>


                    <div class="quantity-controls">

                        <button
                            onclick="decreaseQty(${index})"
                        >
                            −
                        </button>


                        <span>
                            ${item.quantity || 1}
                        </span>


                        <button
                            onclick="increaseQty(${index})"
                        >
                            +
                        </button>

                    </div>


                    <button
                        class="remove-btn"
                        onclick="removeItem(${index})"
                    >
                        Remove Item
                    </button>

                </div>

            `;


            cartItemsContainer.appendChild(
                card
            );

        }
    );


    updateSummary();

}


// =====================================
// UPDATE SUMMARY
// =====================================

function updateSummary() {

    const subtotal =
        cart.reduce(
            (sum, item) =>

                sum +
                (
                    Number(item.price) *
                    (Number(item.quantity) || 1)
                ),

            0
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            formatPrice(subtotal);

    }


    if (totalElement) {

        totalElement.textContent =
            formatPrice(subtotal);

    }

}


// =====================================
// INCREASE QUANTITY
// =====================================

async function increaseQty(index) {

    const item =
        cart[index];


    if (!item) {

        return;

    }


    const newQuantity =
        (Number(item.quantity) || 1) + 1;


    await updateCartItemOnServer(
        item,
        newQuantity
    );

}


// =====================================
// DECREASE QUANTITY
// =====================================

async function decreaseQty(index) {

    const item =
        cart[index];


    if (!item) {

        return;

    }


    const currentQuantity =
        Number(item.quantity) || 1;


    if (currentQuantity <= 1) {

        return;

    }


    const newQuantity =
        currentQuantity - 1;


    await updateCartItemOnServer(
        item,
        newQuantity
    );

}


// =====================================
// UPDATE SERVER CART
// =====================================

async function updateCartItemOnServer(
    item,
    quantity
) {

    const userId =
        getLoggedInUserId();

    const token =
        getAuthToken();


    if (!userId || !token) {

        window.location.href =
            "login.html";

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/cart/${userId}/items/${item.productId}`,
                {
                    method: "PUT",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            quantity:
                                quantity,

                            size:
                                item.size ||
                                null

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to update cart."
            );

            return;

        }


        await loadCart();

    } catch (error) {

        console.error(
            "Update Cart Error:",
            error
        );

        alert(
            "Unable to update cart."
        );

    }

}


// =====================================
// REMOVE PRODUCT
// =====================================

async function removeItem(index) {

    const item =
        cart[index];


    if (!item) {

        return;

    }


    const userId =
        getLoggedInUserId();

    const token =
        getAuthToken();


    if (!userId || !token) {

        window.location.href =
            "login.html";

        return;

    }


    try {

        const query =
            item.size
                ? `?size=${encodeURIComponent(item.size)}`
                : "";


        const response =
            await fetch(
                `${API_BASE_URL}/cart/${userId}/items/${item.productId}${query}`,
                {
                    method: "DELETE",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to remove item."
            );

            return;

        }


        await loadCart();

    } catch (error) {

        console.error(
            "Remove Cart Item Error:",
            error
        );

        alert(
            "Unable to remove item."
        );

    }

}


// =====================================
// INITIAL LOAD
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCart();

    }
);