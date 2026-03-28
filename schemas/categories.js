let mongoose = require('mongoose');
let categorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "name khong duoc null"],
            unique: true
        },
        slug: {
            type: String,
            required: true
        },
        image: {
            type: String,
            default: "https://placeimg.com/640/480/any"
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)


module.exports = new mongoose.model('category', categorySchema)