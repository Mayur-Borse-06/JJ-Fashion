const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    customer: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        default: "COD"
    },
    orderedAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["Placed", "Shipped", "Processing", "Delivered"],
        default: "Placed",
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false,
    }
})

module.exports = mongoose.model("Order", orderSchema);