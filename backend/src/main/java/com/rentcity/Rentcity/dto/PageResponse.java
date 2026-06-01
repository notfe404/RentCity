package com.rentcity.Rentcity.dto;

import lombok.*;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Bao gói kết quả phân trang trả ra ngoài (B5).
 * Gọn hơn và ổn định hơn so với trả thẳng đối tượng Page của Spring.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;

    /** Tạo PageResponse từ một Page<E> đã được map sang List<T>. */
    public static <T, E> PageResponse<T> of(Page<E> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
