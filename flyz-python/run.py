"""
开发环境启动脚本。

使用方式：
    python run.py
"""
import uvicorn

from application.config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "application.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.APP_DEBUG,
        log_level="info",
    )
