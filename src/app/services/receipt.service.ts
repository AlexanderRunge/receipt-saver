import { inject, Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PhotoService } from './photo.service';
import { ReceiptInterface } from "../interfaces/receipt.interface";
import {OcrService} from "./ocr.service";
import {PhotoInterface} from "../interfaces/photo.interface";

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  public receipts: ReceiptInterface[] = [];
  private RECEIPT_STORAGE: string = 'receipts';

  private readonly photoService = inject(PhotoService);
  private readonly ocrService = inject(OcrService);

  public async createReceipt(photo: PhotoInterface): Promise<ReceiptInterface> {
    try {
      const receipt: ReceiptInterface = {
        id: this.generateId(),
        photo: photo,
        createdAt: new Date().toISOString(),
        ocrProcessed: false,
      };

      this.receipts.unshift(receipt);

      return receipt;
    } catch (error) {
      throw error;
    }
  }

  public async loadReceipts(): Promise<void> {
    try {

      const { value: receiptList } = await Preferences.get({
        key: this.RECEIPT_STORAGE,
      });


      this.receipts = (receiptList ? JSON.parse(receiptList) : []) as ReceiptInterface[];


      // Load photo data for each receipt
      for (let i = 0; i < this.receipts.length; i++) {
        let receiptPhoto = this.receipts[i].photo;
        if (receiptPhoto) {
          try {
            receiptPhoto = await this.photoService.loadPhoto(receiptPhoto);
          } catch (photoError) {
            // Keep the receipt even if photo loading fails
          }
        }


      }

    } catch (error) {
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
        return null;
      }

      this.receipts[index] = {
        ...this.receipts[index],
        ...updates,
      };

      await this.saveReceipts();

      return this.receipts[index];
    } catch (error) {
      throw error;
    }
  }


  public async deleteReceipt(id: string): Promise<void> {
    try {
      const index = this.receipts.findIndex((r) => r.id === id);

      if (index === -1) {
        return;
      }

      const receipt = this.receipts[index];

      // Delete the photo from filesystem
      if (receipt.photo) {
        await this.photoService.deletePhoto(receipt.photo);
      }

      // Remove from array
      this.receipts.splice(index, 1);

      // Save updated list
      await this.saveReceipts();
    } catch (error) {
      throw error;
    }
  }

  private async saveReceipts(): Promise<void> {
    try {

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
      let ocrText;
      if (receipt.photo) {
        ocrText = await this.ocrService.getTextDetectionsInString(receipt.photo.filepath);
      }

      let receiptData;
      if (ocrText) {
        receiptData = this.ocrService.parseReceiptData(ocrText);
      }

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
