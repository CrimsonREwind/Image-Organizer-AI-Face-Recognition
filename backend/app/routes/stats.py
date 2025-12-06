"""Statistics and dashboard routes."""
from flask import Blueprint, jsonify
from datetime import datetime, timedelta

from app import mongo
from app.models import PersonModel, ImageModel

stats_bp = Blueprint('stats', __name__)


@stats_bp.route('', methods=['GET'])
def get_stats():
    """Get dashboard statistics."""
    try:
        # Count totals
        total_images = mongo.db.images.count_documents({})
        total_people = mongo.db.people.count_documents({})
        identified_images = mongo.db.images.count_documents({'is_identified': True})
        unidentified_faces = mongo.db.images.count_documents({
            'has_face': True,
            'is_identified': False
        })
        
        # Calculate percentages
        identification_rate = (identified_images / total_images * 100) if total_images > 0 else 0
        
        return jsonify({
            'success': True,
            'data': {
                'total_images': total_images,
                'total_people': total_people,
                'identified_images': identified_images,
                'unidentified_faces': unidentified_faces,
                'identification_rate': round(identification_rate, 1)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@stats_bp.route('/recent', methods=['GET'])
def get_recent():
    """Get recent uploads."""
    try:
        # Get recent images (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_images = list(
            mongo.db.images.find({'created_at': {'$gte': week_ago}})
            .sort('created_at', -1)
            .limit(12)
        )
        
        # Get person info for identified images
        person_ids = [img['person_id'] for img in recent_images if img.get('person_id')]
        people = {str(p['_id']): p for p in mongo.db.people.find({'_id': {'$in': person_ids}})}
        
        for img in recent_images:
            if img.get('person_id') and str(img['person_id']) in people:
                img['person'] = people[str(img['person_id'])]
        
        return jsonify({
            'success': True,
            'data': [ImageModel.to_response(img, include_person=True) for img in recent_images]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@stats_bp.route('/unidentified', methods=['GET'])
def get_unidentified():
    """Get images with unidentified faces."""
    try:
        unidentified = list(
            mongo.db.images.find({
                'has_face': True,
                'is_identified': False
            })
            .sort('created_at', -1)
            .limit(12)
        )
        
        return jsonify({
            'success': True,
            'data': [ImageModel.to_response(img) for img in unidentified]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@stats_bp.route('/people-summary', methods=['GET'])
def get_people_summary():
    """Get people with most images."""
    try:
        people = list(
            mongo.db.people.find()
            .sort('image_count', -1)
            .limit(8)
        )
        
        return jsonify({
            'success': True,
            'data': [PersonModel.to_response(p) for p in people]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
