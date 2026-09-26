const checkoutForm =
    document.getElementById("checkout-form");

const checkoutItems =
    document.getElementById("checkout-items");

const checkoutTotal =
    document.getElementById("checkout-total");


function renderCheckout() {

    const cart = getCart();

    let total = 0;

    checkoutItems.innerHTML = "";


    cart.forEach(item => {

        total +=
            item.price * item.quantity;


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
                    item.price * item.quantity
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


checkoutForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const cart = getCart();

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }


        const order = {

            customer: {

                name:
                    document.getElementById("name").value,

                email:
                    document.getElementById("email").value,

                address:
                    document.getElementById("address").value,

                city:
                    document.getElementById("city").value,

                postal:
                    document.getElementById("postal").value

            },

            items: cart,

            createdAt:
                new Date().toISOString()
        };


        console.log(
            "Order ready:",
            order
        );


        /*
         * Later:
         *
         * await fetch(
         *     "http://localhost:8080/api/orders",
         *     {
         *         method: "POST",
         *         headers: {
         *             "Content-Type":
         *                 "application/json"
         *         },
         *         body:
         *             JSON.stringify(order)
         *     }
         * );
         */


        localStorage.removeItem(
            "runfold-cart"
        );


        alert(
            "Order created successfully!"
        );


        window.location.href =
            "index.html";
    }
);


renderCheckout();