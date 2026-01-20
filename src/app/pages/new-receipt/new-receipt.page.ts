import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavController } from '@ionic/angular';
import {
  IonBackButton,
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
    IonBackButton,
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

  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly navCtrl: NavController = inject(NavController);
  private readonly photoService: PhotoService = inject(PhotoService);
  private readonly ocrService: OcrService = inject(OcrService);

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
    let ocrText;
    if (this.selectedPhoto) {
      ocrText = await this.ocrService.getTextDetectionsInString(this.selectedPhoto.filepath);
    }

    let receiptData;
    if (ocrText) {
      receiptData = this.ocrService.parseReceiptData(ocrText);
    }

    if (receiptData) {
      this.receiptForm.patchValue({
        storeName: receiptData.storeName,
        totalAmount: receiptData.totalAmount,
        date: receiptData.date
      });
    }
  }

  onSubmit(): void {
    // Your implementation here
    // Access form values: this.receiptForm.value
    // Access selected file: this.selectedFile
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
