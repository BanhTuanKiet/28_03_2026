let userController = require('../controllers/users')
let jwt = require('jsonwebtoken')
module.exports = {
    CheckLogin: async function (req, res, next) {
        try {
            let token = req.headers.authorization;
            if (!token || !token.startsWith("Bearer")) {
                if (req.cookies.TOKEN_LOGIN_NNPTUD_C4) {
                    token = req.cookies.TOKEN_LOGIN_NNPTUD_C4;
                } else {
                    res.status(404).send({
                        message: "ban chua dang nhap"
                    })
                    return;
                }
            } else {
                token = token.split(" ")[1]
            }
            let result = jwt.verify(token, "secret")
            if (result.exp * 1000 < Date.now()) {
                res.status(404).send({
                    message: "ban chua dang nhap"
                })
                return;
            }
            let user = await userController.GetAnUserById(result.id);
            if (!user) {
                res.status(404).send({
                    message: "ban chua dang nhap"
                })
                return;
            }
            req.user = user;
            next()
        } catch (error) {
            res.status(404).send({
                message: "ban chua dang nhap"
            })
        }
    },
    CheckRole: function (...requiredRole) {
        return function (req, res, next) {
            let currentRole = req.user.role.name;
            if (requiredRole.includes(currentRole)) {
                next()
                return;
            }
            res.status(403).send({
                message: "Ban khong co quyen"
            })
        }
    }

}