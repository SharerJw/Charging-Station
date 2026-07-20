plugins {
    `java-library`
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // MinIO Java SDK
    implementation(libs.minio)

    // Spring Boot
    implementation(libs.spring.boot.starter.web)

    // 依赖 common-core
    api(project(":ev-common:ev-common-core"))

    // Lombok
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
}
