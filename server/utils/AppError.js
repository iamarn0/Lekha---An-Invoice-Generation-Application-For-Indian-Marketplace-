class AppError extends Error {
  constructor(message, statusCode = 500, errorsList) {
    super(message);
    this.statusCode = statusCode;
    this.errorsList = errorsList;
  }
}

module.exports = AppError;
