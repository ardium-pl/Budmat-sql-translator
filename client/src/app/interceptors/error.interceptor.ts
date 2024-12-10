import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { APIErrorCode, APIErrorCodeMapping } from '../interfaces/errorCodes';
import { AuthService } from '../services/auth.service';
import { MessageService } from '../services/message.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Reset error message before each HTTP request
    this.messageService.errorMessage.set('');

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const { status, errorCode } = error.error;

        if (
          status === 'error' &&
          Object.values(APIErrorCode).includes(errorCode)
        ) {
          // Handle known errors
          this.handleAPIError(errorCode);
        } else {
          // Default generic error message if no mapping found
          this.messageService.errorMessage.set(
            'Nie udało się połączyć z serwerem.'
          );
        }

        return throwError(() => error);
      })
    );
  }

  handleAPIError(errorCode: APIErrorCode): void {
    const error = this.APIErrorCodeMapping[errorCode];

    this.messageService.errorMessage.set(error.message);
    if (error.action) {
      error.action();
    }
  }

readonly APIErrorCodeMapping: APIErrorCodeMapping = {
  'NO_TOKEN_ERR': {
    message: 'Twoja sesja wygasła. Zaloguj się ponownie aby kontynuować.',
    action: () => {
      this.authService.isLoggedIn.set(false);
    },
  },
  'INVALID_VERIFICATION_TOKEN_ERR': {
    message: 'Twoja sesja wygasła. Zaloguj się ponownie aby kontynuować.',
    action: () => {
      this.authService.isLoggedIn.set(false);
    },
  },
  'INVALID_PASSWORD_ERR': {
    message: 'Podano nieprawidłowe hasło.',
  },
  'NO_QUERY_ERR': {
    message: 'Nie wprowadzono zapytania. Proszę podać zapytanie, aby kontynuować.',
  },
  'NO_PASSWORD_ERR': {
    message: 'Nie wprowadzono hasła. Proszę podać hasło, aby kontynuować.',
  },
  'INTERNAL_SERVER_ERR': {
    message: 'Wystąpił błąd serwera. Spróbuj ponownie później.',
  },
  'PROCESSING_ERR': {
    message: 'Wystąpił błąd podczas przetwarzania żądania. Spróbuj ponownie.',
  },
  'UNSUPPORTED_QUERY_ERR': {
    message: 'Wygląda na to, że chcesz wykonać zapytanie inne niż SELECT, co nie jest obsługiwane.',
  },
  'DATABASE_ERR': {
    message: 'Błąd bazy danych. Nie udało się wykonać zapytania SQL.',
  },
};
}
