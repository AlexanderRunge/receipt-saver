import { inject, Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PhotoService } from './photo.service';
import { ReceiptInterface } from "../interfaces/receipt.interface";
import {OcrService} from "./ocr.service";


@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  public receipts: ReceiptInterface[] = [];
  private RECEIPT_STORAGE: string = 'receipts';

  private photoService: PhotoService;
  private ocrService: OcrService;

  constructor() {
    this.photoService = inject(PhotoService);
    this.ocrService = inject(OcrService);
  }

  public async createReceipt(): Promise<ReceiptInterface> {
    try {
      console.log('=== Creating receipt (no OCR) ===');

      // Capture and save the photo
      const photo = await this.photoService.captureAndSavePhoto();
      console.log('Photo saved:', photo.filepath);

      // Create the receipt
      const receipt: ReceiptInterface = {
        id: this.generateId(),
        photo: photo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ocrProcessed: false,
      };

      // Add to receipts array
      this.receipts.unshift(receipt);
      console.log('Receipt added. Total:', this.receipts.length);

      // Save to storage
      await this.saveReceipts();
      console.log('Receipt saved to storage');

      return receipt;
    } catch (error) {
      console.error('Error creating receipt:', error);
      throw error;
    }
  }

  public async loadReceipts(): Promise<void> {
    try {
      console.log('Loading receipts from storage...');

      const { value: receiptList } = await Preferences.get({
        key: this.RECEIPT_STORAGE,
      });

      console.log('Raw receipt data:', receiptList);

      this.receipts = (receiptList ? JSON.parse(receiptList) : []) as ReceiptInterface[];

      console.log('Parsed receipts count:', this.receipts.length);

      // Load photo data for each receipt
      for (let i = 0; i < this.receipts.length; i++) {
        console.log('Loading photo for receipt:', this.receipts[i].id);

        try {
          this.receipts[i].photo = await this.photoService.loadPhoto(
            this.receipts[i].photo
          );
          console.log('Photo loaded successfully for:', this.receipts[i].id);
        } catch (photoError) {
          console.error('Error loading photo for receipt:', this.receipts[i].id, photoError);
          // Keep the receipt even if photo loading fails
        }
      }

      console.log('All receipts loaded. Final count:', this.receipts.length);
    } catch (error) {
      console.error('Error loading receipts:', error);
      this.receipts = [];
    }
  }

  public async updateReceipt(
    id: string,
    updates: Partial<Omit<ReceiptInterface, 'id' | 'createdAt'>>
  ): Promise<ReceiptInterface | null> {
    try {
      const index = this.receipts.findIndex((r) => r.id === id);

      if (index === -1) {
        console.error('Receipt not found:', id);
        return null;
      }

      this.receipts[index] = {
        ...this.receipts[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.saveReceipts();

      return this.receipts[index];
    } catch (error) {
      console.error('Error updating receipt:', error);
      throw error;
    }
  }


  public async deleteReceipt(id: string): Promise<void> {
    try {
      const index = this.receipts.findIndex((r) => r.id === id);

      if (index === -1) {
        console.error('Receipt not found:', id);
        return;
      }

      const receipt = this.receipts[index];

      // Delete the photo from filesystem
      await this.photoService.deletePhoto(receipt.photo);

      // Remove from array
      this.receipts.splice(index, 1);

      // Save updated list
      await this.saveReceipts();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      throw error;
    }
  }

  private async saveReceipts(): Promise<void> {
    try {
      console.log('=== saveReceipts called ===');
      console.log('Number of receipts to save:', this.receipts.length);

      if (this.receipts.length === 0) {
        console.warn('WARNING: Trying to save empty receipts array!');
      }

      const dataToSave = JSON.stringify(this.receipts);
      console.log('Stringified data length:', dataToSave.length);
      console.log('First 200 chars of data:', dataToSave.substring(0, 200));

      await Preferences.set({
        key: this.RECEIPT_STORAGE,
        value: dataToSave,
      });

      console.log('Preferences.set completed');

      // Immediate verification
      const { value: verification } = await Preferences.get({
        key: this.RECEIPT_STORAGE,
      });

      console.log('Immediate verification after save:', verification?.substring(0, 200));
      console.log('Saved successfully:', verification === dataToSave);

    } catch (error) {
      console.error('Error in saveReceipts:', error);
      throw error;
    }
  }

  public async processOCR(receiptId: string): Promise<void> {
    console.log('=== Processing OCR for receipt:', receiptId, '===');

    const receipt = this.getReceiptById(receiptId);
    if (!receipt) {
      console.error('Receipt not found:', receiptId);
      throw new Error('Receipt not found');
    }

    try {
      console.log('Step 1: Extracting text from image...');
      console.log('Filepath:', receipt.photo.filepath);

      const ocrText = await this.ocrService.getTextDetectionsInString(receipt.photo.filepath);
      console.log('Step 1 DONE. Text length:', ocrText.length);
      console.log('Extracted text:', ocrText);

      console.log('Step 2: Parsing receipt data...');
      const receiptData = this.ocrService.parseReceiptData(ocrText);
      console.log('Step 2 DONE. Parsed data:', JSON.stringify(receiptData, null, 2));

      console.log('Step 3: Updating receipt...');
      await this.updateReceipt(receiptId, {
        ...receiptData,
        ocrProcessed: true,
      });
      console.log('Step 3 DONE. Receipt updated');

      console.log('=== OCR processing complete ===');

    } catch (error: any) {
      console.error('=== OCR ERROR ===');
      console.error('Error:', error?.message || error);
      console.error('Stack:', error?.stack);

      // Mark as processed even if failed
      await this.updateReceipt(receiptId, {
        ocrProcessed: true,
      });

      throw error;
    }
  }

  public getReceiptById(id: string): ReceiptInterface | undefined {
    return this.receipts.find((r) => r.id === id);
  }

  public getReceiptsByStore(storeName: string): ReceiptInterface[] {
    return this.receipts.filter(
      (r) => r.storeName?.toLowerCase() === storeName.toLowerCase()
    );
  }

/*  public getReceiptsByDateRange(startDate: string, endDate: string): ReceiptInterface[] {
    return this.receipts.filter((r) => {
      if (!r.date) return false;
      return r.date >= startDate && r.date <= endDate;
    });
  }*/

/*  public getTotalSpending(): number {
    return this.receipts.reduce((total, receipt) => {
      return total + (receipt.totalAmount || 0);
    }, 0);
  }*/

/*  public getTotalSpendingByStore(): Map<string, number> {
    const storeSpending = new Map<string, number>();

    this.receipts.forEach((receipt) => {
      if (receipt.storeName && receipt.totalAmount) {
        const current = storeSpending.get(receipt.storeName) || 0;
        storeSpending.set(receipt.storeName, current + receipt.totalAmount);
      }
    });

    return storeSpending;
  }*/

  private generateId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
