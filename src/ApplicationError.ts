export default class ApplicationError extends Error {
  statusCode: number;

  constructor(statusCode, message) {
    super();
    
    Error.captureStackTrace(this, this.constructor);
    
    this.name = this.constructor.name;
    
    this.message = message || 'Something went wrong. Please try again.';
    
    this.statusCode = statusCode || 500;
  }
}