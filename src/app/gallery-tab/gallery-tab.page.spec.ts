import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryTabPage } from './gallery-tab.page';

describe('GalleryTabPage', () => {
  let component: GalleryTabPage;
  let fixture: ComponentFixture<GalleryTabPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(GalleryTabPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
