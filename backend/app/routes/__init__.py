"""Routes package."""
from .people import people_bp
from .images import images_bp
from .stats import stats_bp

__all__ = ['people_bp', 'images_bp', 'stats_bp']
