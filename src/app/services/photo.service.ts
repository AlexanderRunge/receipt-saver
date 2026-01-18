import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Platform } from "@ionic/angular"
import { Capacitor } from "@capacitor/core";
import { PhotoInterface } from "../interfaces/photo.interface"

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private platform: Platform;

  constructor() {
    this.platform = inject(Platform);
  }

  /**
   * Capture a new photo and save it to the filesystem
   * Returns the saved photo reference without managing it in an internal array
   */
  public async captureAndSavePhoto(): Promise<PhotoInterface> {
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        quality: 100,
      });

      return await this.savePhoto(capturedPhoto);
    } catch (error) {
      console.error('Error capturing photo:', error);
      throw error;
    }
  }

  /**
   * Save a photo to the filesystem
   */
  private async savePhoto(photo: Photo): Promise<PhotoInterface> {
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

  /**
   * Load a photo from the filesystem for display
   */
  public async loadPhoto(photo: PhotoInterface): Promise<PhotoInterface> {
    if (this.platform.is('hybrid')) {
      const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data,
      });

      return {
        ...photo,
        webviewPath: `data:image/jpeg;base64,${readFile.data}`,
      };
    }

    return photo;
  }

  /**
   * Delete a photo from the filesystem
   */
  public async deletePhoto(photo: PhotoInterface): Promise<void> {
    try {
      const filename = photo.filepath.slice(photo.filepath.lastIndexOf('/') + 1);

      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Data,
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }
}
