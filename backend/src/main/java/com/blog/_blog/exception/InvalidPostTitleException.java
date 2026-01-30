package com.blog._blog.exception;

public class InvalidPostTitleException extends RuntimeException {
    public InvalidPostTitleException(String message) {
        super(message);
    }
}
