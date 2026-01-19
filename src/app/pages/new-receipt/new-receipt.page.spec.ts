import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewReceiptPage } from './new-receipt.page';

describe('NewReceiptPage', () => {
  let component: NewReceiptPage;
  let fixture: ComponentFixture<NewReceiptPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NewReceiptPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
