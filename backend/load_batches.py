import os
import csv
import sys
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import sessionmaker

# database configuration ( removed all the info for privacy )
DB_CONFIG = {
    'user': '--',
    'password': '---',  
    'host': '---',
    'database': '---',
    'port': 3306
}

# connecting to Sql
ENGINE_URL = '--' # again removed the url link for privacy
CSV_FILE = 'medicine_batches.csv'  # csv file location wrt the backend folder

def load_batches_to_db():
    """
    Load CSV data into medicine_batches table. 
    """
    if not os.path.exists(CSV_FILE):
        print(f"✗ CSV file '{CSV_FILE}' not found in {os.getcwd()}")
        sys.exit(1)

    # printing to know the task has been done
    print("PharmaLedger - Medicine Batch Data Loader")
    print("=" * 60)
    print(f"Loading data from: {CSV_FILE}")
    print("-" * 60)

    
    engine = create_engine(ENGINE_URL, echo=False)  
    Session = sessionmaker(bind=engine) # for further development, hasn't been implemented yet
    session = Session()

    try:
        print("Clearing existing data...")
        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE medicine_batches"))
            conn.commit()
        print("✓ Table truncated successfully.")

        # using file handling to read the csv file and hence uploading to the database
        batches = []
        with open(CSV_FILE, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row_num, row in enumerate(reader, start=2):  # i started it from the second row to skep adding the header, because it is of no use and will construct an already existing error
                if not row or not any(row.values()):  # skiping the empty rows ( if any )
                    continue
                # preparing the batch data to be finally uploaded to the database
                batch_data = {
                    'medicine_id': int(row['medicine_id']) if row.get('medicine_id') else None, # planning to remove that none further, present as of now to skip error
                    'batch_number': row['batch_number'].strip().upper(),
                    'medicine_name': row['medicine_name'].strip(),
                    'manufacture_date': row['manufacture_date'],
                    'expiry_date': row['expiry_date'],
                    'pharmacy_name': row['pharmacy_name'].strip() if row.get('pharmacy_name') else None,
                    'date_uploaded': datetime.now(timezone.iso) # using iso date format as it's nation based as of now
                }
                batches.append(batch_data)
                if len(batches) % 5 == 0:
                    print(f"Read {len(batches)} rows...")

        if not batches:
            print("✗ No valid data found in CSV.")
            return

        print(f"Inserting {len(batches)} batches...")

        insert_sql = text("""
            INSERT INTO medicine_batches 
            (medicine_id, batch_number, medicine_name, manufacture_date, expiry_date, pharmacy_name, date_uploaded) 
            VALUES (:medicine_id, :batch_number, :medicine_name, :manufacture_date, :expiry_date, :pharmacy_name, :date_uploaded)
        """)

        with engine.connect() as conn:
            conn.execute(insert_sql, batches)  
            conn.commit()

        print("✓ Data loaded successfully!")
        print(f"Total batches inserted: {len(batches)}")

        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM medicine_batches")).scalar()
            print(f"DB verification: {result} rows in table.")

    except IntegrityError as e:
        session.rollback()
        print(f"✗ Integrity Error (e.g., duplicates): {e}")
        print("Tip: Ensure medicine_id in CSV is unique or let DB auto-increment.")
    except SQLAlchemyError as e:
        session.rollback()
        print(f"✗ Database Error: {e}")
    except FileNotFoundError:
        print(f"✗ CSV file not found: {CSV_FILE}")
    except Exception as e:
        session.rollback()
        print(f"✗ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()
        engine.dispose()

if __name__ == '__main__':
    load_batches_to_db()

# end of file
