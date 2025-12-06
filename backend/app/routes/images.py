"""Image management routes."""
from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from werkzeug.utils import secure_filename
import os

from app import mongo
from app.models import ImageModel, PersonModel
from app.services.cloudinary_service import upload_image, delete_image, get_thumbnail_url
from app.services.face_recognition_service import get_face_service

images_bp = Blueprint('images', __name__)


def allowed_file(filename):
    """Check if file extension is allowed."""
    allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'webp'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


@images_bp.route('', methods=['GET'])
def get_images():
    """Get all images with filtering options."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        filter_type = request.args.get('filter', 'all')  # all, identified, unidentified
        
        skip = (page - 1) * per_page
        
        # Build query based on filter
        query = {}
        if filter_type == 'identified':
            query['is_identified'] = True
        elif filter_type == 'unidentified':
            query['has_face'] = True
            query['is_identified'] = False
        
        # Get images with pagination
        images = list(
            mongo.db.images.find(query)
            .sort('created_at', -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Get person info for identified images
        person_ids = [img['person_id'] for img in images if img.get('person_id')]
        people = {str(p['_id']): p for p in mongo.db.people.find({'_id': {'$in': person_ids}})}
        
        # Attach person to images
        for img in images:
            if img.get('person_id') and str(img['person_id']) in people:
                img['person'] = people[str(img['person_id'])]
        
        total = mongo.db.images.count_documents(query)
        
        return jsonify({
            'success': True,
            'data': [ImageModel.to_response(img, include_person=True) for img in images],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@images_bp.route('/<image_id>', methods=['GET'])
def get_image(image_id):
    """Get a specific image by ID."""
    try:
        image = mongo.db.images.find_one({'_id': ObjectId(image_id)})
        
        if not image:
            return jsonify({'success': False, 'error': 'Image not found'}), 404
        
        # Get person info if assigned
        if image.get('person_id'):
            person = mongo.db.people.find_one({'_id': image['person_id']})
            if person:
                image['person'] = person
        
        return jsonify({
            'success': True,
            'data': ImageModel.to_response(image, include_person=True)
        })
        
    except InvalidId:
        return jsonify({'success': False, 'error': 'Invalid image ID'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@images_bp.route('/upload', methods=['POST'])
def upload_images():
    """Upload one or more images with face detection."""
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        
        if not files or all(f.filename == '' for f in files):
            return jsonify({'success': False, 'error': 'No files selected'}), 400
        
        face_service = get_face_service(current_app.config.get('FACE_RECOGNITION_TOLERANCE', 0.6))
        people = list(mongo.db.people.find({'face_encodings': {'$ne': []}}))
        
        results = []
        
        for file in files:
            if file and file.filename:
                if not allowed_file(file.filename):
                    results.append({
                        'filename': file.filename,
                        'success': False,
                        'error': 'File type not allowed'
                    })
                    continue
                
                original_filename = secure_filename(file.filename)
                
                # Read file data for both upload and face detection
                file_data = file.read()
                
                # Upload to Cloudinary
                upload_result = upload_image(file_data)
                
                if not upload_result['success']:
                    results.append({
                        'filename': original_filename,
                        'success': False,
                        'error': upload_result.get('error', 'Upload failed')
                    })
                    continue
                
                # Detect faces
                face_result = face_service.detect_faces(file_data)
                
                face_encodings = face_result.get('face_encodings', [])
                face_locations = face_result.get('face_locations', [])
                
                # Try to match faces to existing people
                matched_person_id = None
                if face_encodings:
                    for encoding in face_encodings:
                        matched_person_id = face_service.find_matching_person(encoding, people)
                        if matched_person_id:
                            break
                
                # Create image document
                image_doc = ImageModel.create_image(
                    cloudinary_url=upload_result['url'],
                    cloudinary_public_id=upload_result['public_id'],
                    original_filename=original_filename,
                    face_encodings=face_encodings,
                    face_locations=face_locations,
                    person_id=str(matched_person_id) if matched_person_id else None
                )
                
                result = mongo.db.images.insert_one(image_doc)
                image_doc['_id'] = result.inserted_id
                
                # Update person's image count and thumbnail if matched
                if matched_person_id:
                    person = mongo.db.people.find_one({'_id': matched_person_id})
                    update_data = {
                        'image_count': person.get('image_count', 0) + 1,
                        'updated_at': datetime.utcnow()
                    }
                    
                    # Set thumbnail if not set
                    if not person.get('thumbnail_url'):
                        update_data['thumbnail_url'] = get_thumbnail_url(upload_result['url'])
                    
                    # Add face encoding to person if new
                    if face_encodings:
                        mongo.db.people.update_one(
                            {'_id': matched_person_id},
                            {
                                '$set': update_data,
                                '$addToSet': {'face_encodings': face_encodings[0]}
                            }
                        )
                    else:
                        mongo.db.people.update_one(
                            {'_id': matched_person_id},
                            {'$set': update_data}
                        )
                
                results.append({
                    'filename': original_filename,
                    'success': True,
                    'image': ImageModel.to_response(image_doc),
                    'faces_detected': len(face_encodings),
                    'matched_person': str(matched_person_id) if matched_person_id else None
                })
        
        successful = sum(1 for r in results if r['success'])
        
        return jsonify({
            'success': True,
            'message': f'Uploaded {successful} of {len(results)} images',
            'results': results
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@images_bp.route('/<image_id>', methods=['DELETE'])
def delete_image_route(image_id):
    """Delete an image."""
    try:
        image = mongo.db.images.find_one({'_id': ObjectId(image_id)})
        
        if not image:
            return jsonify({'success': False, 'error': 'Image not found'}), 404
        
        # Delete from Cloudinary
        cloudinary_result = delete_image(image.get('cloudinary_public_id'))
        
        # Update person's image count
        if image.get('person_id'):
            mongo.db.people.update_one(
                {'_id': image['person_id']},
                {
                    '$inc': {'image_count': -1},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
        
        # Delete from database
        mongo.db.images.delete_one({'_id': ObjectId(image_id)})
        
        return jsonify({
            'success': True,
            'message': 'Image deleted successfully'
        })
        
    except InvalidId:
        return jsonify({'success': False, 'error': 'Invalid image ID'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@images_bp.route('/<image_id>/assign', methods=['PATCH'])
def assign_image(image_id):
    """Assign or reassign an image to a person."""
    try:
        data = request.get_json()
        person_id = data.get('person_id')
        
        image = mongo.db.images.find_one({'_id': ObjectId(image_id)})
        if not image:
            return jsonify({'success': False, 'error': 'Image not found'}), 404
        
        old_person_id = image.get('person_id')
        
        # Handle unassignment
        if not person_id:
            mongo.db.images.update_one(
                {'_id': ObjectId(image_id)},
                {'$set': {
                    'person_id': None,
                    'is_identified': False,
                    'updated_at': datetime.utcnow()
                }}
            )
            
            # Update old person's count
            if old_person_id:
                mongo.db.people.update_one(
                    {'_id': old_person_id},
                    {
                        '$inc': {'image_count': -1},
                        '$set': {'updated_at': datetime.utcnow()}
                    }
                )
            
            return jsonify({
                'success': True,
                'message': 'Image unassigned successfully'
            })
        
        # Verify person exists
        person = mongo.db.people.find_one({'_id': ObjectId(person_id)})
        if not person:
            return jsonify({'success': False, 'error': 'Person not found'}), 404
        
        # Update image
        mongo.db.images.update_one(
            {'_id': ObjectId(image_id)},
            {'$set': {
                'person_id': ObjectId(person_id),
                'is_identified': True,
                'updated_at': datetime.utcnow()
            }}
        )
        
        # Update old person's count
        if old_person_id and old_person_id != ObjectId(person_id):
            mongo.db.people.update_one(
                {'_id': old_person_id},
                {
                    '$inc': {'image_count': -1},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
        
        # Update new person's count and face encoding
        update_ops = {
            '$set': {'updated_at': datetime.utcnow()}
        }
        
        if old_person_id != ObjectId(person_id):
            update_ops['$inc'] = {'image_count': 1}
        
        # Add face encoding to help future matching
        if image.get('face_encodings') and len(image['face_encodings']) > 0:
            mongo.db.people.update_one(
                {'_id': ObjectId(person_id)},
                {
                    **update_ops,
                    '$addToSet': {'face_encodings': image['face_encodings'][0]}
                }
            )
        else:
            mongo.db.people.update_one(
                {'_id': ObjectId(person_id)},
                update_ops
            )
        
        # Set thumbnail if not set
        if not person.get('thumbnail_url'):
            mongo.db.people.update_one(
                {'_id': ObjectId(person_id)},
                {'$set': {'thumbnail_url': get_thumbnail_url(image['cloudinary_url'])}}
            )
        
        return jsonify({
            'success': True,
            'message': f'Image assigned to {person["name"]}'
        })
        
    except InvalidId:
        return jsonify({'success': False, 'error': 'Invalid ID'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@images_bp.route('/<image_id>/reprocess', methods=['POST'])
def reprocess_image(image_id):
    """Reprocess an image to re-detect faces."""
    try:
        image = mongo.db.images.find_one({'_id': ObjectId(image_id)})
        
        if not image:
            return jsonify({'success': False, 'error': 'Image not found'}), 404
        
        # Download image from Cloudinary and reprocess
        import requests
        from io import BytesIO
        
        response = requests.get(image['cloudinary_url'])
        if response.status_code != 200:
            return jsonify({'success': False, 'error': 'Failed to download image'}), 500
        
        face_service = get_face_service(current_app.config.get('FACE_RECOGNITION_TOLERANCE', 0.6))
        face_result = face_service.detect_faces(response.content)
        
        face_encodings = face_result.get('face_encodings', [])
        face_locations = face_result.get('face_locations', [])
        
        # Try to match faces
        matched_person_id = None
        if face_encodings:
            people = list(mongo.db.people.find({'face_encodings': {'$ne': []}}))
            for encoding in face_encodings:
                matched_person_id = face_service.find_matching_person(encoding, people)
                if matched_person_id:
                    break
        
        # Update image
        old_person_id = image.get('person_id')
        
        update_data = {
            'face_encodings': face_encodings,
            'face_locations': face_locations,
            'has_face': bool(face_encodings),
            'updated_at': datetime.utcnow()
        }
        
        if matched_person_id:
            update_data['person_id'] = matched_person_id
            update_data['is_identified'] = True
        
        mongo.db.images.update_one(
            {'_id': ObjectId(image_id)},
            {'$set': update_data}
        )
        
        # Update person counts
        if old_person_id and old_person_id != matched_person_id:
            mongo.db.people.update_one(
                {'_id': old_person_id},
                {'$inc': {'image_count': -1}}
            )
        
        if matched_person_id and old_person_id != matched_person_id:
            mongo.db.people.update_one(
                {'_id': matched_person_id},
                {'$inc': {'image_count': 1}}
            )
        
        return jsonify({
            'success': True,
            'message': f'Reprocessed image. Found {len(face_encodings)} face(s).',
            'faces_detected': len(face_encodings),
            'matched_person': str(matched_person_id) if matched_person_id else None
        })
        
    except InvalidId:
        return jsonify({'success': False, 'error': 'Invalid image ID'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
