var express = require("express");
var router = express.Router();
let { uploadImage, uploadExcel } = require('../utils/uploadHandler')
let exceljs = require('exceljs')
let path = require('path')
let categoriesModel = require('../schemas/categories')
let productModel = require('../schemas/products')
let inventoryModel = require('../schemas/inventories')
let mongoose = require('mongoose');
let slugify = require('slugify')
//client ->upload->save

router.post('/one_file', uploadImage.single('file'), function (req, res, next) {
    if (!req.file) {
        res.status(404).send({
            message: "file khong duoc de trong"
        })
    } else {
        res.send({
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        })
    }
})
router.get('/:filename', function (req, res, next) {
    let pathFile = path.join(__dirname, '../uploads', req.params.filename)
    res.sendFile(pathFile)
})

router.post('/multiple_files', uploadImage.array('files'), function (req, res, next) {
    if (!req.files) {
        res.status(404).send({
            message: "file khong duoc de trong"
        })
    } else {
        res.send(req.files.map(f => {
            return {
                filename: f.filename,
                path: f.path,
                size: f.size
            }
        }))
    }
})


router.post('/excel', uploadExcel.single('file'), async function (req, res, next) {
    if (!req.file) {
        res.status(404).send({
            message: "file khong duoc de trong"
        })
    } else {
        //workbook->worksheet->row/column->cell
        let workbook = new exceljs.Workbook();
        let pathFile = path.join(__dirname, '../uploads', req.file.filename)
        await workbook.xlsx.readFile(pathFile)
        let worksheet = workbook.worksheets[0];
        let categories = await categoriesModel.find({});
        let categoriesMap = new Map();
        for (const category of categories) {
            categoriesMap.set(category.name, category._id)
        }
        let products = await productModel.find({});
        let getTitle = products.map(p => p.title)
        let getSku = products.map(p => p.sku)
        //Map key->value
        let result = []
        for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
            let errorsInRow = [];
            const row = worksheet.getRow(rowIndex);
            let sku = row.getCell(1).value
            let title = row.getCell(2).value
            let category = row.getCell(3).value
            let price = Number.parseInt(row.getCell(4).value)
            let stock = Number.parseInt(row.getCell(5).value)
            if (price < 0 || isNaN(price)) {
                errorsInRow.push("price la so duong")
            }
            if (stock < 0 || isNaN(stock)) {
                errorsInRow.push("stock la so duong")
            }
            if (!categoriesMap.has(category)) {
                errorsInRow.push("category khong hop le")
            }
            if (getTitle.includes(title)) {
                errorsInRow.push("title khong duoc trung")
            }
            if (getSku.includes(sku)) {
                errorsInRow.push("sku khong duoc trung")
            }
            if (errorsInRow.length > 0) {
                result.push(errorsInRow);
                continue
            }
            let session = await mongoose.startSession()
            session.startTransaction()
            try {
                let newProduct = new productModel({
                    sku: sku,
                    title: title,
                    slug: slugify(title, {
                        replacement: '-',
                        remove: undefined,
                        lower: true
                    }),
                    price: price,
                    description: title,
                    category: categoriesMap.get(category)
                })
                await newProduct.save({ session })
                let newInventory = new inventoryModel({
                    product: newProduct._id,
                    stock: stock
                })
                await newInventory.save({ session });
                await newInventory.populate('product')
                await session.commitTransaction();
                await session.endSession()
                getTitle.push(title);
                getSku.push(sku)
                result.push(newInventory)
            } catch (error) {
                await session.abortTransaction();
                await session.endSession()
                result.push(error.message)
            }
        }
        res.send(result)
    }
})

module.exports = router;