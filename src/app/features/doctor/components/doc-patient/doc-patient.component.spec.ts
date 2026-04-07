import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocPatientComponent } from './doc-patient.component';

describe('DocPatientComponent', () => {
  let component: DocPatientComponent;
  let fixture: ComponentFixture<DocPatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocPatientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
