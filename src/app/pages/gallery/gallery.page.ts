import {Component, inject, OnInit} from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg,
  ActionSheetController
} from '@ionic/angular/standalone';
import type { PhotoInterface } from '../../interfaces/photo.interface'
import { PhotoService } from '../../services/photo.service';
import { ReceiptService } from '../../services/receipt.service';
import { addIcons } from "ionicons";
import { camera } from 'ionicons/icons';

@Component({
  selector: 'app-gallery',
  templateUrl: 'gallery.page.html',
  styleUrls: ['gallery.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonImg]
})

export class GalleryPage implements OnInit {
  public photoService = inject(PhotoService);
  public receiptService = inject(ReceiptService);
  public actionSheetController = inject(ActionSheetController);

  constructor() {
    addIcons({ camera });
  }

  async ngOnInit() {
    await this.receiptService.loadReceipts();
  }

  get photos(): PhotoInterface[] {
    return this.receiptService.receipts.map(receipt => receipt.photo);
  }

  get photosWithContext() {
    return this.receiptService.receipts.map(receipt => ({
      photo: receipt.photo,
      storeName: receipt.storeName,
      date: receipt.date,
      receiptId: receipt.id
    }));
  }

  public async showActionSheet(photo: PhotoInterface) {
    /*const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.photoService.deletePhoto(photo, position);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {},
        },
      ],
    });
    await actionSheet.present();*/
  }
}
