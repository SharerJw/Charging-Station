# ============================================
# EV Identity Service - 多阶段构建
# ============================================

# ── 构建阶段 ──
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# 依赖缓存层：仅当构建配置变更时才重新下载依赖
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./
COPY ev-common/ ev-common/
COPY ev-service/ev-service-identity/build.gradle.kts ev-service/ev-service-identity/build.gradle.kts
RUN chmod +x gradlew && ./gradlew :ev-service:ev-service-identity:dependencies --no-daemon

# 构建 JAR
COPY ev-service/ev-service-identity/ ev-service/ev-service-identity/
RUN ./gradlew :ev-service:ev-service-identity:bootJar -x test --no-daemon

# ── 运行阶段 ──
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S ev && adduser -S ev -G ev
COPY --from=builder /workspace/ev-service/ev-service-identity/build/libs/*.jar app.jar
RUN chown -R ev:ev /app
USER ev

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom" \
    SPRING_PROFILES_ACTIVE=prod

EXPOSE 8081

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
