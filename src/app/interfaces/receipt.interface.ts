import { PhotoInterface } from './photo.interface';
import {TextDetection} from "@capacitor-community/image-to-text";

export interface ReceiptInterface {
  id: string;
  photo: PhotoInterface;

  storeName?: string;
  totalAmount?: number;
  date?: string;

  createdAt?: string;

  ocrProcessed?: boolean;
  ocrString?: string;
  ocrTextDetections?: TextDetection[];
}
