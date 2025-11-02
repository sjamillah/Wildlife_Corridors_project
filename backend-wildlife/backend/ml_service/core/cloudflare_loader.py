"""
Cloudflare File Loader Utility
Handles loading files from Cloudflare storage URLs or local paths
"""

import os
import httpx
from pathlib import Path
from typing import Union, Optional
from urllib.parse import urlparse
import tempfile
import logging

logger = logging.getLogger(__name__)


class CloudflareFileLoader:
    """Load files from Cloudflare URLs or local paths"""
    
    def __init__(self, cloudflare_base_url: Optional[str] = None):
        """
        Initialize Cloudflare file loader
        
        Args:
            cloudflare_base_url: Base URL for Cloudflare storage (e.g., "https://your-domain.com")
                                If None, assumes local paths only
        """
        self.cloudflare_base_url = cloudflare_base_url.rstrip('/') if cloudflare_base_url else None
        self._cache_dir = Path(tempfile.gettempdir()) / "ml_service_cache"
        self._cache_dir.mkdir(exist_ok=True)
    
    def resolve_path(self, path: Union[str, Path]) -> Path:
        """
        Resolve a path to either a Cloudflare URL or local file path
        
        Args:
            path: Path string that could be:
                  - Local file path (e.g., "./data/rasters/file.tif")
                  - Cloudflare relative path (e.g., "ml-information/data/rasters/file.tif")
                  - Full Cloudflare URL (e.g., "https://domain.com/ml-information/data/rasters/file.tif")
        
        Returns:
            Path object pointing to local file (downloaded from Cloudflare if needed)
        """
        path_str = str(path)
        
        parsed = urlparse(path_str)
        if parsed.scheme in ('http', 'https'):
            return self._download_from_url(path_str)
        
        if path_str.startswith('ml-information/'):
            if self.cloudflare_base_url:
                full_url = f"{self.cloudflare_base_url}/{path_str}"
                return self._download_from_url(full_url)
            else:
                logger.warning(f"Cloudflare base URL not set, treating as local path: {path_str}")
                return Path(path_str)
        
        return Path(path_str)
    
    def _download_from_url(self, url: str) -> Path:
        """
        Download file from Cloudflare URL to local cache
        
        Args:
            url: Full HTTP/HTTPS URL to file
        
        Returns:
            Path to cached local file
        """
        cache_key = url.replace('://', '_').replace('/', '_').replace(':', '_')
        cached_file = self._cache_dir / cache_key
        
        if cached_file.exists():
            logger.debug(f"Using cached file: {cached_file}")
            return cached_file
        
        try:
            logger.info(f"Downloading file from Cloudflare: {url}")
            with httpx.Client(timeout=300.0) as client:
                response = client.get(url)
                response.raise_for_status()
                
                cached_file.parent.mkdir(parents=True, exist_ok=True)
                with open(cached_file, 'wb') as f:
                    f.write(response.content)
                
                logger.info(f"Downloaded and cached: {cached_file}")
                return cached_file
                
        except Exception as e:
            logger.error(f"Failed to download from Cloudflare: {url}, error: {e}")
            raise FileNotFoundError(f"Could not download file from {url}: {e}")
    
    def exists(self, path: Union[str, Path]) -> bool:
        """Check if file exists."""
        try:
            resolved = self.resolve_path(path)
            return resolved.exists()
        except Exception:
            return False
    
    def open(self, path: Union[str, Path], mode: str = 'rb'):
        """Open file for reading."""
        resolved = self.resolve_path(path)
        return open(resolved, mode)
    
    def clear_cache(self):
        """Clear the download cache"""
        import shutil
        if self._cache_dir.exists():
            shutil.rmtree(self._cache_dir)
            self._cache_dir.mkdir(exist_ok=True)
            logger.info("Cache cleared")


_file_loader: Optional[CloudflareFileLoader] = None


def get_file_loader(cloudflare_base_url: Optional[str] = None) -> CloudflareFileLoader:
    """Get or create global file loader instance."""
    global _file_loader
    if _file_loader is None:
        _file_loader = CloudflareFileLoader(cloudflare_base_url)
    return _file_loader


def set_cloudflare_base_url(base_url: str):
    """Set Cloudflare base URL for file loading."""
    global _file_loader
    _file_loader = CloudflareFileLoader(base_url)

