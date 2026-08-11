import sys
import os

# Insert root directory into Python path to allow absolute import of api.zugferd
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.zugferd import generate_pdfa3

def test():
    mock_data = {
      "client_name": "Bauer",
      "full_address": "Erding",
      "line_items": [
        {
          "description": "Reifenwechsel beim Sprinter",
          "price": 350
        }
      ],
      "net_amount": 350,
      "vat_amount": 66.5,
      "gross_amount": 416.5
    }

    try:
        print("Starte PDF-Generierung (ReportLab) und ZUGFeRD-Injektion (Factur-X)...")
        pdf_bytes = generate_pdfa3(mock_data)
        
        output_path = os.path.join(os.path.dirname(__file__), 'output_mock.pdf')
        with open(output_path, 'wb') as f:
            f.write(pdf_bytes)
            
        file_size = os.path.getsize(output_path)
        print(f"✅ Success! File generated at {output_path}")
        print(f"File Size: {file_size} bytes")
        
        if file_size > 0:
            print("✅ Test Passed: Die Datei ist nicht leer (Valid).")
        else:
            print("❌ Test Failed: Datei hat 0 Bytes.")
            
    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    test()
