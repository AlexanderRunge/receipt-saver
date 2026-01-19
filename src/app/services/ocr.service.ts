import { inject, Injectable } from '@angular/core';
import { Ocr, TextDetections } from '@capacitor-community/image-to-text';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class OcrService {
  private platform = inject(Platform);
  constructor() {}

  async getTextDetectionsInString(filepath: string): Promise<string> {
    try {
      const data: TextDetections = await Ocr.detectText({
        filename: filepath,
      });

      // Combine all detected text into a single string
      let fullText = '';
      for (const detection of data.textDetections) {
        fullText += detection.text + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw error;
    }
  }

  async getTextDetectionsInList(filepath: string): Promise<TextDetections> {
    try {
      const data: TextDetections = await Ocr.detectText({ filename: filepath });
      return data;
    } catch (error) {
      console.error('Error getting text detections:', error);
      throw error;
    }
  }

  parseReceiptData(ocrText: string): {
    storeName?: string;
    totalAmount?: number;
    date?: string;
  } {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const receiptData: {
      storeName?: string;
      totalAmount?: number;
      date?: string;
    } = {};

    // Extract store name (usually first few lines)
    if (lines.length > 0) {
      receiptData.storeName = lines[0];
    }

    // Extract date (look for common date patterns)
    const dateRegex = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/;
    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        receiptData.date = this.normalizeDate(dateMatch[0]);
        break;
      }
    }

    // Extract total (look for keywords like "total", "amount due", etc.)
    const totalRegex = /(?:total|amount due|balance|sum|subtotal|ialt|i alt)[\s:]*(\d+[.,]\d{2})/i;
    for (const line of lines) {
      const totalMatch = line.match(totalRegex);
      if (totalMatch) {
        receiptData.totalAmount = parseFloat(totalMatch[1].replace(',', '.'));
        break;
      }
    }

    // Extract items (look for lines with prices)
    //receiptData.items = this.extractItems(lines);

    return receiptData;
  }

  private normalizeDate(dateString: string): string {
    // Basic date normalization - you may want to enhance this
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }
    return dateString;
  }
}
