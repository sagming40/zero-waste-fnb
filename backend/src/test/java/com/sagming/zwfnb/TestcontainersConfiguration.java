package com.sagming.zwfnb;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
class TestcontainersConfiguration {

	@Bean
	@ServiceConnection
	PostgreSQLContainer postgresContainer() {
		// "latest"는 언젠가 버전 19가 된다 ─ 개발 · 운영과 같은 18 버전으로 못 박는다
		return new PostgreSQLContainer(DockerImageName.parse("postgres:18"));
	}

}
