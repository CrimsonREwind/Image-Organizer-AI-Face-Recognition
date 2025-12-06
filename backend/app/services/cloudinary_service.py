"""Cloudinary service for image uploads and management."""
import cloudinary
import cloudinary.uploader
import cloudinary.api
from werkzeug.utils import secure_filename


def init_cloudinary(config):
    """Initialize Cloudinary with configuration."""
    cloudinary.config(
        cloud_name=config.get('CLOUDINARY_CLOUD_NAME'),
        api_key=config.get('CLOUDINARY_API_KEY'),
        api_secret=config.get('CLOUDINARY_API_SECRET'),
        secure=True
    )


def upload_image(file, folder='image-organizer'):
    """
    Upload an image to Cloudinary.
    
    Args:
        file: File object or file path
        folder: Cloudinary folder to store the image
        
    Returns:
        dict: Upload result containing url and public_id
    """
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type='image',
            transformation=[
                {'quality': 'auto:good'},
                {'fetch_format': 'auto'}
            ]
        )
        return {
            'success': True,
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'width': result.get('width'),
            'height': result.get('height'),
            'format': result.get('format')
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def delete_image(public_id):
    """
    Delete an image from Cloudinary.
    
    Args:
        public_id: Cloudinary public ID of the image
        
    Returns:
        dict: Deletion result
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return {
            'success': result.get('result') == 'ok',
            'result': result
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_thumbnail_url(url, width=200, height=200):
    """
    Generate a thumbnail URL for an image.
    
    Args:
        url: Original Cloudinary URL
        width: Thumbnail width
        height: Thumbnail height
        
    Returns:
        str: Thumbnail URL
    """
    if not url:
        return None
    
    # Insert transformation into Cloudinary URL
    parts = url.split('/upload/')
    if len(parts) == 2:
        transformation = f'c_fill,w_{width},h_{height},g_face'
        return f'{parts[0]}/upload/{transformation}/{parts[1]}'
    return url
