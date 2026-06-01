package com.rentcity.Rentcity.exception;

/**
 * Ném ra khi không tìm thấy bản ghi (xe, chi nhánh, loại xe...).
 * Được GlobalExceptionHandler chuyển thành HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Object id) {
        super("Không tìm thấy " + resource + " với id = " + id);
    }
}
