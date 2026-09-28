// ======================================
// CHECKOUT
// ======================================


// ======================================
// USER / AUTH
// ======================================

const user = getCurrentUser();
const token = getToken();


// ======================================
// ELEMENTS
// ======================================

const checkoutForm =
    document.getElementById("checkout-form");

const checkoutItems =
    document.getElementById("checkout-items");

const checkoutSubtotal =
    document.getElementById("checkout-subtotal");

const checkoutTax =
    document.getElementById("checkout-tax");

const checkoutTotal =
    document.getElementById("checkout-total");


// ======================================
// GET CHECKOUT CART
// ======================================
//
// getCart() in app.js is async because
// it gets the cart from MongoDB.
//
// Therefore we MUST use await.
//

async function getCheckoutCart() {

    return await getCart();

}


// ======================================
// RENDER CHECKOUT
// ======================================

async function loadCheckout() {

    try {

        const cart =
            await getCheckoutCart();


        console.log(
            "Checkout Cart:",
            cart
        );


        // ==================================
        // EMPTY CART
        // ==================================

        if (
            !Array.isArray(cart) ||
            cart.length === 0
        ) {

            checkoutItems.innerHTML = `
                <p class="empty-checkout">
                    Your cart is empty.
                </p>
            `;

            checkoutSubtotal.innerText =
                "₹0";

            checkoutTax.innerText =
                "₹0";

            checkoutTotal.innerText =
                "₹0";

            return;
        }


        // ==================================
        // CALCULATE SUBTOTAL
        // ==================================

        let subtotal = 0;


        checkoutItems.innerHTML = "";


        cart.forEach(item => {

            const itemPrice =
                Number(item.price) || 0;

            const quantity =
                Number(item.quantity) || 1;


            const itemTotal =
                itemPrice * quantity;


            subtotal += itemTotal;


            // ==================================
            // CREATE CHECKOUT ITEM
            // ==================================

            const itemElement =
                document.createElement("div");


            itemElement.className =
                "checkout-item";


            itemElement.innerHTML = `

                <div class="checkout-item-image">

                    <img
                        src="${item.image || ""}"
                        alt="${item.name || "Product"}"
                    >

                </div>


                <div class="checkout-item-info">

                    <h3>
                        ${item.name || "Product"}
                    </h3>


                    ${
                        item.size
                            ? `
                                <p>
                                    Size: ${item.size}
                                </p>
                              `
                            : ""
                    }


                    <p>
                        Quantity: ${quantity}
                    </p>


                    <strong>
                        ${formatCurrency(itemTotal)}
                    </strong>

                </div>

            `;


            checkoutItems.appendChild(
                itemElement
            );

        });


        // ==================================
        // TOTALS
        // ==================================

        const shipping = 0;


        const tax =
            subtotal * 0.05;


        const total =
            subtotal +
            shipping +
            tax;


        // ==================================
        // DISPLAY TOTALS
        // ==================================

        checkoutSubtotal.innerText =
            formatCurrency(subtotal);


        checkoutTax.innerText =
            formatCurrency(tax);


        checkoutTotal.innerText =
            formatCurrency(total);


    } catch (error) {

        console.error(
            "Load Checkout Error:",
            error
        );


        checkoutItems.innerHTML = `
            <p class="empty-checkout">
                Unable to load your cart.
            </p>
        `;

    }

}


// ======================================
// PLACE ORDER
// ======================================

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ==================================
            // CHECK LOGIN
            // ==================================

            const currentUser =
                getCurrentUser();


            const currentToken =
                getToken();


            if (
                !currentUser ||
                !currentUser.id ||
                !currentToken
            ) {

                alert(
                    "Please login before placing an order."
                );


                window.location.href =
                    "login.html";


                return;

            }


            // ==================================
            // GET CART FROM MONGODB
            // ==================================

            const cart =
                await getCheckoutCart();


            // ==================================
            // CHECK EMPTY CART
            // ==================================

            if (
                !Array.isArray(cart) ||
                cart.length === 0
            ) {

                alert(
                    "Your cart is empty."
                );


                return;

            }


            console.log(
                "Placing order for user:",
                currentUser.id
            );


            console.log(
                "MongoDB Cart:",
                cart
            );


            // ==================================
            // CUSTOMER INFORMATION
            // ==================================

            const orderData = {

                customer: {

                    name:
                        document
                            .getElementById("name")
                            .value
                            .trim(),

                    email:
                        document
                            .getElementById("email")
                            .value
                            .trim(),

                    phone:
                        document
                            .getElementById("phone")
                            .value
                            .trim(),

                    address:
                        document
                            .getElementById("address")
                            .value
                            .trim(),

                    city:
                        document
                            .getElementById("city")
                            .value
                            .trim(),

                    state:
                        document
                            .getElementById("state")
                            .value,

                    postal:
                        document
                            .getElementById("postal")
                            .value
                            .trim()

                }

            };


            console.log(
                "Customer information:",
                orderData.customer
            );


            // ==================================
            // SEND ORDER TO BACKEND
            // ==================================

            try {

                const response =
                    await fetch(
                        `http://localhost:5000/api/orders/${currentUser.id}`,
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${currentToken}`

                            },

                            body:
                                JSON.stringify(
                                    orderData
                                )

                        }
                    );


                // ==================================
                // READ RESPONSE
                // ==================================

                const data =
                    await response.json();


                console.log(
                    "Create Order Status:",
                    response.status
                );


                console.log(
                    "Create Order Response:",
                    data
                );


                // ==================================
                // BACKEND ERROR
                // ==================================

                if (
                    !response.ok ||
                    !data.success
                ) {

                    console.error(
                        "Order creation failed:",
                        data
                    );


                    alert(
                        data.message ||
                        "Failed to create order"
                    );


                    return;

                }


                // ==================================
                // ORDER SUCCESS
                // ==================================

                console.log(
                    "Created Order:",
                    data.order
                );

                // ==================================
                // IMPORTANT
                // ==================================
                //
                // DO NOT use:
                //
                // saveCart([]);
                //
                // The backend already clears the
                // MongoDB cart after creating the
                // order successfully.
                //


                await updateCartCount();


                // ==================================
                // REDIRECT
                // ==================================

                window.location.href =
                    "order-tracking.html";


            } catch (error) {

                console.error(
                    "Place Order Error:",
                    error
                );


                alert(
                    "Unable to connect to the server."
                );

            }

        }
    );

}


// ======================================
// INITIAL LOAD
// ======================================

loadCheckout();