FROM quay.io/keycloak/keycloak:26.4.0

# Build-time options baked into the image so `start --optimized` can skip
# runtime augmentation (faster boot on small VPS, less CPU).
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=false

RUN /opt/keycloak/bin/kc.sh build
