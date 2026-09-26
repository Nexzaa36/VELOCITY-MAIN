// =====================================
// VELOCITY CHECKOUT
// =====================================

const checkoutForm =
    document.getElementById("checkout-form");

const checkoutItems =
    document.getElementById("checkout-items");

const checkoutTotal =
    document.getElementById("checkout-total");


// =====================================
// RENDER ORDER SUMMARY
// =====================================

function renderCheckout() {

    const cart = getCart();

    let total = 0;

    checkoutItems.innerHTML = "";

    cart.forEach(item => {

        total +=
            item.price *
            item.quantity;

        const itemElement =
            document.createElement("div");

        itemElement.className =
            "summary-row";

        itemElement.innerHTML = `

            <span>
                ${item.name} × ${item.quantity}
            </span>

            <strong>
                ${formatCurrency(
                    item.price *
                    item.quantity
                )}
            </strong>

        `;

        checkoutItems.appendChild(
            itemElement
        );

    });

    checkoutTotal.textContent =
        formatCurrency(total);

}


// =====================================
// GENERATE ORDER ID
// =====================================

function generateOrderId() {

    return (
        "VE-" +
        Math.floor(
            100000 +
            Math.random() * 900000
        )
    );

}


// =====================================
// CHECKOUT SUBMIT
// =====================================

checkoutForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const cart =
            getCart();

        if (cart.length === 0) {

            alert(
                "Your cart is empty."
            );

            return;

        }


        // ==========================
        // CUSTOMER DETAILS
        // ==========================

        const customer = {

            name:
                document.getElementById(
                    "name"
                ).value,

            email:
                document.getElementById(
                    "email"
                ).value,

            address:
                document.getElementById(
                    "address"
                ).value,

            city:
                document.getElementById(
                    "city"
                ).value,

            postal:
                document.getElementById(
                    "postal"
                ).value

        };


        // ==========================
        // ORDER OBJECT
        // ==========================

        const order = {

            orderId:
                generateOrderId(),

            status:
                "Processing",

            estimatedDelivery:
                "3 - 5 Business Days",

            createdAt:
                new Date()
                    .toLocaleString(),

            customer:
                customer,

            items:
                cart

        };


        // ==========================
        // SAVE ORDER
        // ==========================

        localStorage.setItem(
            "velocity-current-order",
            JSON.stringify(order)
        );


        // ==========================
        // CLEAR CART
        // ==========================

        localStorage.removeItem(
            "runfold-cart"
        );


        // ==========================
        // REDIRECT
        // ==========================

        window.location.href =
            "order-tracking.html";

    }
);


// =====================================
// INITIAL LOAD
// =====================================

renderCheckout();