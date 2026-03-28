let express = require('express');
let router = express.Router()
const { CheckLogin } = require('../utils/authHandler');
let cartModel = require('../schemas/carts')
let inventoryModel = require('../schemas/inventories')
//get
router.get('/', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user._id
    })
    res.send(cart.products)
})
//add
router.post('/add', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user._id
    })
    let products = cart.products;
    let productID = req.body.product;
    let checkProduct = await inventoryModel.findOne({
        product: productID
    })
    if (!checkProduct) {
        res.status(404).send({
            message: "san pham khong ton tai"
        })
        return;
    }
    let index = products.findIndex(function (p) {
        return p.product == productID
    })
    if (index < 0) {
        products.push({
            product: productID,
            quantity: 1
        })
    } else {
        products[index].quantity += 1
    }
    await cart.save();
    res.send(cart)
})
//remove
router.post('/remove', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user._id
    })
    let products = cart.products;
    let productID = req.body.product;
    let checkProduct = await inventoryModel.findOne({
        product: productID
    })
    if (!checkProduct) {
        res.status(404).send({
            message: "san pham khong ton tai"
        })
        return;
    }
    let index = products.findIndex(function (p) {
        return p.product == productID
    })
    if (index < 0) {
        res.status(404).send({
            message: "san pham khong ton tai trong gio hang"
        })
    } else {
        products.splice(index, 1)
    }
    await cart.save();
    res.send(cart)
})
//decrease
router.post('/decrease', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user._id
    })
    let products = cart.products;
    let productID = req.body.product;
    let checkProduct = await inventoryModel.findOne({
        product: productID
    })
    if (!checkProduct) {
        res.status(404).send({
            message: "san pham khong ton tai"
        })
        return;
    }
    let index = products.findIndex(function (p) {
        return p.product == productID
    })
    if (index < 0) {
        res.status(404).send({
            message: "san pham khong ton tai trong gio hang"
        })
    } else {
        if (products[index].quantity == 1) {
            products.splice(index, 1)
        } else {
            products[index].quantity -= 1
        }
    }
    await cart.save();
    res.send(cart)
})
//modify
router.post('/modify', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let cart = await cartModel.findOne({
        user: user._id
    })
    let products = cart.products;
    let productID = req.body.product;
    let quantity = req.body.quantity;
    let checkProduct = await inventoryModel.findOne({
        product: productID
    })
    if (!checkProduct) {
        res.status(404).send({
            message: "san pham khong ton tai"
        })
        return;
    }
    let index = products.findIndex(function (p) {
        return p.product == productID
    })
    if (index < 0) {
        res.status(404).send({
            message: "san pham khong ton tai trong gio hang"
        })
    } else {
        if (quantity == 0) {
            products.splice(index, 1)
        } else {
            products[index].quantity = quantity;
        }
    }
    await cart.save();
    res.send(cart)
})
module.exports = router