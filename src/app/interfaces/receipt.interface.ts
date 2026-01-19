import { PhotoInterface } from './photo.interface';

export interface ReceiptInterface {
  id: string;
  photo: PhotoInterface;

  storeName?: string;
  totalAmount?: number;
  date?: string;

  createdAt: string;
  updatedAt: string;

  ocrProcessed: boolean;
}
