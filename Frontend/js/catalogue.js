// ======================================
// RUNFOLD 2.0
// PHASE 3
// ADVANCED PRODUCT DISCOVERY
// ======================================


// ======================================
// PRODUCT DATA
// ======================================

// ======================================
// PRODUCT DATA
// ======================================


let products = [];


// ======================================
// LOAD PRODUCTS FROM BACKEND
// ======================================

async function loadProducts() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/products`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP error: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data.success ||
            !Array.isArray(data.products)
        ) {

            throw new Error(
                "Invalid product data received from backend."
            );

        }


        /*
         * Convert MongoDB products into the
         * same structure expected by the
         * existing catalogue code.
         */

        products =
            data.products.map(
                product => ({

                    // Frontend/product ID
                    id: Number(product.id),

                    // MongoDB ObjectId
                    productId: product._id,

                    name: product.name,

                    price: Number(product.price),

                    category: product.category,

                    image: product.image,

                    tags:
                        Array.isArray(product.tags)
                            ? product.tags
                            : [],

                    sizes:
                        Array.isArray(product.sizes)
                            ? product.sizes
                            : [],

                    stock:
                        Number(product.stock) || 0

                })
            );


        console.log(
            `✅ Loaded ${products.length} products from backend`
        );


        currentProductList =
            [...products];


        renderProducts(
            currentProductList
        );


        renderRecentlyViewed();


        updateProductCount(
            products.length
        );


        updateFilterStatus(
            products
        );

    } catch (error) {

        console.error(
            "❌ Failed to load products:",
            error
        );


        if (productGrid) {

            productGrid.innerHTML = `

                <div class="no-products">

                    <span class="eyebrow">
                        CONNECTION ERROR
                    </span>


                    <h3>
                        Products could not be loaded.
                    </h3>


                    <p>
                        Please make sure the
                        VELOCITY backend server
                        is running.
                    </p>


                    <button
                        type="button"
                        class="reset-results-button"
                        onclick="loadProducts()"
                    >

                        TRY AGAIN

                    </button>

                </div>

            `;

        }

    }

}


// ======================================
// DOM ELEMENTS
// ======================================

const productGrid =
    document.getElementById(
        "product-grid"
    );


const search =
    document.getElementById(
        "product-search"
    );


const discoveryFilters =
    document.querySelectorAll(
        ".discovery-filter"
    );


const discoveryCount =
    document.getElementById(
        "discovery-count"
    );


const categoryFilter =
    document.getElementById(
        "category-filter"
    );


const priceFilter =
    document.getElementById(
        "price-filter"
    );


const sizeFilter =
    document.getElementById(
        "size-filter"
    );


const clearFiltersButton =
    document.getElementById(
        "clear-filters"
    );


const activeFilterStatus =
    document.getElementById(
        "active-filter-status"
    );


const recentlyViewedSection =
    document.getElementById(
        "recently-viewed-section"
    );


const recentlyViewedGrid =
    document.getElementById(
        "recently-viewed-grid"
    );


const clearRecentlyViewedButton =
    document.getElementById(
        "clear-recently-viewed"
    );


// ======================================
// PAGINATION
// ======================================

const PRODUCTS_PER_PAGE = 9;

let currentPage = 1;

let currentProductList = [...products];

let paginationContainer = null;


// ======================================
// ACTIVE FILTER
// ======================================

let activeFilter = "all";


// ======================================
// RECENTLY VIEWED STORAGE
// ======================================

const RECENTLY_VIEWED_KEY =
    "runfold_recently_viewed";


let recentlyViewed = [];


try {

    recentlyViewed =
        JSON.parse(
            localStorage.getItem(
                RECENTLY_VIEWED_KEY
            )
        ) || [];

} catch (error) {

    recentlyViewed = [];

}


// ======================================
// CURRENCY
// ======================================

function formatCurrency(price) {

    return `₹${price.toLocaleString("en-IN")}`;

}


// ======================================
// CREATE PAGINATION CONTAINER
// ======================================

function createPaginationContainer() {

    if (paginationContainer) {

        return paginationContainer;

    }


    paginationContainer =
        document.createElement(
            "div"
        );


    paginationContainer.id =
        "catalogue-pagination";


    paginationContainer.className =
        "catalogue-pagination";


    if (productGrid) {

        productGrid.parentNode.insertBefore(
            paginationContainer,
            productGrid.nextSibling
        );

    }


    return paginationContainer;

}


// ======================================
// SAVE RECENTLY VIEWED
// ======================================

function saveRecentlyViewed() {

    localStorage.setItem(
        RECENTLY_VIEWED_KEY,
        JSON.stringify(
            recentlyViewed
        )
    );

}


// ======================================
// ADD RECENTLY VIEWED PRODUCT
// ======================================

function addRecentlyViewed(productId) {

    recentlyViewed =
        recentlyViewed.filter(
            id =>
                Number(id) !==
                Number(productId)
        );


    recentlyViewed.unshift(
        Number(productId)
    );


    recentlyViewed =
        recentlyViewed.slice(
            0,
            4
        );


    saveRecentlyViewed();

    renderRecentlyViewed();

}


// ======================================
// RENDER RECENTLY VIEWED
// ======================================

function renderRecentlyViewed() {

    if (
        !recentlyViewedSection ||
        !recentlyViewedGrid
    ) {

        return;

    }


    const viewedProducts =
        recentlyViewed
            .map(
                id =>
                    products.find(
                        product =>
                            product.id ===
                            Number(id)
                    )
            )
            .filter(Boolean);


    if (
        viewedProducts.length === 0
    ) {

        recentlyViewedSection.style.display =
            "none";

        recentlyViewedGrid.innerHTML =
            "";

        return;

    }


    recentlyViewedSection.style.display =
        "block";


    recentlyViewedGrid.innerHTML =
        "";


    viewedProducts.forEach(
        product => {

            const card =
                document.createElement(
                    "button"
                );


            card.type =
                "button";


            card.className =
                "recent-product";


            card.innerHTML = `

                <div class="recent-product-image">

                    <img
                        src="${product.image}"
                        alt="${product.name}"
                        loading="lazy"
                    >

                </div>


                <div class="recent-product-info">

                    <span>
                        ${product.category}
                    </span>


                    <strong>
                        ${product.name}
                    </strong>


                    <small>
                        ${formatCurrency(product.price)}
                    </small>

                </div>

            `;


            card.addEventListener(
                "click",
                function () {

                    openQuickView(
                        product
                    );

                }
            );


            recentlyViewedGrid.appendChild(
                card
            );

        }
    );

}


// ======================================
// UPDATE ACTIVE FILTER STATUS
// ======================================

function updateFilterStatus(
    filteredProducts
) {

    if (!activeFilterStatus) {
        return;
    }


    const activeParts = [];


    if (
        activeFilter !== "all"
    ) {

        activeParts.push(
            activeFilter
        );

    }


    if (
        categoryFilter &&
        categoryFilter.value !== "all"
    ) {

        activeParts.push(
            categoryFilter.value
        );

    }


    if (
        priceFilter &&
        priceFilter.value !== "all"
    ) {

        const labels = {

            "under-2000":
                "under ₹2,000",

            "2000-4000":
                "₹2,000 – ₹4,000",

            "4000-6000":
                "₹4,000 – ₹6,000",

            "over-6000":
                "above ₹6,000"

        };


        activeParts.push(
            labels[
            priceFilter.value
            ]
        );

    }


    if (
        sizeFilter &&
        sizeFilter.value !== "all"
    ) {

        activeParts.push(
            `size ${sizeFilter.value}`
        );

    }


    const searchTerm =
        search
            ? search.value.trim()
            : "";


    if (searchTerm) {

        activeParts.push(
            `"${searchTerm}"`
        );

    }


    if (
        activeParts.length === 0
    ) {

        activeFilterStatus.innerHTML = `

            <span>
                Showing all products
            </span>

        `;

        return;

    }


    activeFilterStatus.innerHTML = `

        <span>

            Showing

            <strong>
                ${filteredProducts.length}
            </strong>

            ${filteredProducts.length === 1
            ? "product"
            : "products"
        }

            ·

            ${activeParts.join(" · ")}

        </span>

    `;

}


// ======================================
// UPDATE PRODUCT COUNT
// ======================================

function updateProductCount(
    count
) {

    if (!discoveryCount) {
        return;
    }


    discoveryCount.classList.add(
        "count-changing"
    );


    setTimeout(
        () => {

            discoveryCount.textContent =
                `${count} ${count === 1
                    ? "product"
                    : "products"
                }`;

        },
        80
    );


    setTimeout(
        () => {

            discoveryCount.classList.remove(
                "count-changing"
            );

        },
        300
    );

}


// ======================================
// PRICE FILTER MATCH
// ======================================

function matchesPrice(
    product
) {

    if (
        !priceFilter ||
        priceFilter.value === "all"
    ) {

        return true;

    }


    const price =
        product.price;


    switch (
    priceFilter.value
    ) {

        case "under-2000":

            return price < 2000;


        case "2000-4000":

            return (
                price >= 2000 &&
                price <= 4000
            );


        case "4000-6000":

            return (
                price >= 4000 &&
                price <= 6000
            );


        case "over-6000":

            return price > 6000;


        default:

            return true;

    }

}


// ======================================
// SIZE FILTER MATCH
// ======================================

function matchesSize(
    product
) {

    if (
        !sizeFilter ||
        sizeFilter.value === "all"
    ) {

        return true;

    }


    if (
        product.category !== "Footwear"
    ) {

        return false;

    }


    return (
        product.sizes &&
        product.sizes.includes(
            sizeFilter.value
        )
    );

}


// ======================================
// FILTER PRODUCTS
// ======================================

function filterProducts() {

    const searchTerm =
        search
            ? search.value
                .toLowerCase()
                .trim()
            : "";


    const filtered =
        products.filter(
            product => {


                const matchesSearch =

                    !searchTerm

                    ||

                    product.name
                        .toLowerCase()
                        .includes(
                            searchTerm
                        )

                    ||

                    product.category
                        .toLowerCase()
                        .includes(
                            searchTerm
                        )

                    ||

                    (
                        product.tags &&
                        product.tags.some(
                            tag =>
                                tag
                                    .toLowerCase()
                                    .includes(
                                        searchTerm
                                    )
                        )
                    );


                const matchesDiscovery =

                    activeFilter === "all"

                    ||

                    (
                        product.tags &&
                        product.tags.includes(
                            activeFilter
                        )
                    );


                const matchesCategory =

                    !categoryFilter

                    ||

                    categoryFilter.value ===
                    "all"

                    ||

                    product.category ===
                    categoryFilter.value;


                const matchesPriceFilter =
                    matchesPrice(
                        product
                    );


                const matchesSizeFilter =
                    matchesSize(
                        product
                    );


                return (

                    matchesSearch &&

                    matchesDiscovery &&

                    matchesCategory &&

                    matchesPriceFilter &&

                    matchesSizeFilter

                );

            }
        );


    currentProductList =
        filtered;


    currentPage = 1;


    updateProductCount(
        filtered.length
    );


    updateFilterStatus(
        filtered
    );


    renderProducts(
        filtered
    );

}


// ======================================
// RENDER PAGINATION
// ======================================

function renderPagination(
    productList
) {

    const pagination =
        createPaginationContainer();


    const totalPages =
        Math.ceil(
            productList.length /
            PRODUCTS_PER_PAGE
        );


    /*
     * If there is only one page,
     * there is nothing to paginate.
     */

    if (
        totalPages <= 1
    ) {

        pagination.innerHTML =
            "";

        pagination.style.display =
            "none";

        return;

    }


    pagination.style.display =
        "flex";


    pagination.innerHTML = `

        <button
            type="button"
            class="pagination-btn pagination-prev"
            ${currentPage === 1 ? "disabled" : ""}
        >

            <span class="pagination-arrow">
                ←
            </span>

            <span>
                PREV
            </span>

        </button>


        <div class="pagination-status">

            <span class="pagination-current">
                ${String(currentPage).padStart(2, "0")}
            </span>

            <span class="pagination-divider">
                /
            </span>

            <span class="pagination-total">
                ${String(totalPages).padStart(2, "0")}
            </span>

        </div>


        <button
            type="button"
            class="pagination-btn pagination-next"
            ${currentPage === totalPages ? "disabled" : ""}
        >

            <span>
                NEXT
            </span>

            <span class="pagination-arrow">
                →
            </span>

        </button>

    `;


    const previousButton =
        pagination.querySelector(
            ".pagination-prev"
        );


    const nextButton =
        pagination.querySelector(
            ".pagination-next"
        );


    previousButton.addEventListener(
        "click",
        function () {

            if (
                currentPage <= 1
            ) {

                return;

            }


            currentPage--;


            renderProducts(
                currentProductList
            );


            scrollToProductGrid();

        }
    );


    nextButton.addEventListener(
        "click",
        function () {

            if (
                currentPage >= totalPages
            ) {

                return;

            }


            currentPage++;


            renderProducts(
                currentProductList
            );


            scrollToProductGrid();

        }
    );

}


// ======================================
// SCROLL TO PRODUCT GRID
// ======================================

function scrollToProductGrid() {

    if (!productGrid) {
        return;
    }


    const gridTop =
        productGrid.getBoundingClientRect().top +
        window.scrollY -
        120;


    window.scrollTo({

        top: gridTop,

        behavior: "smooth"

    });

}


// ======================================
// RENDER PRODUCTS
// ======================================

function renderProducts(
    productList
) {

    if (!productGrid) {

        console.error(
            "Product grid not found."
        );

        return;

    }


    productGrid.innerHTML =
        "";


    /*
     * ====================================
     * NO RESULTS
     * ====================================
     */

    if (
        productList.length === 0
    ) {

        productGrid.innerHTML = `

            <div class="no-products">

                <span class="eyebrow">
                    NO MATCHES
                </span>


                <h3>
                    Nothing here yet.
                </h3>


                <p>
                    Try changing your filters
                    or search for something else.
                </p>


                <button
                    type="button"
                    class="reset-results-button"
                    id="reset-results-button"
                >

                    RESET FILTERS

                </button>

            </div>

        `;


        const resetButton =
            document.getElementById(
                "reset-results-button"
            );


        if (resetButton) {

            resetButton.addEventListener(
                "click",
                resetAllFilters
            );

        }


        renderPagination(
            productList
        );


        return;

    }


    /*
     * ====================================
     * PAGINATION CALCULATION
     * ====================================
     */

    const totalPages =
        Math.ceil(
            productList.length /
            PRODUCTS_PER_PAGE
        );


    if (
        currentPage > totalPages
    ) {

        currentPage =
            totalPages;

    }


    const startIndex =
        (
            currentPage - 1
        ) *
        PRODUCTS_PER_PAGE;


    const endIndex =
        startIndex +
        PRODUCTS_PER_PAGE;


    const productsForPage =
        productList.slice(
            startIndex,
            endIndex
        );


    /*
     * ====================================
     * CREATE PRODUCT CARDS
     * ====================================
     */

    productsForPage.forEach(
        (
            product,
            index
        ) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "product-card";


            card.innerHTML = `

                <div class="product-image">

                    <div class="product-glow"></div>


                    <div class="product-mark">

                        <img
                            src="${product.image}"
                            alt="${product.name}"
                            loading="lazy"
                            onerror="
                                this.style.display='none';
                                this.parentElement.classList.add('image-error');
                            "
                        >

                    </div>


                    <button
                        type="button"
                        class="quick-view"
                        data-product-id="${product.id}"
                    >

                        QUICK VIEW

                    </button>

                </div>


                <div class="product-info">

                    <span class="eyebrow">
                        ${product.category}
                    </span>


                    <h3>
                        ${product.name}
                    </h3>


                    <div class="product-price">

                        ${formatCurrency(
                product.price
            )}

                    </div>
                    
                    <div class="stock-status ${product.stock === 0
                    ? "out-of-stock"
                    : product.stock <= 3
                        ? "low-stock"
                        : "in-stock"
                }">
    ${product.stock === 0
                    ? "OUT OF STOCK"
                    : product.stock <= 3
                        ? `ONLY ${product.stock} LEFT`
                        : `${product.stock} IN STOCK`
                }
