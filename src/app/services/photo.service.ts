import {inject, Injectable} from '@angular/core';
import {Camera, CameraDirection, CameraResultType, CameraSource, Photo} from '@capacitor/camera';
import {Directory, Filesystem} from "@capacitor/filesystem";
import {Platform} from "@ionic/angular"
import {Capacitor} from "@capacitor/core";
import {PhotoInterface} from "../interfaces/photo.interface"

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private platform: Platform;

  constructor() {
    this.platform = inject(Platform);
  }

  public async captureAndSavePhoto(): Promise<PhotoInterface> {
    try {
      console.log('=== Capturing photo ===');

      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        quality: 100,
        direction: CameraDirection.Rear,
      });

      console.log('Photo captured from camera:', {
        path: capturedPhoto.path,
        webPath: capturedPhoto.webPath,
        format: capturedPhoto.format,
      });

      const savedPhotoFile = await this.savePhoto(capturedPhoto);
      console.log('Photo saved to filesystem:', savedPhotoFile);

      return savedPhotoFile;
    } catch (error) {
      console.error('Error capturing photo:', error);
      throw error;
    }
  }

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
      base64Data = (await this.convertBlobToBase64(blob)) as string;
    }

    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    console.log('File saved. savedFile.uri:', savedFile.uri);

    if (this.platform.is('hybrid')) {
      // Store the full URI - this is what OCR needs
      return {
        filepath: savedFile.uri,  // Full file:// URI
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
      };
    }
  }

  public async loadPhoto(photo: PhotoInterface): Promise<PhotoInterface> {
    try {
      console.log('Loading photo. Filepath:', photo.filepath);

      if (this.platform.is('hybrid')) {
        // Extract just the filename from the URI
        let filename = photo.filepath;

        // Remove file:// protocol if present
        if (filename.startsWith('file://')) {
          filename = filename.replace('file://', '');
        }

        // Get just the filename (after last /)
        if (filename.includes('/')) {
          filename = filename.substring(filename.lastIndexOf('/') + 1);
        }

        console.log('Reading filename:', filename);

        const readFile = await Filesystem.readFile({
          path: filename,
          directory: Directory.Data,
        });

        return {
          ...photo,
          webviewPath: `data:image/jpeg;base64,${readFile.data}`,
        };
      }

      return photo;
    } catch (error) {
      console.error('Error loading photo:', error);
      return photo;
    }
  }

  public async deletePhoto(photo: PhotoInterface): Promise<void> {
    try {
      // Extract filename from filepath
      let filename = photo.filepath;

      // Remove file:// protocol
      if (filename.startsWith('file://')) {
        filename = filename.replace('file://', '');
      }

      // Get just the filename
      if (filename.includes('/')) {
        filename = filename.substring(filename.lastIndexOf('/') + 1);
      }

      console.log('Deleting file:', filename);

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
