export default class ApplicationError extends Error {
  statusCode: number;
  __proto__: Error;

  constructor(statusCode, message) {
    const trueProto = new.target.prototype;
    super(message);
    
    Error.captureStackTrace(this, this.constructor);
    
    this.name = this.constructor.name;
    this.message = message || 'Something went wrong. Please try again.';
    this.statusCode = statusCode || 500;
    this.__proto__ = trueProto;
  }
}