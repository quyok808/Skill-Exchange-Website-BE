const { body, validationResult } = require("express-validator");
const AppError = require("../utils/appError");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return next(new AppError(errorMessages.join(", "), 400));
  }
  next();
};

exports.validateRegister = [
  body("email").isEmail().withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Mật khẩu phải chứa ít nhất 8 kí tự")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).*$/
    )
    .withMessage(
      "Mật khẩu phải chứa ít nhất 1 kí tự in hoa, 1 kí tự in thường, 1 số và 1 kí tự đặc biệt"
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Mật khẩu và xác nhận mật khẩu không trùng khớp");
    }
    return true;
  }),

  handleValidationErrors,
];

exports.validateResetPassword = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Mật khẩu phải chứa ít nhất 8 kí tự")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).*$/
    )
    .withMessage(
      "Mật khẩu phải chứa ít nhất 1 kí tự in hoa, 1 kí tự in thường, 1 số và 1 kí tự đặc biệt"
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Mật khẩu và xác nhận mật khẩu không trùng khớp");
    }
    return true;
  }),

  handleValidationErrors,
];
