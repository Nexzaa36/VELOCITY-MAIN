const API_URL = "http://localhost:5000";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");


// =========================================================
// ADMIN ACCESS
// =========================================================

if (!token || role !== "admin") {
    window.location.replace("./admin-login.html");
}


// =========================================================
// HELPERS
// =========================================================

const $ = (id) => document.getElementById(id);


function headers() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatMoney(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}


function stockStatus(stock) {

    const value = Number(stock || 0);

    if (value <= 0) {
        return {
            label: "Out of stock",
            className: "out"
        };
    }

    if (value <= 5) {
        return {
            label: "Low stock",
            className: "low"
        };
    }

    return {
        label: "In stock",
        className: "good"
    };
}


// =========================================================
// STATE
// =========================================================

const state = {
    products: [],
    filtered: [],
    editingId: null
};


// =========================================================
// LOAD PRODUCTS
// =========================================================

async function loadProducts() {

    const loading = $("loading");
    const errorBox = $("error");

    if (loading) {
        loading.classList.remove("hidden");
    }

    if (errorBox) {
        errorBox.classList.add("hidden");
    }

    try {

        const response = await fetch(
            `${API_URL}/api/products`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load products."
            );

        }

        state.products = Array.isArray(data.products)
            ? data.products
            : [];

        populateCategories();

        applyFilters();

        updateStats();

    } catch (error) {

        console.error(
            "Load products error:",
            error
        );

        if (errorBox) {

            errorBox.textContent =
                error.message ||
                "Could not load products.";

            errorBox.classList.remove("hidden");

        }

    } finally {

        if (loading) {
            loading.classList.add("hidden");
        }

    }

}


// =========================================================
// CATEGORY FILTER
// =========================================================

function populateCategories() {

    const select = $("category-filter");

    if (!select) {
        return;
    }

    const current = select.value;

    const categories = [
        ...new Set(
            state.products
                .map(product => product.category)
                .filter(Boolean)
        )
    ].sort();

    select.innerHTML = `
        <option value="ALL">
            All categories
        </option>
    `;

    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;
        option.textContent = category;

        select.appendChild(option);

    });

    if (categories.includes(current)) {
        select.value = current;
    }

}


// =========================================================
// FILTER PRODUCTS
// =========================================================

