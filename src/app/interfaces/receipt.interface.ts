import { PhotoInterface } from './photo.interface';

export interface ReceiptInterface {
  id: string;
  photo: PhotoInterface;

  storeName?: string;
  totalAmount?: number;
  date?: string;

  items?: ReceiptItem[];

  createdAt: string;
  updatedAt: string;

  ocrProcessed: boolean;
}

export interface ReceiptItem {
  name: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}
