package com.college.disasterrelief;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class DisasterReliefBackendApplication {

    public static void main(String[] args) {
        acceptProviderDatabaseUrl(System.getenv("DATABASE_URL"));
        SpringApplication.run(DisasterReliefBackendApplication.class, args);
    }

    /**
     * Neon and most hosts hand out "postgresql://user:password@host/db?sslmode=require".
     * Spring needs a JDBC URL with the credentials separate, so convert it here.
     * A URL that already starts with "jdbc:" is left alone.
     */
    static void acceptProviderDatabaseUrl(String url) {
        if (url == null || !url.matches("^postgres(ql)?://.+")) {
            return;
        }
        URI uri = URI.create(url);
        String port = uri.getPort() > 0 ? ":" + uri.getPort() : "";
        String query = uri.getRawQuery() != null ? "?" + uri.getRawQuery() : "";
        System.setProperty("spring.datasource.url", "jdbc:postgresql://" + uri.getHost() + port + uri.getRawPath() + query);

        String userInfo = uri.getRawUserInfo();
        if (userInfo != null) {
            String[] parts = userInfo.split(":", 2);
            System.setProperty("spring.datasource.username", URLDecoder.decode(parts[0], StandardCharsets.UTF_8));
            if (parts.length > 1) {
                System.setProperty("spring.datasource.password", URLDecoder.decode(parts[1], StandardCharsets.UTF_8));
            }
        }
    }
}
