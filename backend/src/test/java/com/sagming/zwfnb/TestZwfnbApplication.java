package com.sagming.zwfnb;

import org.springframework.boot.SpringApplication;

public class TestZwfnbApplication {

	public static void main(String[] args) {
		SpringApplication.from(ZwfnbApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
