// =====================================
// VELOCITY CART
// =====================================

const cartItemsContainer =
    document.getElementById("cart-items");

const subtotalElement =
    document.getElementById("cart-subtotal");

const totalElement =
    document.getElementById("cart-total");


// =====================================
// LOAD CART
// =====================================

let cart =
    JSON.parse(
        localStorage.getItem("runfold-cart")
    ) || [];


// =====================================
// SAVE CART
// =====================================

function saveCart() {

    localStorage.setItem(
        "runfold-cart",
        JSON.stringify(cart)
    );

    updateCartCount();

}


// =====================================
// UPDATE NAV CART COUNT
// =====================================

function updateCartCount() {

    const countElement =
        document.getElementById(
            "cart-count"
        );

    if (!countElement) return;

    const totalItems =
        cart.reduce(
            (total, item) =>
                total +
                (item.quantity || 1),
            0
        );

    countElement.textContent =
        totalItems;

}


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
// RENDER CART
// =====================================

function renderCart() {

    if (!cartItemsContainer)
        return;

    cartItemsContainer.innerHTML = "";


    // ============================
    // EMPTY CART
    // ============================

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


    // ============================
    // PRODUCTS
    // ============================

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
// ORDER SUMMARY
// =====================================

function updateSummary() {

    const subtotal =
        cart.reduce(
            (sum, item) =>
                sum +
                (
                    item.price *
                    (item.quantity || 1)
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

function increaseQty(index) {

    cart[index].quantity =
        (cart[index].quantity || 1) + 1;

    saveCart();

    renderCart();

}


// =====================================
// DECREASE QUANTITY
// =====================================

function decreaseQty(index) {

    if (
        (cart[index].quantity || 1) > 1
    ) {

        cart[index].quantity--;

    }

    saveCart();

    renderCart();

}


// =====================================
// REMOVE PRODUCT
// =====================================

function removeItem(index) {

    cart.splice(index, 1);

    saveCart();

    renderCart();

}


// =====================================
// INITIAL LOAD
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateCartCount();

        renderCart();

    }
);