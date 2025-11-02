"""
Authentication for ML Service
"""
from fastapi import Header, HTTPException
from ..config.settings import get_settings


async def verify_api_key(x_api_key: str = Header(None)):
    """
    Verify API key from request header.
    
    Django backend sends: X-API-Key: {api_key}
    If API_KEY is not configured, authentication is disabled.
    """
    settings = get_settings()
    
    if not hasattr(settings, 'API_KEY') or not settings.API_KEY or settings.API_KEY.strip() == "":
        return None
    
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Include X-API-Key header."
        )
    
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid API key"
        )
    
    return x_api_key




