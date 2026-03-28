let mongoose = require('mongoose');
let productsSchema = mongoose.Schema({
    sku: {
        type: String,
        required: [true, "title khong duoic rong"],
        unique: true
    },
    title: {
        type: String,
        required: [true, "title khong duoic rong"],
        unique: true
    }, slug: {
        type: String,
        required: [true, "slug khong duoic rong"],
        unique: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        default: ""
    },
    images: {
        type: [String],
        default: ["https://i.imgur.com/R3iobJA.jpeg"]
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'category',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
module.exports = new mongoose.model('product', productsSchema)