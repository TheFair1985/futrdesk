import json
import io
import os
import tempfile
from http.server import BaseHTTPRequestHandler
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from facturx import generate_facturx_from_binary

def create_invoice_pdf(data):
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=A4)
    can.setFont("Helvetica-Bold", 16)
    can.drawString(50, 800, "Rechnung")
    
    can.setFont("Helvetica", 12)
    can.drawString(50, 780, f"Kunde: {data.get('client_name', '')}")
    can.drawString(50, 760, f"Adresse: {data.get('full_address', '')}")
    
    y = 720
    can.setFont("Helvetica-Bold", 12)
    can.drawString(50, y, "Positionen:")
    y -= 20
    
    can.setFont("Helvetica", 12)
    for item in data.get('line_items', []):
        can.drawString(50, y, f"{item.get('description', '')} - {item.get('price', 0):.2f} EUR")
        y -= 20
        
    y -= 20
    can.setFont("Helvetica-Bold", 12)
    can.drawString(50, y, f"Netto: {data.get('net_amount', 0):.2f} EUR")
    can.drawString(50, y-20, f"MwSt (19%): {data.get('vat_amount', 0):.2f} EUR")
    can.drawString(50, y-40, f"Brutto: {data.get('gross_amount', 0):.2f} EUR")
    
    can.save()
    packet.seek(0)
    return packet

def create_zugferd_xml(data):
    # Minimalistic ZUGFeRD XML (BASIC WL) 
    # Für echten produktiven Einsatz würde dieses Profil komplett ausformuliert werden.
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>INV-123</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20260810</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
</rsm:CrossIndustryInvoice>"""
    return xml.encode('utf-8')

def generate_pdfa3(data):
    pdf_io = create_invoice_pdf(data)
    xml_bytes = create_zugferd_xml(data)
    
    try:
        # Generate factur-x PDF/A-3 from binary buffers
        pdf_a3_bytes = generate_facturx_from_binary(pdf_io.read(), xml_bytes)
        if isinstance(pdf_a3_bytes, tuple):
            pdf_a3_bytes = pdf_a3_bytes[0]
            
        return pdf_a3_bytes
    except Exception as e:
        print("Factur-X Injection Failed:", e)
        # Fallback to regular PDF without XML if generation fails
        pdf_io.seek(0)
        return pdf_io.read()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        pdf_a3_bytes = generate_pdfa3(data)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/pdf')
        self.end_headers()
        self.wfile.write(pdf_a3_bytes)
