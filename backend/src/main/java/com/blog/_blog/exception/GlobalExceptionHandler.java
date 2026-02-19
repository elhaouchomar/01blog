package com.blog._blog.exception;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.ConstraintViolationException;

import com.blog._blog.util.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {
        private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
                return jsonError(HttpStatus.BAD_REQUEST, "Malformed JSON request or invalid request body", null);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
                return jsonError(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationsException(
                        MethodArgumentNotValidException ex) {
                Map<String, String> details = new HashMap<>();
                ex.getBindingResult().getFieldErrors()
                                .forEach(error -> details.put(error.getField(), error.getDefaultMessage()));

                return jsonError(HttpStatus.BAD_REQUEST, "Validation Error", details);
        }

        @ExceptionHandler(BindException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleBindException(BindException ex) {
                Map<String, String> details = new HashMap<>();
                ex.getBindingResult().getFieldErrors()
                                .forEach(error -> details.put(error.getField(), error.getDefaultMessage()));
                return jsonError(HttpStatus.BAD_REQUEST, "Validation Error", details);
        }

        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolation(
                        ConstraintViolationException ex) {
                Map<String, String> details = ex.getConstraintViolations().stream()
                                .collect(Collectors.toMap(
                                                violation -> violation.getPropertyPath().toString(),
                                                violation -> violation.getMessage(),
                                                (existing, replacement) -> existing,
                                                HashMap::new));
                return jsonError(HttpStatus.BAD_REQUEST, "Validation Error", details);
        }

        @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
        public ResponseEntity<ApiResponse<String>> handleMediaTypeNotSupportedException(
                        HttpMediaTypeNotSupportedException ex) {
                String supported = ex.getSupportedMediaTypes().isEmpty()
                                ? "No supported media types available"
                                : "Supported media types: " + ex.getSupportedMediaTypes();

                return jsonError(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Media Type Not Supported", supported);
        }

        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<ApiResponse<Void>> handleParamsException(MissingServletRequestParameterException ex) {
                return jsonError(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
        }

        @ExceptionHandler(MissingRequestHeaderException.class)
        public ResponseEntity<ApiResponse<Void>> handleMissingHeader(MissingRequestHeaderException ex) {
                return jsonError(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
        }

        @ExceptionHandler(ServletRequestBindingException.class)
        public ResponseEntity<ApiResponse<Void>> handleRequestBinding(ServletRequestBindingException ex) {
                return jsonError(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
        }

        @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
        public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
                return jsonError(HttpStatus.METHOD_NOT_ALLOWED, "HTTP method not allowed for this endpoint", null);
        }

        @ExceptionHandler(NoHandlerFoundException.class)
        public ResponseEntity<ApiResponse<Void>> handleNoHandler(NoHandlerFoundException ex) {
                return jsonError(HttpStatus.NOT_FOUND, "Endpoint not found", null);
        }

        @ExceptionHandler(DuplicateReportException.class)
        public ResponseEntity<ApiResponse<Void>> handleDuplicateReport(DuplicateReportException ex) {
                return jsonError(HttpStatus.CONFLICT, ex.getMessage(), null);
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
                String message = ex.getMostSpecificCause() != null
                                ? ex.getMostSpecificCause().getMessage()
                                : ex.getMessage();
                String normalized = message == null ? "" : message.toLowerCase(Locale.ROOT);

                if (normalized.contains("uk_reports_reporter_reported_user")
                                || normalized.contains("uk_reports_reporter_reported_post")) {
                        return jsonError(HttpStatus.CONFLICT, "You have already submitted this report", null);
                }

                if (normalized.contains("_user_email_key")
                                || normalized.contains("duplicate key")
                                || normalized.contains("unique")) {
                        return jsonError(HttpStatus.CONFLICT, "A record with the same unique value already exists", null);
                }

                return jsonError(HttpStatus.BAD_REQUEST, "Request violates data integrity constraints", null);
        }

        @ExceptionHandler(FileValidationException.class)
        public ResponseEntity<ApiResponse<Void>> handleFileValidation(FileValidationException ex) {
                return jsonError(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
        }

        @ExceptionHandler(MaxUploadSizeExceededException.class)
        public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
                return jsonError(HttpStatus.PAYLOAD_TOO_LARGE, "Uploaded file is too large", null);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiResponse<String>> handleAccessDeniedException(AccessDeniedException ex) {
                return jsonError(HttpStatus.FORBIDDEN,
                                "Access Denied: You do not have permission to perform this action",
                                null);
        }

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
                return jsonError(HttpStatus.UNAUTHORIZED, "Invalid email or password", null);
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex) {
                return jsonError(HttpStatus.UNAUTHORIZED, "Authentication failed", null);
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
                        MethodArgumentTypeMismatchException ex) {
                return jsonError(HttpStatus.BAD_REQUEST, "Invalid parameter type", null);
        }

        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException ex) {
                HttpStatus status = ex.getStatus();
                String reason = ex.getReason() != null ? ex.getReason() : "Request could not be processed";
                return jsonError(status, reason, null);
        }

        @ExceptionHandler(RuntimeException.class)
        public ResponseEntity<ApiResponse<Void>> handleRuntime(RuntimeException ex) {
                String message = sanitizeRuntimeMessage(ex.getMessage());
                HttpStatus status = resolveRuntimeStatus(message);
                log.warn("Runtime error handled with status {}: {}", status.value(), message);
                return jsonError(status, message, null);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
                log.error("Unhandled exception", ex);
                return jsonError(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", null);
        }

        private HttpStatus resolveRuntimeStatus(String message) {
                String normalized = message == null ? "" : message.toLowerCase(Locale.ROOT);
                if (normalized.contains("unauthorized") || normalized.contains("access denied")) {
                        return HttpStatus.FORBIDDEN;
                }
                if (normalized.contains("not found")) {
                        return HttpStatus.NOT_FOUND;
                }
                return HttpStatus.BAD_REQUEST;
        }

        private String sanitizeRuntimeMessage(String message) {
                if (message == null) {
                        return "Request could not be processed";
                }
                String trimmed = message.trim();
                String lowered = trimmed.toLowerCase(Locale.ROOT);
                if (trimmed.isEmpty()
                                || trimmed.length() > 180
                                || trimmed.contains("\n")
                                || lowered.contains("exception")
                                || lowered.contains("trace")) {
                        return "Request could not be processed";
                }
                return trimmed;
        }

        private <T> ResponseEntity<ApiResponse<T>> jsonError(HttpStatus status, String message, T data) {
                return ResponseEntity.status(status)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(message, data));
        }

}
