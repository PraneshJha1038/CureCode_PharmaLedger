from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models import db, MedicineBatch, Manufacturer, Pharmacy
import os
from sqlalchemy import text
from datetime import datetime
from werkzeug.utils import secure_filename

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)
    db.init_app(app)
    
    upload_folders = [
        os.path.join('static', 'uploads', 'manufacturers'),
        os.path.join('static', 'uploads', 'pharmacies')
    ]
    for folder in upload_folders:
        os.makedirs(folder, exist_ok=True)
    
    register_routes(app)
    return app

def register_routes(app):
    
    @app.route('/')
    def home():
        return jsonify({
            'message': 'PharmaLedger Backend is running successfully!',
            'status': 'active',
            'version': '1.0.0'
        })
    
    @app.route('/api/health')
    def health_check():
        try:
            db.session.execute(text('SELECT 1'))
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    @app.route('/api/verify-batch', methods=['GET'])
    def verify_batch():
        try:
            batch_number = request.args.get('batch_number', '').strip()
            if not batch_number:
                return jsonify({
                    'success': False,
                    'message': 'Batch number is required'
                }), 400
            
            batch = MedicineBatch.query.filter_by(batch_number=batch_number.upper()).first()
            
            if not batch:
                return jsonify({
                    'success': False,
                    'isAuthentic': False,
                    'message': 'Batch number not found in database',
                    'batchNumber': batch_number
                }), 404
            
            is_expired = batch.expiry_date < datetime.utcnow().date()
            
            return jsonify({
                'success': True,
                'isAuthentic': not is_expired,
                'batchNumber': batch.batch_number,
                'productName': batch.medicine_name,
                'manufacturer': 'Verified Manufacturer',
                'manufactureDate': batch.manufacture_date.strftime('%Y-%m-%d'),
                'expiryDate': batch.expiry_date.strftime('%Y-%m-%d'),
                'status': 'Expired' if is_expired else 'Authentic',
                'pharmacyName': batch.pharmacy_name,
                'dateUploaded': batch.date_uploaded.strftime('%Y-%m-%d %H:%M:%S') if batch.date_uploaded else None
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Internal server error',
                'error': str(e)
            }), 500
    
    @app.route('/api/batches', methods=['GET'])
    def get_all_batches():
        try:
            batches = MedicineBatch.query.all()
            return jsonify({
                'success': True,
                'count': len(batches),
                'batches': [batch.to_dict() for batch in batches]
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error fetching batches',
                'error': str(e)
            }), 500

    # route for registering manufacturers
    @app.route('/api/register-manufacturer', methods=['POST'])
    def register_manufacturer():
        print("Manufacturer registration route called")
        try:
            from datetime import date
            
            form_data = request.form
            files = request.files
            
            print("=== RECEIVED DATA ===")
            print("Form fields:", dict(form_data))
            print("Files:", list(files.keys()))
            
            required = ['company-name', 'license-number', 'contact-name',
                       'contact-phone', 'contact-email', 'password']
            
            for field in required:
                if not form_data.get(field):
                    return jsonify({
                        'success': False,
                        'error': f'{field.replace("-", " ").title()} is required'
                    }), 400
            
            if Manufacturer.query.filter_by(contact_email=form_data.get('contact-email').strip().lower()).first():
                return jsonify({'success': False, 'error': 'Email already registered'}), 409
            
            if Manufacturer.query.filter_by(contact_phone=form_data.get('contact-phone').strip()).first():
                return jsonify({'success': False, 'error': 'Phone already registered'}), 409
            
            if Manufacturer.query.filter_by(license_number=form_data.get('license-number').strip()).first():
                return jsonify({'success': False, 'error': 'License already registered'}), 409
            
            license_file_path = None
            if 'license-document' in files:
                file = files['license-document']
                if file and file.filename:
                    filename = secure_filename(f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
                    folder = os.path.join('static', 'uploads', 'manufacturers')
                    os.makedirs(folder, exist_ok=True)
                    file.save(os.path.join(folder, filename))
                    license_file_path = f'/static/uploads/manufacturers/{filename}'
            
            license_expiry = None
            if form_data.get('license-expiry'):
                try:
                    license_expiry = date.fromisoformat(form_data.get('license-expiry'))
                except:
                    pass
            
            manufacturer = Manufacturer(
                company_name=form_data.get('company-name', '').strip(),
                license_number=form_data.get('license-number', '').strip(),
                license_authority=form_data.get('license-authority', '').strip() or None,
                license_expiry=license_expiry,
                gstin=form_data.get('gstin', '').strip().upper() or None,
                pan=form_data.get('pan', '').strip().upper() or None,
                factory_address=form_data.get('factory-address', '').strip() or None,
                registered_address=form_data.get('registered-address', '').strip() or None,
                contact_name=form_data.get('contact-name', '').strip(),
                contact_designation=form_data.get('contact-designation', '').strip() or None,
                contact_phone=form_data.get('contact-phone', '').strip(),
                contact_email=form_data.get('contact-email', '').strip().lower(),
                official_email=form_data.get('official-email', '').strip().lower() or None,
                website=form_data.get('website', '').strip() or None,
                company_profile=form_data.get('company-profile', '').strip() or None,
                certifications=form_data.get('certifications', '').strip() or None,
                license_file=license_file_path,
                status='pending'
            )
            
            manufacturer.set_password(form_data.get('password'))
            
            db.session.add(manufacturer)
            db.session.commit()
            
            print(f"✓ Saved: {manufacturer.company_name} (ID: {manufacturer.id})")
            
            return jsonify({
                'success': True,
                'message': 'Registration successful!',
                'manufacturer_id': manufacturer.id,
                'registration_id': f'MFG-{manufacturer.id:06d}'
            }), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': 'Registration failed. Please try again.'
            }), 500
    
    @app.route('/api/register-pharmacy', methods=['POST'])
    def register_pharmacy():
        print("Pharmacy registration route called")
        try:
            from datetime import date
            
            
            form_data = request.form
            files = request.files

            # for me to know it's working
            print("=== RECEIVED PHARMACY DATA ===")
            print("Form fields:", dict(form_data))
            print("Files:", list(files.keys()))
            
            required = ['pharmacy-name', 'pharmacy-type', 'license-number', 
                       'owner-name', 'contact-name', 'contact-phone', 
                       'contact-email', 'password']
            
            for field in required:
                if not form_data.get(field):
                    return jsonify({
                        'success': False,
                        'error': f'{field.replace("-", " ").title()} is required'
                    }), 400
            
            if Pharmacy.query.filter_by(contact_email=form_data.get('contact-email').strip().lower()).first():
                return jsonify({'success': False, 'error': 'Email already registered'}), 409
            
            if Pharmacy.query.filter_by(contact_phone=form_data.get('contact-phone').strip()).first():
                return jsonify({'success': False, 'error': 'Phone already registered'}), 409
            
            if Pharmacy.query.filter_by(license_number=form_data.get('license-number').strip()).first():
                return jsonify({'success': False, 'error': 'License already registered'}), 409
            
            license_file_path = None
            if 'license-document' in files:
                file = files['license-document']
                if file and file.filename:
                    filename = secure_filename(f"{datetime.now().strftime('%Y%m%d%H%M%S')}_license_{file.filename}")
                    folder = os.path.join('static', 'uploads', 'pharmacies')
                    os.makedirs(folder, exist_ok=True)
                    file.save(os.path.join(folder, filename))
                    license_file_path = f'/static/uploads/pharmacies/{filename}'
            
            pharmacist_cert_path = None
            if 'pharmacist-certificate' in files:
                file = files['pharmacist-certificate']
                if file and file.filename:
                    filename = secure_filename(f"{datetime.now().strftime('%Y%m%d%H%M%S')}_pharmacist_{file.filename}")
                    folder = os.path.join('static', 'uploads', 'pharmacies')
                    os.makedirs(folder, exist_ok=True)
                    file.save(os.path.join(folder, filename))
                    pharmacist_cert_path = f'/static/uploads/pharmacies/{filename}'
            
            other_docs_paths = []
            if 'other-documents' in files:
                other_files = request.files.getlist('other-documents')
                for file in other_files:
                    if file and file.filename:
                        filename = secure_filename(f"{datetime.now().strftime('%Y%m%d%H%M%S')}_other_{file.filename}")
                        folder = os.path.join('static', 'uploads', 'pharmacies')
                        os.makedirs(folder, exist_ok=True)
                        file.save(os.path.join(folder, filename))
                        other_docs_paths.append(f'/static/uploads/pharmacies/{filename}')
            
            license_expiry = None
            if form_data.get('license-expiry'):
                try:
                    license_expiry = date.fromisoformat(form_data.get('license-expiry'))
                except:
                    pass
            
            pharmacy = Pharmacy(
                pharmacy_name=form_data.get('pharmacy-name', '').strip(),
                pharmacy_type=form_data.get('pharmacy-type', '').strip() or None,
                license_number=form_data.get('license-number', '').strip(),
                license_authority=form_data.get('license-authority', '').strip() or None,
                license_expiry=license_expiry,
                gstin=form_data.get('gstin', '').strip().upper() or None,
                pharmacy_address=form_data.get('pharmacy-address', '').strip(),
                operating_hours=form_data.get('operating-hours', '').strip() or None,
                website=form_data.get('website', '').strip() or None,
                pharmacy_description=form_data.get('pharmacy-description', '').strip() or None,
                owner_name=form_data.get('owner-name', '').strip(),
                owner_pan=form_data.get('owner-pan', '').strip().upper() or None,
                contact_name=form_data.get('contact-name', '').strip(),
                contact_designation=form_data.get('contact-designation', '').strip() or None,
                contact_phone=form_data.get('contact-phone', '').strip(),
                contact_email=form_data.get('contact-email', '').strip().lower(),
                license_file=license_file_path,
                pharmacist_certificate=pharmacist_cert_path,
                other_documents=','.join(other_docs_paths) if other_docs_paths else None,
                certifications=form_data.get('other-certifications', '').strip() or None,
                status='pending'
            )
            
            pharmacy.set_password(form_data.get('password'))
            
            db.session.add(pharmacy)
            db.session.commit()
            
            print(f"✓ Saved: {pharmacy.pharmacy_name} (ID: {pharmacy.id})")
            
            return jsonify({
                'success': True,
                'message': 'Registration successful!',
                'pharmacy_id': pharmacy.id,
                'registration_id': f'PHR-{pharmacy.id:06d}'
            }), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': 'Registration failed. Please try again.'
            }), 500
    
    @app.route('/api/check-field', methods=['GET'])
    def check_field():
        """Check if email/phone/license exists for both manufacturers and pharmacies"""
        field = request.args.get('field')
        value = request.args.get('value', '').strip()
        entity_type = request.args.get('type', 'manufacturer')  
        
        if not field or not value:
            return jsonify({'exists': False})
        
        try:
            exists = False
            
            if entity_type == 'pharmacy':
                if field == 'email':
                    exists = Pharmacy.query.filter_by(contact_email=value.lower()).first()
                elif field == 'phone':
                    exists = Pharmacy.query.filter_by(contact_phone=value).first()
                elif field == 'license':
                    exists = Pharmacy.query.filter_by(license_number=value).first()
            else:  
                if field == 'email':
                    exists = Manufacturer.query.filter_by(contact_email=value.lower()).first()
                elif field == 'phone':
                    exists = Manufacturer.query.filter_by(contact_phone=value).first()
                elif field == 'license':
                    exists = Manufacturer.query.filter_by(license_number=value).first()
            
            return jsonify({'exists': bool(exists)})
        except Exception as e:
            print(f"Check field error: {str(e)}")
            return jsonify({'exists': False})

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✓ Database tables created!")
    app.run(debug=True, host='127.0.0.1', port=5000)