function applyFilters() {

    const searchInput =
        $("search-input");

    const categoryFilter =
        $("category-filter");

    const search =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const category =
        categoryFilter
            ? categoryFilter.value
            : "ALL";


    state.filtered =
        state.products.filter(product => {

            const searchableText = [

                product.name,

                product.category,

                product.description,

                ...(Array.isArray(product.tags)
                    ? product.tags
                    : [])

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(search);


            const matchesCategory =
                category === "ALL" ||
                product.category === category;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    renderProducts();

}


// =========================================================
// RENDER PRODUCTS
// =========================================================

function renderProducts() {

    const body =
        $("products-body");

    const empty =
        $("empty");

    if (!body) {
        return;
    }

    body.innerHTML = "";


    if (!state.filtered.length) {

        if (empty) {
            empty.classList.remove("hidden");
        }

        return;

    }


    if (empty) {
        empty.classList.add("hidden");
    }


    state.filtered.forEach(product => {

        const status =
            stockStatus(product.stock);


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="product-cell">

                    <div class="product-thumb">

                        ${product.image
                ? `
                                    <img
    src="${escapeHtml(
                    product.image?.startsWith("http")
                        ? product.image
                        : `../${product.image || ""}`
                )}"
    alt="${escapeHtml(product.name)}"
    loading="lazy"
>
                                `
                : `
                                    <span>
                                        V
                                    </span>
                                `
            }

                    </div>


                    <div>

                        <strong>
                            ${escapeHtml(product.name)}
                        </strong>

                        <small>
                            ID: ${escapeHtml(product._id)}
                        </small>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHtml(product.category || "—")}
            </td>


            <td>
                <strong>
                    ${formatMoney(product.price)}
                </strong>
            </td>


            <td>
                ${Number(product.stock || 0)}
            </td>


            <td>

                <span
                    class="stock-badge ${status.className}"
                >
                    ${status.label}
                </span>

            </td>


            <td>

                <div class="action-buttons">

                    <button
                        type="button"
                        class="edit-button"
                        data-id="${escapeHtml(product._id)}"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="delete-button"
                        data-id="${escapeHtml(product._id)}"
                    >
                        Delete
                    </button>

                </div>

            </td>

        `;


        body.appendChild(row);

    });

}


// =========================================================
// PRODUCT STATISTICS
// =========================================================

function updateStats() {

    const products =
        state.products;


    const inStock =
        products.filter(
            product =>
                Number(product.stock || 0) > 5
        ).length;


    const lowStock =
        products.filter(product => {

            const stock =
                Number(product.stock || 0);

            return (
                stock > 0 &&
                stock <= 5
            );

        }).length;


    const outOfStock =
        products.filter(
            product =>
                Number(product.stock || 0) <= 0
        ).length;


    if ($("total-products")) {
        $("total-products").textContent =
            products.length;
    }


    if ($("in-stock-products")) {
        $("in-stock-products").textContent =
            inStock;
    }


    if ($("low-stock-products")) {
        $("low-stock-products").textContent =
            lowStock;
    }


    if ($("out-stock-products")) {
        $("out-stock-products").textContent =
            outOfStock;
    }

}


// =========================================================
// ADD PRODUCT
// =========================================================

function openAddModal() {

    state.editingId = null;


    $("modal-title").textContent =
        "Add product";


    $("product-form").reset();


    $("product-id").value = "";


    $("form-error").classList.add(
        "hidden"
    );


    openModal();

}


// =========================================================
// EDIT PRODUCT
// =========================================================

function openEditModal(id) {

    const product =
        state.products.find(
            item =>
                String(item._id) ===
                String(id)
        );


    if (!product) {
        return;
    }


    state.editingId = id;


    $("modal-title").textContent =
        "Edit product";


    $("product-id").value =
        product._id || "";


    $("product-name").value =
        product.name || "";


    $("product-category").value =
        product.category || "";


    $("product-price").value =
        product.price ?? "";


    $("product-stock").value =
        product.stock ?? "";


    $("product-image").value =
        product.image || "";


    $("product-description").value =
        product.description || "";


    $("product-tags").value =
        Array.isArray(product.tags)
            ? product.tags.join(", ")
            : "";


    $("product-sizes").value =
        Array.isArray(product.sizes)
            ? product.sizes.join(", ")
            : "";


    $("form-error").classList.add(
        "hidden"
    );


    openModal();

}


// =========================================================
// MODAL
// =========================================================

function openModal() {

    const modal =
        $("modal");

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeModal() {

    const modal =
        $("modal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


// =========================================================
// FORM DATA
// =========================================================

function getFormData() {

    return {

        name:
            $("product-name")
                .value
                .trim(),


        category:
            $("product-category")
                .value
                .trim(),


        description:
            $("product-description")
                .value
                .trim(),


        price:
            Number(
                $("product-price").value
            ),


        stock:
            Number(
                $("product-stock").value
            ),


        image:
            $("product-image")
                .value
                .trim(),


        tags:
            $("product-tags")
                .value
                .split(",")
                .map(value =>
                    value.trim()
                )
                .filter(Boolean),


        sizes:
            $("product-sizes")
                .value
                .split(",")
                .map(value =>
                    value.trim()
                )
                .filter(Boolean)

    };

}


// =========================================================
// SAVE PRODUCT
// =========================================================

async function saveProduct(event) {

    event.preventDefault();


    const button =
        $("save-btn");


    const formError =
        $("form-error");


    formError.classList.add(
        "hidden"
    );


    const data =
        getFormData();


    // -------------------------
    // VALIDATION
    // -------------------------

    if (!data.name) {

        formError.textContent =
            "Product name is required.";

        formError.classList.remove(
            "hidden"
        );

        return;

    }


    if (!data.category) {

        formError.textContent =
            "Category is required.";

        formError.classList.remove(
            "hidden"
        );

        return;

    }


    if (
        !Number.isFinite(data.price) ||
        data.price < 0
    ) {

        formError.textContent =
            "Enter a valid price.";

        formError.classList.remove(
            "hidden"
        );

        return;

    }


    if (
        !Number.isFinite(data.stock) ||
        data.stock < 0
    ) {

        formError.textContent =
            "Enter a valid stock quantity.";

        formError.classList.remove(
            "hidden"
        );

        return;

    }


    if (!data.image) {

        formError.textContent =
            "Image URL is required.";

        formError.classList.remove(
            "hidden"
        );

        return;

    }


    // -------------------------
    // DISABLE BUTTON
    // -------------------------

    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        const editing =
            Boolean(state.editingId);


        const url =
            editing
                ? `${API_URL}/api/products/${encodeURIComponent(
                    state.editingId
                )}`
                : `${API_URL}/api/products`;


        const method =
            editing
                ? "PUT"
                : "POST";


        const response =
            await fetch(
                url,
                {
                    method,
                    headers: headers(),
                    body: JSON.stringify(data)
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to save product."
            );

        }


        closeModal();


        await loadProducts();


    } catch (error) {

        console.error(
            "Save product error:",
            error
        );


        formError.textContent =
            error.message ||
            "Unable to save product.";


        formError.classList.remove(
            "hidden"
        );


    } finally {

        button.disabled = false;

        button.textContent =
            "Save Product";

    }

}


// =========================================================
// DELETE PRODUCT
// =========================================================

async function deleteProduct(id) {

    const product =
        state.products.find(
            item =>
                String(item._id) ===
                String(id)
        );


    if (!product) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/products/${encodeURIComponent(id)}`,
                {
                    method: "DELETE",
                    headers: headers()
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to delete product."
            );

        }


        await loadProducts();


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );


        window.alert(
            error.message ||
            "Unable to delete product."
        );

    }

}


// =========================================================
// LOGOUT
// =========================================================

function logoutAdmin() {

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem(
        "velocity-current-order"
    );


    window.location.replace(
        "./admin-login.html"
    );

}


// =========================================================
// EVENTS
// =========================================================

const addProductButton =
    $("add-product-btn");

if (addProductButton) {

    addProductButton.addEventListener(
        "click",
        openAddModal
    );

}


const productForm =
    $("product-form");

if (productForm) {

    productForm.addEventListener(
        "submit",
        saveProduct
    );

}


const cancelButton =
    $("cancel-btn");

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        closeModal
    );

}


