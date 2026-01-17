import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { Platform } from "@ionic/angular"
import { Capacitor } from "@capacitor/core";

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos: UserPhoto[] = [];

  private PHOTO_STORAGE: string = 'photos';

  private platform: Platform;

  constructor() {
    this.platform = inject(Platform);
  }

  public async addNewToGallery() {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      quality: 100,
    });

    const savedPhotoFile = await this.savePhoto(capturedPhoto);

    this.photos.unshift(savedPhotoFile);

    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }

  private async savePhoto(photo: Photo) {
    let base64Data: string | Blob;

    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!,
      });
      base64Data = file.data;
    } else {
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      base64Data = await this.convertBlobToBase64(blob) as string;
    }

    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid')) {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
      };
    }
  }

  private convertBlobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = ()=> {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  }

  public async loadSaved() {
    const { value: photoList } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (photoList ? JSON.parse(photoList) : []) as UserPhoto[];

    if (this.platform.is('hybrid')) {
      for (let photo of this.photos) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });

        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  public async deletePhoto(photo: UserPhoto, position: number) {
    this.photos.splice(position, 1);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    const filename = photo.filepath.slice(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}
