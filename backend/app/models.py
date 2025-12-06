"""Database models and schemas."""
from datetime import datetime
from bson import ObjectId


class PersonModel:
    """Person model for MongoDB."""
    
    @staticmethod
    def create_person(name, face_encoding=None, thumbnail_url=None):
        """Create a new person document."""
        return {
            'name': name,
            'face_encodings': [face_encoding] if face_encoding else [],
            'thumbnail_url': thumbnail_url,
            'image_count': 0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    
    @staticmethod
    def to_response(person):
        """Convert person document to API response."""
        return {
            'id': str(person['_id']),
            'name': person['name'],
            'thumbnail_url': person.get('thumbnail_url'),
            'image_count': person.get('image_count', 0),
            'created_at': person['created_at'].isoformat() if person.get('created_at') else None,
            'updated_at': person['updated_at'].isoformat() if person.get('updated_at') else None
        }


class ImageModel:
    """Image model for MongoDB."""
    
    @staticmethod
    def create_image(cloudinary_url, cloudinary_public_id, original_filename, 
                     face_encodings=None, person_id=None, face_locations=None):
        """Create a new image document."""
        return {
            'cloudinary_url': cloudinary_url,
            'cloudinary_public_id': cloudinary_public_id,
            'original_filename': original_filename,
            'face_encodings': face_encodings or [],
            'face_locations': face_locations or [],
            'person_id': ObjectId(person_id) if person_id else None,
            'has_face': bool(face_encodings and len(face_encodings) > 0),
            'is_identified': person_id is not None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    
    @staticmethod
    def to_response(image, include_person=False):
        """Convert image document to API response."""
        response = {
            'id': str(image['_id']),
            'url': image['cloudinary_url'],
            'original_filename': image.get('original_filename'),
            'has_face': image.get('has_face', False),
            'is_identified': image.get('is_identified', False),
            'face_count': len(image.get('face_locations', [])),
            'person_id': str(image['person_id']) if image.get('person_id') else None,
            'created_at': image['created_at'].isoformat() if image.get('created_at') else None
        }
        
        if include_person and image.get('person'):
            response['person'] = PersonModel.to_response(image['person'])
        
        return response
