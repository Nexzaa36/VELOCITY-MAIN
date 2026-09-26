const cartContainer =
    document.getElementById("cart-items");

const subtotalElement =
    document.getElementById("cart-subtotal");

const totalElement =
    document.getElementById("cart-total");


function renderCart() {

    const cart = getCart();

    cartContainer.innerHTML = "";


    if (cart.length === 0) {

        cartContainer.innerHTML = `
            <div class="feature-card">

                <h2>Your cart is empty.</h2>

                <p>
                    Explore the catalogue and
                    add some products.
                </p>

                <br>

                <a
                    href="catalogue.html"
                    class="btn btn-primary">

                    Explore Catalogue

                </a>

            </div>
        `;

        subtotalElement.textContent =
            formatCurrency(0);

        totalElement.textContent =
            formatCurrency(0);

        return;
    }


    let subtotal = 0;


    cart.forEach(item => {

        subtotal +=
            item.price * item.quantity;


        const element =
            document.createElement("div");

        element.className = "cart-item";


        element.innerHTML = `

            <div class="cart-item-image">
                ${item.image}
            </div>

            <div class="cart-item-info">

                <h3>
                    ${item.name}
                </h3>

                <span>
                    Quantity: ${item.quantity}
                </span>

                <br>

                <strong>
                    ${formatCurrency(
                        item.price * item.quantity
                    )}
                </strong>

            </div>

            <button
                class="remove-item"
                onclick="removeFromCart(${item.id})">

                Remove

            </button>

        `;

        cartContainer.appendChild(element);
    });


    subtotalElement.textContent =
        formatCurrency(subtotal);

    totalElement.textContent =
        formatCurrency(subtotal);
}


function removeFromCart(productId) {

    let cart = getCart();

    cart =
        cart.filter(
            item => item.id !== productId
        );

    saveCart(cart);

    updateCartCount();

    renderCart();
}


renderCart();