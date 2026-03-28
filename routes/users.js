var express = require("express");
var router = express.Router();
let { validatedResult, CreateAnUserValidator, ModifyAnUserValidator } = require('../utils/validator')
let userModel = require("../schemas/users");
let roleModel = require('../schemas/roles');
let userController = require('../controllers/users')
let { CheckLogin, CheckRole } = require('../utils/authHandler')
let transporter = require('../utils/mailHandler');
let path = require('path');
let bcrypt = require('bcryptjs');
let crypto = require('crypto');
let { uploadExcel } = require('../utils/uploadHandler');
let exceljs = require('exceljs');

router.get("/", CheckLogin,CheckRole("ADMIN", "USER"), async function (req, res, next) {
    let users = await userModel
      .find({ isDeleted: false })
    res.send(users);
  });

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateAnUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newItem = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email, req.body.role,
      req.body.fullName, req.body.avatarUrl, req.body.status, req.body.loginCount)
    res.send(newItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", ModifyAnUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

function generatePassword(length = 16) {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length];
    }
    return password;
}

// ─── Helper: gửi email chào mừng kèm password ────────────────────────────────
async function sendWelcomeEmail(to, username, rawPassword) {
    await transporter.sendMail({
        from: '"Shop Admin" <admin@shop.com>',
        to: to,
        subject: '🎉 Tài khoản của bạn đã được tạo thành công',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;
                        border:1px solid #ddd;border-radius:8px;padding:32px;">
                <h2 style="color:#4f46e5;">Chào mừng, ${username}!</h2>
                <p>Tài khoản của bạn đã được tạo trên hệ thống.</p>
                <p><strong>Thông tin đăng nhập:</strong></p>
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:8px;border:1px solid #eee;background:#f9f9f9;">
                            Username
                        </td>
                        <td style="padding:8px;border:1px solid #eee;">
                            ${username}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px;border:1px solid #eee;background:#f9f9f9;">
                            Password
                        </td>
                        <td style="padding:8px;border:1px solid #eee;
                                   font-weight:bold;letter-spacing:2px;">
                            ${rawPassword}
                        </td>
                    </tr>
                </table>
                <p style="color:#ef4444;margin-top:16px;">
                    ⚠️ Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu!
                </p>
                <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
                <p style="color:#888;font-size:12px;">
                    Email này được gửi tự động, vui lòng không reply.
                </p>
            </div>
        `
    });
}

// ─── POST /users/import_excel ─────────────────────────────────────────────────
router.post('/import_excel', uploadExcel.single('file'), async function (req, res, next) {
    if (!req.file) {
        return res.status(400).send({ message: "File không được để trống" });
    }

    try {
        // ── Bước 1: Tìm role 'user' trong DB (1 lần duy nhất trước vòng lặp) ──
        const userRole = await roleModel.findOne({ name: 'user' });
        if (!userRole) {
            return res.status(400).send({
                message: "Role 'user' chưa tồn tại trong hệ thống. Vui lòng tạo role trước."
            });
        }

        // ── Bước 2: Đọc file Excel ────────────────────────────────────────────
        let workbook = new exceljs.Workbook();
        let pathFile = path.join(__dirname, '../uploads', req.file.filename);
        await workbook.xlsx.readFile(pathFile);
        let worksheet = workbook.worksheets[0];

        if (!worksheet || worksheet.rowCount < 2) {
            return res.status(400).send({ message: "File Excel không có dữ liệu" });
        }

        // ── Bước 3: Load danh sách đã tồn tại để check trùng ─────────────────
        let existingUsers     = await userModel.find({}, 'username email');
        let existingUsernames = existingUsers.map(u => u.username);
        let existingEmails    = existingUsers.map(u => u.email);

        let result       = [];
        let successCount = 0;
        let errorCount   = 0;

        // ── Bước 4: Xử lý từng dòng (bỏ qua dòng 1 là header) ───────────────
        for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
            const row = worksheet.getRow(rowIndex);

            let username = row.getCell(1).value;
            let email    = row.getCell(2).value;

            // Bỏ qua dòng hoàn toàn trống
            if (!username && !email) continue;

            username = (username || '').toString().trim();
            email    = (email    || '').toString().trim();

            let errorsInRow = [];

            // Validate
            if (!username) errorsInRow.push("username không được trống");
            if (!email)    errorsInRow.push("email không được trống");
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                errorsInRow.push("email không đúng định dạng");
            if (username && existingUsernames.includes(username))
                errorsInRow.push(`username "${username}" đã tồn tại`);
            if (email && existingEmails.includes(email))
                errorsInRow.push(`email "${email}" đã tồn tại`);

            if (errorsInRow.length > 0) {
                errorCount++;
                result.push({ row: rowIndex, username, email, status: 'error', errors: errorsInRow });
                continue;
            }

            try {
                // 1. Gen password ngẫu nhiên 16 ký tự
                const rawPassword    = generatePassword(16);
                const hashedPassword = await bcrypt.hash(rawPassword, 10);

                // 2. Lưu DB — role là ObjectId từ collection roles
                const newUser = new userModel({
                    username,
                    email,
                    password: hashedPassword,
                    role: userRole._id    // ✅ ObjectId, KHÔNG phải string 'user'
                });
                await newUser.save();

                // 3. Populate để trả về tên role trong response
                await newUser.populate('role');

                // 4. Gửi email kèm password
                await sendWelcomeEmail(email, username, rawPassword);

                // 5. Cập nhật cache tránh trùng trong cùng batch
                existingUsernames.push(username);
                existingEmails.push(email);

                successCount++;
                result.push({
                    row:      rowIndex,
                    username: newUser.username,
                    email:    newUser.email,
                    role:     newUser.role.name,  // → "user" (tên từ populate)
                    status:   'success',
                    message:  'Tạo tài khoản và gửi email thành công'
                });

            } catch (error) {
                errorCount++;
                result.push({
                    row: rowIndex, username, email,
                    status: 'error', errors: [error.message]
                });
            }
        }

        res.send({
            summary: {
                total:   successCount + errorCount,
                success: successCount,
                error:   errorCount
            },
            details: result
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;