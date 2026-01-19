import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-new-receipt',
  templateUrl: './new-receipt.page.html',
  styleUrls: ['./new-receipt.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class NewReceiptPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
