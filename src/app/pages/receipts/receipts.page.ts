import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonThumbnail,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, receiptOutline, cameraOutline, refreshOutline } from 'ionicons/icons';
import { ReceiptService } from '../../services/receipt.service';
import { ReceiptInterface } from '../../interfaces/receipt.interface';

@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.page.html',
  styleUrls: ['./receipts.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonThumbnail,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
  ],
})
export class ReceiptsPage implements OnInit {
  searchTerm: string = '';
  isLoading: boolean = false;

  public receiptService: ReceiptService = inject(ReceiptService);
  private router: Router = inject(Router);
  private navCtrl: NavController = inject(NavController);


  constructor() {
    addIcons({ addOutline, trashOutline, receiptOutline, cameraOutline, refreshOutline });
  }

  async ngOnInit() {
    console.log('ReceiptsPage ngOnInit');
    await this.loadReceipts();
  }

  async ionViewWillEnter() {
    console.log('ReceiptsPage ionViewWillEnter');
    await this.loadReceipts();
  }

  async loadReceipts() {
    console.log('Loading receipts...');
    this.isLoading = true;
    try {
      await this.receiptService.loadReceipts();
      console.log('Receipts loaded in page. Count:', this.receiptService.receipts.length);
    } catch (error) {
      console.error('Error loading receipts in page:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get filteredReceipts(): ReceiptInterface[] {
    if (!this.searchTerm) {
      return this.receiptService.receipts;
    }

    const term = this.searchTerm.toLowerCase();
    return this.receiptService.receipts.filter(
      (receipt) =>
        receipt.storeName?.toLowerCase().includes(term)
    );
  }

  /*async addReceipt() {
    console.log('=== addReceipt() called ===');
    this.isLoading = true;

    try {
      // Step 1: Create receipt with photo
      console.log('Step 1: Creating receipt...');
      const receipt = await this.receiptService.createReceipt();
      console.log('Receipt created:', receipt.id);
      console.log('Current receipts:', this.receiptService.receipts.length);

      // Step 2: Process OCR
      console.log('Step 2: Processing OCR...');
      try {
        await this.receiptService.processOCR(receipt.id);
        console.log('OCR completed successfully');
      } catch (ocrError) {
        console.error('OCR failed (non-fatal):', ocrError);
        // Don't throw - we keep the receipt even if OCR fails
      }

      console.log('=== addReceipt() complete ===');

    } catch (error: any) {
      console.error('=== ERROR creating receipt ===');
      console.error('Error:', error?.message || error);
      alert(`Error: ${error?.message || 'Failed to create receipt'}`);
    } finally {
      this.isLoading = false;
    }
  }*/

  async deleteReceipt(receipt: ReceiptInterface, event: Event) {
    event.stopPropagation();

    console.log('Deleting receipt:', receipt.id);

    try {
      await this.receiptService.deleteReceipt(receipt.id);
      console.log('Receipt deleted successfully');
    } catch (error) {
      console.error('Error deleting receipt:', error);
    }
  }

  viewReceipt(receipt: ReceiptInterface) {
    console.log('Viewing receipt:', receipt.id);
    this.router.navigate(['/receipt-detail', receipt.id]);
  }

  async handleRefresh(event: any) {
    console.log('Refreshing receipts...');
    await this.loadReceipts();
    event.target.complete();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No date';

    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  formatAmount(amount?: number): string {
    if (!amount) return 'No amount';

    return amount.toFixed(2);
  }

/*  getTotalSpending(): string {
    return this.receiptService.getTotalSpending().toFixed(2);
  }*/

  openNewReceipt() {
    this.navCtrl.navigateForward('/new-receipt');
  }

  async retryOCR(receipt: ReceiptInterface, event: Event) {
    event.stopPropagation();

    console.log('Retrying OCR for receipt:', receipt.id);

    try {
      await this.receiptService.processOCR(receipt.id);
      console.log('OCR retry successful');
    } catch (error) {
      console.error('OCR retry failed:', error);
      alert('OCR failed. Check console for details.');
    }
  }
}
