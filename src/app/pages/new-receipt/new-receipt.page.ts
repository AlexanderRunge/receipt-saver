import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavController } from '@ionic/angular';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";
import { PhotoService } from '../../services/photo.service'; // Adjust path
import { PhotoInterface } from '../../interfaces/photo.interface';
import { addIcons } from "ionicons";
import { close, cameraOutline, informationCircleOutline, arrowBack } from "ionicons/icons";
import {OcrService} from "../../services/ocr.service"; // Adjust path
import {ReceiptService} from "../../services/receipt.service"; // Adjust path

@Component({
  selector: 'app-new-receipt',
  templateUrl: './new-receipt.page.html',
  styleUrls: ['./new-receipt.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonText,
    IonFabButton,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
  ]
})
export class NewReceiptPage {
  receiptForm: FormGroup;
  photoPreview: string | null = null;
  selectedPhoto: PhotoInterface | null = null;
  isSubmitting = false;

  private ocrProcessed: boolean = false;
  private ocrString: string = '';

  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly navCtrl: NavController = inject(NavController);
  private readonly photoService: PhotoService = inject(PhotoService);
  private readonly ocrService: OcrService = inject(OcrService);
  private readonly receiptService: ReceiptService = inject(ReceiptService);

  constructor() {
    addIcons({ cameraOutline, close, informationCircleOutline, arrowBack });
    this.receiptForm = this.fb.group({
      storeName: [''],
      totalAmount: ['', [Validators.min(0)]],
      date: ['']
    });
  }

  async capturePhoto(): Promise<void> {
    try {
      this.selectedPhoto = await this.photoService.captureAndSavePhoto();
      const loadedPhoto = await this.photoService.loadPhoto(this.selectedPhoto);
      this.photoPreview = loadedPhoto.webviewPath || null;
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  }

  removePhoto(): void {
    if (this.selectedPhoto) {
      this.photoService.deletePhoto(this.selectedPhoto)
    }
    this.selectedPhoto = null;
    this.photoPreview = null;
  }

  async runOcrOnPhoto(): Promise<void> {
    // Show loading state
    this.receiptForm.patchValue({ storeName: 'Processing...' });

    let ocrText;
    if (this.selectedPhoto) {
      ocrText = await this.ocrService.getTextDetectionsInString(this.selectedPhoto.filepath);
      ocrText = this.ocrString;
    }

    let receiptData;
    if (ocrText) {
      receiptData = this.ocrService.parseReceiptData(ocrText);
    }

    if (receiptData) {
      this.ocrProcessed = true;
      this.receiptForm.patchValue({
        storeName: receiptData.storeName,
        totalAmount: receiptData.totalAmount,
        date: receiptData.date
      });
    } else {
      // Clear loading state if no data found
      this.receiptForm.patchValue({ storeName: '' });
    }
  }

  async onSubmit(): Promise<void> {
    // Prevent multiple submissions
    if (this.isSubmitting) {
      return;
    }

    // Validate that a photo exists
    if (!this.selectedPhoto) {
      console.error('No photo selected');
      // Optionally show a toast/alert to the user
      return;
    }

    try {
      this.isSubmitting = true;

      // Create the receipt with the photo
      const receipt = await this.receiptService.createReceipt(this.selectedPhoto);

      // Update the receipt with form data
      const formValue = this.receiptForm.value;
      await this.receiptService.updateReceipt(receipt.id, {
        storeName: formValue.storeName || undefined,
      });

      // Save all receipts to storage
      await this.receiptService['saveReceipts']();

      // Clear form and photo
      this.selectedPhoto = null;
      this.photoPreview = null;
      this.receiptForm.reset();

      // Navigate back
      this.navCtrl.back();

    } catch (error) {
      console.error('Error saving receipt:', error);
      // Optionally show error message to user
    } finally {
      this.isSubmitting = false;
    }
  }

  cancel(): void {
    if (this.selectedPhoto) {
      this.photoService.deletePhoto(this.selectedPhoto)
    }
    this.selectedPhoto = null;
    this.photoPreview = null;

    this.navCtrl.back();
  }
}