const closeModalButton =
    $("close-modal");

if (closeModalButton) {

    closeModalButton.addEventListener(
        "click",
        closeModal
    );

}


const modal =
    $("modal");

if (modal) {

    const backdrop =
        modal.querySelector(
            ".modal-backdrop"
        );

    if (backdrop) {

        backdrop.addEventListener(
            "click",
            closeModal
        );

    }

}


const searchInput =
    $("search-input");

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


const categoryFilter =
    $("category-filter");

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        applyFilters
    );

}


const productsBody =
    $("products-body");

if (productsBody) {

    productsBody.addEventListener(
        "click",
        event => {

            const edit =
                event.target.closest(
                    ".edit-button"
                );


            if (edit) {

                openEditModal(
                    edit.dataset.id
                );

                return;

            }


            const remove =
                event.target.closest(
                    ".delete-button"
                );


            if (remove) {

                deleteProduct(
                    remove.dataset.id
                );

            }

        }
    );

}


// =========================================================
// LOGOUT BUTTON
// =========================================================

const logoutButton =
    $("logout-btn");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutAdmin
    );

}


// =========================================================
// ESCAPE KEY
// =========================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }
);


// =========================================================
// START
// =========================================================

if (
    token &&
    role === "admin"
) {

    loadProducts();

}