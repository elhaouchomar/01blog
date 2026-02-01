package com.blog._blog.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.http.converter.HttpMessageNotReadableException;

import com.blog._blog.util.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error("Malformed JSON request or invalid request body", null));
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(UserAlreadyExistsException.class)
        public ResponseEntity<ApiResponse<Void>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationsException(
                        MethodArgumentNotValidException ex) {
                Map<String, String> details = new HashMap<>();
                ex.getBindingResult().getFieldErrors()
                                .forEach(error -> details.put(error.getField(), error.getDefaultMessage()));

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error("Validation Error", details));
        }

        @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
        public ResponseEntity<ApiResponse<String>> handleMediaTypeNotSupportedException(
                        HttpMediaTypeNotSupportedException ex) {
                String supported = ex.getSupportedMediaTypes().isEmpty()
                                ? "No supported media types available"
                                : "Supported media types: " + ex.getSupportedMediaTypes();

                return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error("Media Type Not Supported", supported));
        }

        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<ApiResponse<Void>> handleParamsException(MissingServletRequestParameterException ex) {

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(SelfFollowException.class)
        public ResponseEntity<ApiResponse<Void>> handleSelfFollow(SelfFollowException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(UserNotFoundException.class)
        public ResponseEntity<ApiResponse<Void>> handleUserNotFound(UserNotFoundException ex) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(PostNotFoundException.class)
        public ResponseEntity<ApiResponse<Void>> handlePostNotFound(PostNotFoundException ex) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(ReportNotFoundException.class)
        public ResponseEntity<ApiResponse<Void>> handleReportNotFound(ReportNotFoundException ex) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(SelfReportException.class)
        public ResponseEntity<ApiResponse<Void>> handleSelfReport(SelfReportException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(DuplicateReportException.class)
        public ResponseEntity<ApiResponse<Void>> handleDuplicateReport(DuplicateReportException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(FileValidationException.class)
        public ResponseEntity<ApiResponse<Void>> handleFileValidation(FileValidationException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(UnauthorizedActionException.class)
        public ResponseEntity<ApiResponse<Void>> handleUnauthorizedAction(UnauthorizedActionException ex) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(AlreadyFollowingException.class)
        public ResponseEntity<ApiResponse<Void>> handleAlreadyFollowing(AlreadyFollowingException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(NotFollowingException.class)
        public ResponseEntity<ApiResponse<Void>> handleNotFollowing(NotFollowingException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(InvalidPostTitleException.class)
        public ResponseEntity<ApiResponse<String>> handleInvalidPostTitle(InvalidPostTitleException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(InvalidPostContentException.class)
        public ResponseEntity<ApiResponse<String>> handleInvalidPostContent(InvalidPostContentException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiResponse<String>> handleAccessDeniedException(AccessDeniedException ex) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(ApiResponse.error(
                                                "Access Denied: You do not have permission to perform this action",
                                                null));
        }

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(ApiResponse.error("Invalid email or password", null));
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
                        MethodArgumentTypeMismatchException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.error("Invalid parameter type", null));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
                System.out.println(ex.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ApiResponse.error(ex.getMessage(), null));
        }

}
