import { inject, Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PhotoService } from './photo.service';
import { ReceiptInterface, ReceiptItem } from "../interfaces/receipt.interface";


@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  public receipts: ReceiptInterface[] = [];
  private RECEIPT_STORAGE: string = 'receipts';

  private photoService: PhotoService;

  constructor() {
    this.photoService = inject(PhotoService);
  }
  /**
   * Create a new receipt with a photo
   */
  public async createReceipt(): Promise<ReceiptInterface> {
    try {
      // Capture and save the photo
      const photo = await this.photoService.captureAndSavePhoto();

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

      // Save to storage
      await this.saveReceipts();

      return receipt;
    } catch (error) {
      console.error('Error creating receipt:', error);
      throw error;
    }
  }

  /**
   * Load all receipts from storage
   */
  public async loadReceipts(): Promise<void> {
    try {
      const { value: receiptList } = await Preferences.get({
        key: this.RECEIPT_STORAGE,
      });

      this.receipts = (receiptList ? JSON.parse(receiptList) : []) as ReceiptInterface[];

      // Load photo data for each receipt
      for (let i = 0; i < this.receipts.length; i++) {
        this.receipts[i].photo = await this.photoService.loadPhoto(
          this.receipts[i].photo
        );
      }
    } catch (error) {
      console.error('Error loading receipts:', error);
      this.receipts = [];
    }
  }

  /**
   * Update an existing receipt
   */
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

  /**
   * Update receipt with OCR data
   */
  public async updateReceiptWithOCR(
    id: string,
    ocrData: {
      storeName?: string;
      totalAmount?: number;
      date?: string;
      items?: ReceiptItem[];
    }
  ): Promise<ReceiptInterface | null> {
    return this.updateReceipt(id, {
      ...ocrData,
      ocrProcessed: true,
    });
  }

  /**
   * Delete a receipt and its photo
   */
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

  /**
   * Get a receipt by ID
   */
  public getReceiptById(id: string): ReceiptInterface | undefined {
    return this.receipts.find((r) => r.id === id);
  }

  /**
   * Get receipts by store name
   */
  public getReceiptsByStore(storeName: string): ReceiptInterface[] {
    return this.receipts.filter(
      (r) => r.storeName?.toLowerCase() === storeName.toLowerCase()
    );
  }

  /**
   * Get receipts by date range
   */
  public getReceiptsByDateRange(startDate: string, endDate: string): ReceiptInterface[] {
    return this.receipts.filter((r) => {
      if (!r.date) return false;
      return r.date >= startDate && r.date <= endDate;
    });
  }

  /**
   * Get total spending
   */
  public getTotalSpending(): number {
    return this.receipts.reduce((total, receipt) => {
      return total + (receipt.totalAmount || 0);
    }, 0);
  }

  /**
   * Get total spending by store
   */
  public getTotalSpendingByStore(): Map<string, number> {
    const storeSpending = new Map<string, number>();

    this.receipts.forEach((receipt) => {
      if (receipt.storeName && receipt.totalAmount) {
        const current = storeSpending.get(receipt.storeName) || 0;
        storeSpending.set(receipt.storeName, current + receipt.totalAmount);
      }
    });

    return storeSpending;
  }

  /**
   * Save receipts to storage
   */
  private async saveReceipts(): Promise<void> {
    await Preferences.set({
      key: this.RECEIPT_STORAGE,
      value: JSON.stringify(this.receipts),
    });
  }

  /**
   * Generate a unique ID for receipts
   */
  private generateId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
