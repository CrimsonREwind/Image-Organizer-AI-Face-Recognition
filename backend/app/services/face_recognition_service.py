"""Face recognition service for detecting and matching faces."""
import face_recognition
import numpy as np
from io import BytesIO
from PIL import Image
import logging

logger = logging.getLogger(__name__)


class FaceRecognitionService:
    """Service for face detection and recognition."""
    
    def __init__(self, tolerance=0.6):
        """
        Initialize the face recognition service.
        
        Args:
            tolerance: How much distance between faces to consider it a match.
                      Lower is stricter. 0.6 is typical best performance.
        """
        self.tolerance = tolerance
    
    def detect_faces(self, image_data):
        """
        Detect faces in an image.
        
        Args:
            image_data: Image file data (bytes or file-like object)
            
        Returns:
            dict: Contains face_encodings (list) and face_locations (list)
        """
        try:
            # Load image
            if isinstance(image_data, bytes):
                image = face_recognition.load_image_file(BytesIO(image_data))
            else:
                image_data.seek(0)
                image = face_recognition.load_image_file(image_data)
            
            # Detect face locations
            face_locations = face_recognition.face_locations(image, model='hog')
            
            if not face_locations:
                return {
                    'success': True,
                    'face_encodings': [],
                    'face_locations': [],
                    'face_count': 0
                }
            
            # Get face encodings
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            # Convert to serializable format
            encodings_list = [encoding.tolist() for encoding in face_encodings]
            locations_list = [list(loc) for loc in face_locations]
            
            return {
                'success': True,
                'face_encodings': encodings_list,
                'face_locations': locations_list,
                'face_count': len(face_locations)
            }
            
        except Exception as e:
            logger.error(f"Face detection error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'face_encodings': [],
                'face_locations': [],
                'face_count': 0
            }
    
    def find_matching_person(self, face_encoding, people):
        """
        Find a matching person for a face encoding.
        
        Args:
            face_encoding: The face encoding to match (list)
            people: List of person documents with face_encodings
            
        Returns:
            ObjectId or None: The matched person's ID or None
        """
        if not face_encoding or not people:
            return None
        
        target_encoding = np.array(face_encoding)
        best_match = None
        best_distance = float('inf')
        
        for person in people:
            person_encodings = person.get('face_encodings', [])
            
            for stored_encoding in person_encodings:
                if not stored_encoding:
                    continue
                    
                stored_np = np.array(stored_encoding)
                
                # Calculate face distance
                distance = np.linalg.norm(target_encoding - stored_np)
                
                if distance < self.tolerance and distance < best_distance:
                    best_distance = distance
                    best_match = person['_id']
        
        return best_match
    
    def compare_faces(self, encoding1, encoding2):
        """
        Compare two face encodings.
        
        Args:
            encoding1: First face encoding (list)
            encoding2: Second face encoding (list)
            
        Returns:
            dict: Contains 'match' (bool) and 'distance' (float)
        """
        try:
            enc1 = np.array(encoding1)
            enc2 = np.array(encoding2)
            
            distance = np.linalg.norm(enc1 - enc2)
            is_match = distance <= self.tolerance
            
            return {
                'match': is_match,
                'distance': float(distance),
                'confidence': max(0, 1 - (distance / self.tolerance)) if is_match else 0
            }
        except Exception as e:
            logger.error(f"Face comparison error: {str(e)}")
            return {
                'match': False,
                'distance': float('inf'),
                'confidence': 0,
                'error': str(e)
            }


# Global service instance
face_service = None


def get_face_service(tolerance=0.6):
    """Get or create the face recognition service instance."""
    global face_service
    if face_service is None:
        face_service = FaceRecognitionService(tolerance)
    return face_service
