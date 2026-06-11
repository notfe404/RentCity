package com.rentcity.Rentcity.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewReplyRequest {

    @Size(max = 500, message = "Reply must be at most 500 characters")
    private String staffReply;
}
