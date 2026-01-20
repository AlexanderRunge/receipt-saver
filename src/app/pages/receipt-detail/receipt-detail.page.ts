import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonImg,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  trashOutline,
  createOutline,
  refreshOutline
} from 'ionicons/icons';
import { ReceiptService } from '../../services/receipt.service';
import { ReceiptInterface } from '../../interfaces/receipt.interface';

@Component({
  selector: 'app-receipt-detail',
  templateUrl: './receipt-detail.page.html',
  styleUrls: ['./receipt-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonButtons,
    IonImg,
  ],
})
export class ReceiptDetailPage implements OnInit {
  receipt?: ReceiptInterface;

  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private receiptService = inject(ReceiptService);

  constructor() {
    addIcons({
      arrowBackOutline,
      trashOutline,
      createOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    const receiptId = this.route.snapshot.paramMap.get('id');
    if (receiptId) {
      this.loadReceipt(receiptId);
    }
  }

  loadReceipt(id: string) {
    this.receipt = this.receiptService.getReceiptById(id);
    if (!this.receipt) {
      console.error('Receipt not found');
      this.navCtrl.back();
    }
  }

  async deleteReceipt() {
    if (!this.receipt) return;

    const confirmed = confirm('Are you sure you want to delete this receipt?');
    if (!confirmed) return;

    try {
      await this.receiptService.deleteReceipt(this.receipt.id);
      this.navCtrl.back();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt');
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}
