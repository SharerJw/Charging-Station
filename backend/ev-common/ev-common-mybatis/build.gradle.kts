plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":ev-common:ev-common-core"))
    implementation(libs.mybatis.plus.boot)
    implementation(libs.spring.boot.starter.aop)
}
