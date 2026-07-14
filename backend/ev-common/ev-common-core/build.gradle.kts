plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(libs.hutool.core)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.aop)
    implementation(libs.micrometer.registry.prometheus)
    compileOnly("jakarta.servlet:jakarta.servlet-api:6.0.0")
}
