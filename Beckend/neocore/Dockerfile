FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

COPY pom.xml ./
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy

RUN groupadd --system neocore && useradd --system --gid neocore neocore
WORKDIR /app

COPY --from=build /build/target/neocore-0.0.1-SNAPSHOT.jar /app/app.jar

USER neocore
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=55 -XX:+UseSerialGC"

ENTRYPOINT ["java", "-jar", "/app/app.jar"]