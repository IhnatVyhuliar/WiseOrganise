"""Environment-backed application settings.

The defaults keep the API runnable without external services.  Gemini is only
used when a key is present and ``USE_MOCK_AI`` is explicitly disabled.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="WiseOrganise API")
    api_v1_prefix: str = "/api/v1"
    debug: bool = True
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]
    )
    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    gemini_model_main: str = Field(default="gemini-3.8-flash", validation_alias="GEMINI_MODEL_MAIN")
    gemini_model_lite: str = Field(default="gemini-3.5-flash-lite", validation_alias="GEMINI_MODEL_LITE")
    use_mock_ai: bool = Field(default=True, validation_alias="USE_MOCK_AI")

    @property
    def gemini_enabled(self) -> bool:
        """Return whether live Gemini calls are allowed."""

        return bool(self.gemini_api_key) and not self.use_mock_ai


settings = Settings()