</div>


                    ${product.category === "Footwear"
                    ? `

                                <div class="size-selector">

                                    <span>
                                        SELECT SIZE
                                    </span>


                                    <div class="sizes">

                                        ${product.sizes
                        .map(
                            size => `

                                                        <button
                                                            type="button"
                                                            data-size="${size}"
                                                        >

                                                            ${size}

                                                        </button>

                                                    `
                        )
                        .join("")
                    }

                                    </div>

                                </div>

                            `
                    : ""
                }


                    <button
                        class="btn btn-primary full-width add-cart-btn"
                        type="button" ${product.stock === 0 ? "disabled" : ""}
                    >

                        <span>
                            ${product.stock === 0 ? "OUT OF STOCK" : "ADD TO CART"}
                        </span>


                        <span class="cart-arrow">
                            →
                        </span>

                    </button>

                </div>

            `;


            productGrid.appendChild(
                card
            );


            /*
             * ==================================
             * ENTRANCE ANIMATION
             * ==================================
             */

            setTimeout(
                () => {

                    card.classList.add(
                        "product-card-visible"
                    );

                },
                index * 55
            );


            /*
             * ==================================
             * SIZE SELECTION
             * ==================================
             */

            const sizeButtons =
                card.querySelectorAll(
                    ".sizes button"
                );


            sizeButtons.forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function () {

                            sizeButtons.forEach(
                                btn => {

                                    btn.classList.remove(
                                        "selected"
                                    );

                                }
                            );


                            this.classList.add(
                                "selected"
                            );

                        }
                    );

                }
            );


            /*
             * ==================================
             * ADD TO CART
             * ==================================
             */

            const addCartButton =
                card.querySelector(
                    ".add-cart-btn"
                );


            if (addCartButton) {

                addCartButton.addEventListener(
                    "click",
                    function () {

                        handleAddToCart(
                            product.id,
                            this
                        );

                    }
                );

            }


            /*
             * ==================================
             * QUICK VIEW
             * ==================================
             */

            const quickViewButton =
                card.querySelector(
                    ".quick-view"
                );


            if (quickViewButton) {

                quickViewButton.addEventListener(
                    "click",
                    function () {

                        const productId =
                            Number(
                                this.dataset.productId
                            );


                        const selectedProduct =
                            products.find(
                                item =>
                                    item.id ===
                                    productId
                            );


                        if (!selectedProduct) {
                            return;
                        }


                        openQuickView(
                            selectedProduct
                        );

                    }
                );

            }

        }
    );


    /*
     * ====================================
     * PAGINATION
     * ====================================
     */

    renderPagination(
        productList
    );

}


// ======================================
// ADD TO CART
// ======================================

function handleAddToCart(
    productId,
    button
) {

    const product =
        products.find(
            item =>
                item.id === productId
        );


    if (!product) {
        return;
    }
    if (product.stock <= 0) {
        return;
    }


    const card =
        button.closest(
            ".product-card"
        );


    const selectedSize =
        card
            ? card.querySelector(
                ".sizes .selected"
            )
            : null;


    /*
     * ==================================
     * SIZE REQUIRED
     * ==================================
     */

    if (
        product.category === "Footwear" &&
        !selectedSize
    ) {

        if (card) {

            card.classList.add(
                "size-required"
            );


            setTimeout(
                () => {

                    card.classList.remove(
                        "size-required"
                    );

                },
                700
            );

        }


        return;

    }


    /*
     * ==================================
     * CART PRODUCT
     * ==================================
     */

    const productForCart = {

        ...product,

        size:
            selectedSize
                ? selectedSize.dataset.size
                : null

    };


    addToCart(
        productForCart
    );


    /*
     * ==================================
     * FEEDBACK
     * ==================================
     */

    const originalHTML =
        button.innerHTML;


    button.classList.add(
        "added"
    );


    button.innerHTML = `

        <span>
            ADDED ✓
        </span>

    `;


    setTimeout(
        () => {

            button.classList.remove(
                "added"
            );


            button.innerHTML =
                originalHTML;

        },
        1200
    );

}


// ======================================
// RESET ALL FILTERS
// ======================================

function resetAllFilters() {

    activeFilter =
        "all";


    currentPage =
        1;


    if (search) {

        search.value =
            "";

    }


    if (categoryFilter) {

        categoryFilter.value =
            "all";

    }


    if (priceFilter) {

        priceFilter.value =
            "all";

    }


    if (sizeFilter) {

        sizeFilter.value =
            "all";

    }


    discoveryFilters.forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.filter ===
                "all"
            );

        }
    );


    filterProducts();

}


// ======================================
// SEARCH
// ======================================

if (search) {

    search.addEventListener(
        "input",
        function () {

            filterProducts();

        }
    );

}


// ======================================
// CATEGORY / PRICE / SIZE
// ======================================

[
    categoryFilter,
    priceFilter,
    sizeFilter
].forEach(
    filter => {

        if (!filter) {
            return;
        }


        filter.addEventListener(
            "change",
            function () {

                filterProducts();

            }
        );

    }
);


// ======================================
// RESET BUTTON
// ======================================

if (clearFiltersButton) {

    clearFiltersButton.addEventListener(
        "click",
        resetAllFilters
    );

}


// ======================================
// DISCOVERY FILTERS
// ======================================

discoveryFilters.forEach(
    filterButton => {

        filterButton.addEventListener(
            "click",
            function () {

                discoveryFilters.forEach(
                    button => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                activeFilter =
                    this.dataset.filter;


                currentPage =
                    1;


                filterProducts();


                setTimeout(
                    () => {

                        if (productGrid) {

                            productGrid.scrollIntoView({

                                behavior:
                                    "smooth",

                                block:
                                    "start"

                            });

                        }

                    },
                    100
                );

            }
        );

    }
);


// ======================================
// CLEAR RECENTLY VIEWED
// ======================================

if (
    clearRecentlyViewedButton
) {

    clearRecentlyViewedButton.addEventListener(
        "click",
        function () {

            recentlyViewed =
                [];


            saveRecentlyViewed();

            renderRecentlyViewed();

        }
    );

}


// ======================================
// QUICK VIEW
// ======================================

function openQuickView(
    product
) {

    addRecentlyViewed(
        product.id
    );


    const existing =
        document.querySelector(
            ".quick-view-modal"
        );


    if (existing) {

        existing.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "quick-view-modal";


    const sizeSelector =

        product.category === "Footwear"

            ? `

            <div class="quick-view-size-selector">

                <span>
                    SELECT SIZE
                </span>


                <div class="quick-view-sizes">

                    ${product.sizes
                .map(
                    size => `

                                    <button
                                        type="button"
                                        data-size="${size}"
                                    >

                                        ${size}

                                    </button>

                                `
                )
                .join("")
            }

                </div>

            </div>

        `

            : "";


    modal.innerHTML = `

        <div class="quick-view-backdrop"></div>


        <div
            class="quick-view-content"
            role="dialog"
            aria-modal="true"
            aria-label="${product.name}"
        >


            <button
                class="quick-view-close"
                type="button"
                aria-label="Close quick view"
            >

                ×

            </button>


            <div class="quick-view-visual">

                <div class="quick-view-product">

                    <img
                        src="${product.image}"
                        alt="${product.name}"
                        onerror="
                            this.style.display='none';
                            this.parentElement.classList.add('image-error');
                        "
                    >

                </div>

            </div>


            <div class="quick-view-details">

                <span class="eyebrow">
                    ${product.category}
                </span>


                <h2>
                    ${product.name}
                </h2>


                <div class="quick-view-price">

                    ${formatCurrency(
        product.price
    )}

                </div>


                <div class="quick-view-tags">

                    ${product.tags
            .map(
                tag => `

                                    <span>
                                        ${tag}
                                    </span>

                                `
            )
            .join("")
        }

                </div>


                <p>
                    Built for movement,
                    designed for everyday
                    performance.
                </p>


                ${sizeSelector}


                <button
                    class="btn btn-primary quick-view-cart"
                    type="button"
                >

                    ADD TO CART

                    <span>
                        →
                    </span>

                </button>


                <div
                    class="quick-view-message"
                    aria-live="polite"
                ></div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        modal.querySelector(
            ".quick-view-close"
        );


    const backdrop =
        modal.querySelector(
            ".quick-view-backdrop"
        );


    closeButton.addEventListener(
        "click",
        closeQuickView
    );


    backdrop.addEventListener(
        "click",
        closeQuickView
    );


    const handleEscape =
        event => {

            if (
                event.key === "Escape"
            ) {

                closeQuickView();

            }

        };


    document.addEventListener(
        "keydown",
        handleEscape
    );


    const quickViewSizes =
        modal.querySelectorAll(
            ".quick-view-sizes button"
        );


    quickViewSizes.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    quickViewSizes.forEach(
                        btn => {

                            btn.classList.remove(
                                "selected"
                            );

                        }
                    );


                    this.classList.add(
                        "selected"
                    );

                }
            );

        }
    );


    const quickViewCart =
        modal.querySelector(
            ".quick-view-cart"
        );


    quickViewCart.addEventListener(
        "click",
        () => {

            const selectedSize =
                modal.querySelector(
                    ".quick-view-sizes .selected"
                );


            if (
                product.category === "Footwear" &&
                !selectedSize
            ) {

                const message =
                    modal.querySelector(
                        ".quick-view-message"
                    );


                if (message) {

                    message.textContent =
                        "Please select a size.";

                }


                const sizeBox =
                    modal.querySelector(
                        ".quick-view-size-selector"
                    );


                if (sizeBox) {

                    sizeBox.classList.add(
                        "size-required"
                    );

                }


                setTimeout(
                    () => {

                        if (sizeBox) {

                            sizeBox.classList.remove(
                                "size-required"
                            );

                        }

                    },
                    700
                );


                return;

            }


            const productForCart = {

                ...product,

                size:
                    selectedSize
                        ? selectedSize.dataset.size
                        : null

            };


            addToCart(
                productForCart
            );


            quickViewCart.classList.add(
                "added"
            );


            quickViewCart.innerHTML = `

                ADDED ✓

            `;


            setTimeout(
                () => {

                    closeQuickView();

                },
                700
            );

        }
    );


    requestAnimationFrame(
        () => {

            modal.classList.add(
                "active"
            );

        }
    );


    function closeQuickView() {

        document.removeEventListener(
            "keydown",
            handleEscape
        );


        modal.classList.remove(
            "active"
        );


        setTimeout(
            () => {

                if (
                    modal &&
                    modal.parentNode
                ) {

                    modal.remove();

                }

            },
            200
        );

    }

}


// ======================================
// INITIAL LOAD
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    loadProducts
);