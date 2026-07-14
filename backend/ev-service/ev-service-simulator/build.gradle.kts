plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":ev-common:ev-common-core"))
    implementation(project(":ev-common:ev-common-redis"))

    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.websocket)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.nacos.discovery)
    implementation(libs.knife4j.openapi)
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.micrometer.registry.prometheus)

    runtimeOnly(libs.logstash.logback.encoder)

    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.mockk)
}
