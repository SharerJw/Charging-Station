plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":ev-common:ev-common-core"))
    implementation(libs.sa.token.spring.boot)
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.aop)
    implementation(libs.hutool.crypto)
    implementation("io.jsonwebtoken:jjwt-api:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.5")
    implementation("org.springframework.security:spring-security-crypto:6.3.4")
}
