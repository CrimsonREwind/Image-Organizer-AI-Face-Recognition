"""People management routes."""
from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime

from app import mongo
from app.models import PersonModel, ImageModel
from app.services.cloudinary_service import get_thumbnail_url

people_bp = Blueprint('people', __name__)


@people_bp.route('', methods=['GET'])
def get_people():
    """Get all people with optional search."""
    try:
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort', 'name')
        order = request.args.get('order', 'asc')
        
        # Build query
        query = {}
        if search:
            query['name'] = {'$regex': search, '$options': 'i'}
        
        # Sort options
        sort_order = 1 if order == 'asc' else -1
        sort_field = sort_by if sort_by in ['name', 'created_at', 'image_count'] else 'name'
        
        people = list(mongo.db.people.find(query).sort(sort_field, sort_order))
        
        return jsonify({
            'success': True,
            'data': [PersonModel.to_response(p) for p in people],
            'total': len(people)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@people_bp.route('/<person_id>', methods=['GET'])
def get_person(person_id):
    """Get a specific person by ID."""
    try:
        person = mongo.db.people.find_one({'_id': ObjectId(person_id)})
        
        if not person:
            return jsonify({'success': False, 'error': 'Person not found'}), 404
        
        return jsonify({
            'success': True,
            'data': PersonModel.to_response(person)
        })
        
    except InvalidId:
        return jsonify({'success': False, 'error': 'Invalid person ID'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@people_bp.route('', methods=['POST'])
def create_person():
    """Create a new person."""
    try:
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'success': False, 'error': 'Name is required'}), 400
        
        name = data['name'].strip()
        
        # Check if person with same name exists
        existing = mongo.db.people.find_one({'name': {'$regex': f'^{name}$', '$options': 'i'}})
        if existing:
            return jsonify({'success': False, 'error': 'A person with this name already exists'}), 400
        
        person = PersonModel.create_person(name)
        result = mongo.db.people.insert_one(person)
        
        person['_id'] = result.inserted_id
        
        return jsonify({
            'success': True,
            'message': 'Person created successfully',
            'data': PersonModel.to_response(person)
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@people_bp.route('/<person_id>', methods=['PUT'])
def update_person(person_id):
    """Update a person's details."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        person = mongo.db.people.find_one({'_id': ObjectId(person_id)})
        if not person:
            return jsonify({'success': False, 'error': 'Person not found'}), 404
        
        update_data = {'updated_at': datetime.utcnow()}
        
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'success': False, 'error': 'Name cannot be empty'}), 400
            
            # Check for duplicate name
            existing = mongo.db.people.find_one({
                'name': {'$regex': f'^{name}$', '$options': 'i'},
                '_id': {'$ne': ObjectId(person_id)}
            })
            if existing:
                return jsonify({'success': False, 'error': 'A person with this name already exists'}), 400
            
            update_data['name'] = name
        
        mongo.db.people.update_one(
            {'_id': ObjectId(person_id)},
            {'$set': update_data}
        )
        
        updated_person = mongo.db.people.find_one({'_id': ObjectId(person_id)})
        
        return jsonify({
            'success': True,
            'message': 'Person updated successfully',
            'data': PersonModel.to_response(updated_person)
        })
        
    except InvalidId:
        return jsonify({'success': False, 'error': 'Invalid person ID'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@people_bp.route('/<person_id>', methods=['DELETE'])
def delete_person(person_id):
    """Delete a person and optionally their images."""
    try:
        delete_images = request.args.get('delete_images', 'false').lower() == 'true'
        
        person = mongo.db.people.find_one({'_id': ObjectId(person_id)})
        if not person:
            return jsonify({'success': False, 'error': 'Person not found'}), 404
        
        if delete_images:
            # Delete all images associated with this person
            from app.services.cloudinary_service import delete_image
            
            images = mongo.db.images.find({'person_id': ObjectId(person_id)})
            for image in images:
                delete_image(image.get('cloudinary_public_id'))
            
            mongo.db.images.delete_many({'person_id': ObjectId(person_id)})
        else:
            # Just unassign images from this person
            mongo.db.images.update_many(
                {'person_id': ObjectId(person_id)},
                {'$set': {'person_id': None, 'is_identified': False, 'updated_at': datetime.utcnow()}}
            )
        
        # Delete the person
        mongo.db.people.delete_one({'_id': ObjectId(person_id)})
        
        return jsonify({
            'success': True,
            'message': f'Person deleted successfully. Images {"deleted" if delete_images else "unassigned"}.'
        })
        
    except InvalidId:
        return jsonify({'success': False, 'error': 'Invalid person ID'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@people_bp.route('/<person_id>/images', methods=['GET'])
def get_person_images(person_id):
    """Get all images for a specific person."""
    try:
        person = mongo.db.people.find_one({'_id': ObjectId(person_id)})
        if not person:
            return jsonify({'success': False, 'error': 'Person not found'}), 404
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        skip = (page - 1) * per_page
        
        images = list(
            mongo.db.images.find({'person_id': ObjectId(person_id)})
            .sort('created_at', -1)
            .skip(skip)
            .limit(per_page)
        )
        
        total = mongo.db.images.count_documents({'person_id': ObjectId(person_id)})
        
        return jsonify({
            'success': True,
            'data': [ImageModel.to_response(img) for img in images],
            'person': PersonModel.to_response(person),
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except InvalidId:
        return jsonify({'success': False, 'error': 'Invalid person ID'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
