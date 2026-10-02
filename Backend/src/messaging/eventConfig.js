const EXCHANGE_NAME =
    "velocity.events";


// ========================================
// RETRY / DLQ CONFIGURATION
// ========================================

const RETRY_EXCHANGE_NAME =
    "velocity.retry";

const DLQ_EXCHANGE_NAME =
    "velocity.dlq";

const RETRY_DELAY =
    5000;

const MAX_RETRIES =
    3;


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


const INVENTORY_RESERVED_ROUTING_KEY =
    "inventory.reserved";

const INVENTORY_RESERVED_QUEUE =
    "velocity.order.inventory.reserved";

const INVENTORY_RESERVED_ORDER_ROUTING_KEY =
    "inventory.reserved";


// ========================================
// PAYMENT
// ========================================

const PAYMENT_INVENTORY_RESERVED_QUEUE =
    "velocity.payment.inventory.reserved";

const PAYMENT_INVENTORY_RESERVED_ROUTING_KEY =
    "inventory.reserved";


const PAYMENT_PROCESSED_ROUTING_KEY =
    "payment.processed";

const PAYMENT_PROCESSED_QUEUE =
    "velocity.order.payment.processed";


const PAYMENT_FAILED_ROUTING_KEY =
    "payment.failed";

const PAYMENT_FAILED_QUEUE =
    "velocity.order.payment.failed";

const PAYMENT_FAILED_ORDER_ROUTING_KEY =
    "payment.failed";


// ========================================
// INVENTORY COMPENSATION
// ========================================

const INVENTORY_PAYMENT_FAILED_QUEUE =
    "velocity.inventory.payment.failed";

const INVENTORY_RELEASED_ROUTING_KEY =
    "inventory.released";


// ========================================
// NOTIFICATIONS
// ========================================

const NOTIFICATION_QUEUE =
    "velocity.notification";

const NOTIFICATION_PAYMENT_PROCESSED_ROUTING_KEY =
    "payment.processed";

const NOTIFICATION_PAYMENT_FAILED_ROUTING_KEY =
    "payment.failed";

const NOTIFICATION_ORDER_CANCELLED_ROUTING_KEY =
    "order.cancelled";


// ========================================
// EXPORTS
// ========================================

module.exports = {

    EXCHANGE_NAME,

    RETRY_EXCHANGE_NAME,

    DLQ_EXCHANGE_NAME,

    RETRY_DELAY,

    MAX_RETRIES,


    ORDER_CREATED_QUEUE,

    ORDER_CREATED_ROUTING_KEY,


    INVENTORY_ORDER_CREATED_QUEUE,

    INVENTORY_ORDER_CREATED_ROUTING_KEY,


    INVENTORY_RESERVED_ROUTING_KEY,

    INVENTORY_RESERVED_QUEUE,

    INVENTORY_RESERVED_ORDER_ROUTING_KEY,


    PAYMENT_INVENTORY_RESERVED_QUEUE,

    PAYMENT_INVENTORY_RESERVED_ROUTING_KEY,


    PAYMENT_PROCESSED_QUEUE,

    PAYMENT_PROCESSED_ROUTING_KEY,


    PAYMENT_FAILED_QUEUE,

    PAYMENT_FAILED_ROUTING_KEY,

    PAYMENT_FAILED_ORDER_ROUTING_KEY,


    INVENTORY_PAYMENT_FAILED_QUEUE,

    INVENTORY_RELEASED_ROUTING_KEY,


    NOTIFICATION_QUEUE,

    NOTIFICATION_PAYMENT_PROCESSED_ROUTING_KEY,

    NOTIFICATION_PAYMENT_FAILED_ROUTING_KEY,

    NOTIFICATION_ORDER_CANCELLED_ROUTING_KEY

};