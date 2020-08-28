
export default class ApplicationError extends Error {
  statusCode: number;

  constructor(statusCode?: number, message?: string) {
    super(message);
    this.stack = (<any>new Error()).stack;
    this.name = "ApplicationError";
    this.message = message || 'Something went wrong. Please try again.';
    this.statusCode = statusCode || 500;
  }
}