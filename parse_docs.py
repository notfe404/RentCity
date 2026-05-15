import pandas as pd
import PyPDF2
import os

with open('excel_content.txt', 'w') as f:
    df = pd.read_excel('Rent-City_Backend_Task_Tracker.xlsx', sheet_name=None)
    for sheet_name, data in df.items():
        f.write(f"\n--- Sheet: {sheet_name} ---\n")
        f.write(data.to_csv(index=False))

with open('pdf_content.txt', 'w') as f:
    for pdf_file in ['RentCity_ERD_Explanation.pdf', 'RentCity_ERD_MVP.pdf']:
        try:
            reader = PyPDF2.PdfReader(pdf_file)
            f.write(f"\n--- PDF: {pdf_file} ---\n")
            for i, page in enumerate(reader.pages):
                f.write(f"\nPage {i+1}:\n")
                f.write(page.extract_text() + "\n")
        except Exception as e:
            f.write(f"\nCould not read {pdf_file}: {e}\n")

print("Done")
