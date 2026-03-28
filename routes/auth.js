let express = require('express');
let router = express.Router()
let userController = require('../controllers/users')
let bcrypt = require('bcrypt');
const { CheckLogin } = require('../utils/authHandler');
let jwt = require('jsonwebtoken');
const { ChangePasswordValidator, validatedResult } = require('../utils/validator');
let crypto = require('crypto')
let { sendMail } = require('../utils/mailHandler')
let cartModel = require('../schemas/carts');
let mongoose = require('mongoose')

router.post('/register', async function (req, res, next) {
    let session = await mongoose.startSession();
    session.startTransaction()
    try {
        let { username, password, email } = req.body;
        let newUser = await userController.CreateAnUser(username, password, email,
            "69b1265c33c5468d1c85aad8", session
        )
        let newCArt = new cartModel({
            user: newUser._id
        })
        await newCArt.save({ session });
        await newCArt.populate('user')
        await session.commitTransaction();
        await session.endSession()
        res.send(newCArt)
    } catch (error) {
        await session.abortTransaction();
        await session.endSession()
        res.status(404).send({
            message: error.message
        })
    }
})

router.post('/login', async function (req, res, next) {
    try {
        let { username, password } = req.body;
        let user = await userController.GetAnUserByUsername(username);
        if (!user) {
            res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
            return;
        }
        if (user.lockTime > Date.now()) {
            res.status(404).send({
                message: "ban dang bi ban"
            })
            return;
        }
        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;
            await user.save()
            //let priK = fs.readFileSync('privateKey.pem')
            let token = jwt.sign({
                id: user._id
            }, 'secret', {
                expiresIn: '1d'
            })
            res.cookie("TOKEN_LOGIN_NNPTUD_C4", token, {
                maxAge: 30 * 3600 * 24 * 1000,
                httpOnly: true,
                secure: false
            })
            res.send(token)
        } else {
            user.loginCount++;
            if (user.loginCount == 3) {
                user.loginCount = 0;
                user.lockTime = Date.now() + 3600 * 1000;
            }
            await user.save()
            res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
        }
    } catch (error) {
        res.status(404).send({
            message: error.message
        })
    }
})
router.get('/me', CheckLogin, function (req, res, next) {
    res.send(req.user)
})
router.post('changepassword', CheckLogin, ChangePasswordValidator, validatedResult, async function (req, res, next) {
    let { oldpassword, newpassword } = req.body;
    let user = req.user;
    if (bcrypt.compareSync(oldpassword, user.password)) {
        user.password = newpassword;
        await user.save();
        res.send("da update")
        return;
    }
    res.send(" sai password")
})
router.post('/logout', CheckLogin, function (req, res, next) {
    res.cookie("TOKEN_LOGIN_NNPTUD_C4", null, {
        maxAge: 0,
        httpOnly: true,
        secure: false
    })
    res.send({
        message: "da logout"
    })
})
router.post('/forgotpassword', async function (req, res, next) {
    let email = req.body.email;
    let user = await userController.GetAnUserByEmail(email);
    if (user) {
        user.forgotPasswordToken = crypto.randomBytes(32).toString('base64url');
        user.forgotPasswordTokenExp = Date.now() + 600_000;
        let url = "http://localhost:3000/api/v1/auth/resetpassword/" + user.forgotPasswordToken
        await sendMail(user.email, url)
        await user.save();
    }
    res.send({
        message: "check mail"
    })
})
router.post('/resetpassword/:token', async function (req, res, next) {
    let token = req.params.token;
    let user = await userController.GetAnUserByToken(token);
    if (user) {
        user.password = req.body.password;
        user.forgotPasswordToken = null;
        user.forgotPasswordTokenExp = null;
        await user.save();
        res.send({
            message: "ok"
        })
    } else {
        res.send({
            message: "invalid token"
        })
    }
})
module.exports = router