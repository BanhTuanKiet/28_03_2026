let { body, validationResult } = require('express-validator')
module.exports = {
    validatedResult: function (req, res, next) {
        let result = validationResult(req);
        if (result.errors.length > 0) {
            res.status(404).send(result.errors.map(
                function (e) {
                    return {
                        [e.path]: e.msg
                    }
                }
            ))
            return;
        }
        next()
    },
    CreateAnUserValidator: [
        body('email').notEmpty().withMessage("email khong duoc de trong").bail().isEmail().withMessage("email sai dinh dang"),
        body('username').notEmpty().withMessage("username khong duoc de trong").bail().isAlphanumeric().withMessage("username khong duoc chua ki tu dac biet"),
        body('password').notEmpty().withMessage("password khong duoc de trong").bail().isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1
        }).withMessage("password phai co it nhat 8 ki tu trong do co it nhat: 1 ki tu hoa, 1 ki tu thuong, 1 ki tu dac biet va 1 ki tu so"),
        body('role').notEmpty().withMessage("role khong duoc de trong").bail().isMongoId().withMessage("role phai la ID"),
        body('avatarUrl').optional().isArray().withMessage("hinh anh khong hop le"),
        body('avatarUrl.*').optional().isURL().withMessage("URL khong hop le")
    ],ChangePasswordValidator: [
        body('oldpassword').notEmpty().withMessage("password khong duoc de trong"),
        body('newpassword').notEmpty().withMessage("password khong duoc de trong").bail().isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1
        }).withMessage("password phai co it nhat 8 ki tu trong do co it nhat: 1 ki tu hoa, 1 ki tu thuong, 1 ki tu dac biet va 1 ki tu so")
    ],
    ModifyAnUserValidator: [
        body('email').optional().isEmail().withMessage("email sai dinh dang"),
        body('username').isEmpty().withMessage("username khong duoc cap nhat"),
        body('_id').isEmpty().withMessage("_id khong duoc cap nhat"),
        body('password').notEmpty().withMessage("password khong duoc de trong").bail().isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1
        }).withMessage("password phai co it nhat 8 ki tu trong do co it nhat: 1 ki tu hoa, 1 ki tu thuong, 1 ki tu dac biet va 1 ki tu so"),
        body('role').optional().isMongoId().withMessage("role phai la ID"),
        body('avatarUrl').optional().isArray().withMessage("hinh anh khong hop le"),
        body('avatarUrl.*').optional().isURL().withMessage("URL khong hop le")
    ],
}