package com.rentcity.Rentcity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RentcityApplication {

	public static void main(String[] args) {
		SpringApplication.run(RentcityApplication.class, args);
	}

}
