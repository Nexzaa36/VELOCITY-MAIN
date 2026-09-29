const EXCHANGE_NAME =
    "velocity.events";


// ========================================
// ORDER CREATED
// ========================================

const ORDER_CREATED_QUEUE =
    "velocity.order.created";

const ORDER_CREATED_ROUTING_KEY =
    "order.created";


// ========================================
// INVENTORY
// ========================================

const INVENTORY_ORDER_CREATED_QUEUE =
    "velocity.inventory.order.created";

const INVENTORY_ORDER_CREATED_ROUTING_KEY =
    "order.created";


// ========================================
// INVENTORY RESERVED
// ========================================

const INVENTORY_RESERVED_ROUTING_KEY =
    "inventory.reserved";

const INVENTORY_RESERVED_QUEUE =
    "velocity.order.inventory.reserved";

const INVENTORY_RESERVED_ORDER_ROUTING_KEY =
    "inventory.reserved";


// ========================================
// INVENTORY RELEASED
// ========================================

const INVENTORY_RELEASED_ROUTING_KEY =
    "inventory.released";


// ========================================
// PAYMENT
// ========================================

const PAYMENT_INVENTORY_RESERVED_QUEUE =
    "velocity.payment.inventory.reserved";

const PAYMENT_INVENTORY_RESERVED_ROUTING_KEY =
    "inventory.reserved";


// ========================================
// PAYMENT PROCESSED
// ========================================

const PAYMENT_PROCESSED_ROUTING_KEY =
    "payment.processed";

const PAYMENT_PROCESSED_QUEUE =
    "velocity.order.payment.processed";


// ========================================
// PAYMENT FAILED
// ========================================

const PAYMENT_FAILED_ROUTING_KEY =
    "payment.failed";

const PAYMENT_FAILED_QUEUE =
    "velocity.order.payment.failed";

const PAYMENT_FAILED_ORDER_ROUTING_KEY =
    "payment.failed";


// ========================================
// EXPORT
// ========================================

module.exports = {

    EXCHANGE_NAME,


    // ORDER CREATED

    ORDER_CREATED_QUEUE,

    ORDER_CREATED_ROUTING_KEY,


    // INVENTORY

    INVENTORY_ORDER_CREATED_QUEUE,

    INVENTORY_ORDER_CREATED_ROUTING_KEY,


    // INVENTORY RESERVED

    INVENTORY_RESERVED_ROUTING_KEY,

    INVENTORY_RESERVED_QUEUE,

    INVENTORY_RESERVED_ORDER_ROUTING_KEY,


    // INVENTORY RELEASED

    INVENTORY_RELEASED_ROUTING_KEY,


    // PAYMENT

    PAYMENT_INVENTORY_RESERVED_QUEUE,

    PAYMENT_INVENTORY_RESERVED_ROUTING_KEY,


    // PAYMENT PROCESSED

    PAYMENT_PROCESSED_QUEUE,

    PAYMENT_PROCESSED_ROUTING_KEY,


    // PAYMENT FAILED

    PAYMENT_FAILED_QUEUE,

    PAYMENT_FAILED_ROUTING_KEY,

    PAYMENT_FAILED_ORDER_ROUTING_KEY

};