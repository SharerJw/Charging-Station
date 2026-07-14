plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":ev-common:ev-common-core"))
    implementation(libs.spring.boot.starter.data.redis)
    implementation(libs.spring.boot.starter.aop)
    implementation(libs.spring.boot.starter.web)
    implementation(libs.redisson.spring.boot)
    implementation(libs.caffeine)
}
