import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiptDetailPagePage } from './receipt-detail.page';

describe('ReceiptDetailPagePage', () => {
  let component: ReceiptDetailPagePage;
  let fixture: ComponentFixture<ReceiptDetailPagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptDetailPagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
