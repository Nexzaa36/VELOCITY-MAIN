const API_URL = "https://velocity-y30h.onrender.com";

const adminToken = localStorage.getItem("adminToken");
const adminRole = localStorage.getItem("adminRole");

if (!adminToken || adminRole !== "admin") {
    window.location.replace("./admin-login.html");
}

const $ = (id) => document.getElementById(id);

function headers() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
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

const state = {
    products: [],
    filtered: [],
    editingId: null
};

function setupProfileMenu() {
    const profileButton =
        $("profile-button");

    const profileMenu =
        $("profile-menu");

    if (!profileButton || !profileMenu) {
        return;
    }

    try {
        const storedUser =
            JSON.parse(
                localStorage.getItem("adminUser") || "null"
            );

        if (storedUser) {
            const profileName =
                $("profile-name");

            const profileEmail =
                $("profile-email");

            if (profileName) {
                profileName.textContent =
                    storedUser.name ||
                    storedUser.fullName ||
                    "VELOCITY Administrator";
            }

            if (profileEmail) {
                profileEmail.textContent =
                    storedUser.email ||
                    "admin@velocity.com";
            }
        }
    } catch (error) {
        console.warn(
            "Could not read stored admin profile:",
            error
        );
    }

    function openProfileMenu() {
        profileMenu.classList.remove("hidden");

        profileButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    function closeProfileMenu() {
        profileMenu.classList.add("hidden");

        profileButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    profileButton.addEventListener(
        "click",
        event => {
            event.stopPropagation();

            const isOpen =
                !profileMenu.classList.contains(
                    "hidden"
                );

            if (isOpen) {
                closeProfileMenu();
            } else {
                openProfileMenu();
            }
        }
    );

    profileMenu.addEventListener(
        "click",
        event => {
            event.stopPropagation();
        }
    );

    document.addEventListener(
        "click",
        closeProfileMenu
    );

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeProfileMenu();
            }
        }
    );
}

async function loadOrderCount() {
    const countElement =
        $("nav-order-count");

    if (!countElement) {
        return;
    }

    try {
        const response =
            await fetch(
                `${API_URL}/api/orders/admin/all`,
                {
                    method: "GET",
                    headers: headers()
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            logoutAdmin();
            return;
        }

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        if (!data.success) {
            return;
        }

        const orders =
            Array.isArray(data.orders)
                ? data.orders
                : [];

        countElement.textContent =
            orders.length;
    } catch (error) {
        console.warn(
            "Could not load order count:",
            error
        );
    }
}

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
        const response =
            await fetch(
                `${API_URL}/api/products`
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load products."
            );
        }

        state.products =
            Array.isArray(data.products)
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

            errorBox.classList.remove(
                "hidden"
            );
        }
    } finally {
        if (loading) {
            loading.classList.add("hidden");
        }
    }
}

function populateCategories() {
    const select =
        $("category-filter");

    if (!select) {
        return;
    }

    const current =
        select.value;

    select.innerHTML = `
        <option value="ALL">
            All categories
        </option>
        <option value="Accessories">
            Accessories
        </option>
        <option value="Apparel">
            Apparel
        </option>
        <option value="Footwear">
            Footwear
        </option>
    `;

    if (
        current === "Accessories" ||
        current === "Apparel" ||
        current === "Footwear"
    ) {
        select.value = current;
    } else {
        select.value = "ALL";
    }
}

function applyFilters() {
    const searchInput =
        $("search-input");

    const categoryFilter =
        $("category-filter");

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const category =
        categoryFilter
            ? categoryFilter.value
            : "ALL";

    state.filtered =
        state.products.filter(
            product => {
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
                    String(
                        product.category || ""
                    ).trim() === category;

                return (
                    matchesSearch &&
                    matchesCategory
                );
            }
        );

    renderProducts();
}

function getImageUrl(image) {
    if (!image) {
        return "";
    }

    const value =
        String(image).trim();

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:")
    ) {
        return value;
    }

    if (
        value.startsWith("../") ||
        value.startsWith("./")
    ) {
        return value;
    }

    return `../${value}`;
}

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

    state.filtered.forEach(
        product => {
            const status =
                stockStatus(product.stock);

            const row =
                document.createElement("tr");

            const imageUrl =
                getImageUrl(product.image);

            row.innerHTML = `
                <td>

                    <div class="product-cell">

                        <div class="product-thumb">

                            ${
                                imageUrl
                                    ? `
                                        <img
                                            src="${escapeHtml(imageUrl)}"
                                            alt="${escapeHtml(product.name)}"
                                            loading="lazy"
                                            onerror="this.style.display='none';"
                                        >
                                    `
                                    : `
                                        <span>V</span>
                                    `
                            }

                        </div>

                        <div>

                            <strong>
                                ${escapeHtml(
                                    product.name
                                )}
                            </strong>

                            <small>
                                ID:
                                ${escapeHtml(
                                    product._id
                                )}
                            </small>

                        </div>

                    </div>

                </td>

                <td>
                    ${escapeHtml(
                        product.category ||
                        "—"
                    )}
                </td>

                <td>

                    <strong>
                        ${formatMoney(
                            product.price
                        )}
                    </strong>

                </td>

                <td>
                    ${Number(
                        product.stock || 0
                    )}
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
                            data-id="${escapeHtml(
                                product._id
                            )}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="delete-button"
                            data-id="${escapeHtml(
                                product._id
                            )}"
                        >
                            Delete
                        </button>

                    </div>

                </td>
            `;

            body.appendChild(row);
        }
    );
}

function updateStats() {
    const products =
        state.products;

    const inStock =
        products.filter(
            product =>
                Number(product.stock || 0) > 5
        ).length;

    const lowStock =
        products.filter(
            product => {
                const stock =
                    Number(product.stock || 0);

                return (
                    stock > 0 &&
                    stock <= 5
                );
            }
        ).length;

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
                .map(
                    value =>
                        value.trim()
                )
                .filter(Boolean),

        sizes:
            $("product-sizes")
                .value
                .split(",")
                .map(
                    value =>
                        value.trim()
                )
                .filter(Boolean)
    };
}

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

    if (!data.name) {
        formError.textContent =
            "Product name is required.";

        formError.classList.remove(
            "hidden"
        );

        return;
    }

    if (
        ![
            "Accessories",
            "Apparel",
            "Footwear"
        ].includes(data.category)
    ) {
        formError.textContent =
            "Select a valid category.";

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

    button.disabled = true;
    button.textContent = "Saving...";

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
            response.status === 401 ||
            response.status === 403
        ) {
            logoutAdmin();
            return;
        }

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
            response.status === 401 ||
            response.status === 403
        ) {
            logoutAdmin();
            return;
        }

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

function logoutAdmin() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminUser");

    window.location.replace(
        "./admin-login.html"
    );
}

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

const logoutButton =
    $("logout-btn");

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        logoutAdmin
    );
}

document.addEventListener(
    "keydown",
    event => {
        if (event.key === "Escape") {
            closeModal();
        }
    }
);

if (
    adminToken &&
    adminRole === "admin"
) {
    setupProfileMenu();
    loadProducts();
    loadOrderCount();
}