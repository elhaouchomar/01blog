import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(): void {
    // Intentionally no-op to keep console clean in this project setup.
  }
}
