from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AuditorIA"
    debug: bool = False
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str
    postgres_port: int

    keycloak_issuer: str = "http://localhost:8080/realms/auditoria"
    keycloak_jwks_url: str = "http://localhost:8080/realms/auditoria/protocol/openid-connect/certs"
    keycloak_audience: str = "auditoria-backend"
    keycloak_client_id: str = "auditoria-frontend"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
