import { Component, inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonGrid, IonRow, IonCol, IonImg,
  ActionSheetController
} from '@ionic/angular/standalone';
import type { UserPhoto } from '../services/photo.service'
import { PhotoService } from '../services/photo.service';
import { addIcons } from "ionicons";
import { camera } from 'ionicons/icons';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonGrid, IonRow, IonCol, IonImg]
})

export class Tab2Page {
  public photoService = inject(PhotoService);
  public actionSheetController = inject(ActionSheetController);

  constructor() {
    addIcons({ camera });
  }

  async ngOnInit() {
    await this.photoService.loadSaved()
  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  public async showActionSheet(photo: UserPhoto, position: number) {
    const actionSheet = await this.actionSheetController.create({
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
    await actionSheet.present();
  }
}
