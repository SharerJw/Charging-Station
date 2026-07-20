# ============================================
# EV Charging Service - 多阶段构建
# ============================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app
COPY gradle/ gradle/
COPY gradlew .
COPY build.gradle.kts settings.gradle.kts libs.versions.toml ./
COPY ev-common/ ev-common/
COPY ev-service/ev-service-charging/ ev-service/ev-service-charging/

RUN chmod +x gradlew && ./gradlew :ev-service:ev-service-charging:bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=builder /app/ev-service/ev-service-charging/build/libs/*.jar app.jar

RUN chown -R app:app /app
USER app

ENV JAVA_OPTS="-Xms256m -Xmx512m" \
    SPRING_PROFILES_ACTIVE=prod

EXPOSE 8084

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
