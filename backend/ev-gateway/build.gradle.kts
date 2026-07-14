plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":ev-common:ev-common-core"))
    implementation(libs.spring.cloud.gateway)
    implementation("org.springframework.cloud:spring-cloud-starter-loadbalancer:4.1.1")
    implementation(libs.nacos.discovery)
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.spring.boot.starter.data.redis)
    implementation(libs.micrometer.registry.prometheus)
    runtimeOnly(libs.logstash.logback.encoder)
}
