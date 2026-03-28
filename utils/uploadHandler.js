let multer = require('multer')
let path = require('path')
//luu o dau? ten la gi
let storageSetting = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname);
        let filename = Date.now() + '-' + Math.round(Math.random() * 1000_000_000) + ext
        cb(null, filename)
    }
})
let filterImage = function (req, file, cb) {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('file sai dinh dang'));
    }
}
let filterExcel = function (req, file, cb) {
    if (file.mimetype.includes('spreadsheetml')) {
        cb(null, true);
    } else {
        cb(new Error('file sai dinh dang'));
    }
}
module.exports = {
    uploadImage: multer({
        storage: storageSetting,
        limits: 5 * 1024 * 1024,
        fileFilter: filterImage
    }),
    uploadExcel: multer({
        storage: storageSetting,
        limits: 5 * 1024 * 1024,
        fileFilter: filterExcel
    })
}