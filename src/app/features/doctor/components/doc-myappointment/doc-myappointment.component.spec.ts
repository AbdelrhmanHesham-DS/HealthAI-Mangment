import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocMyappointmentComponent } from './doc-myappointment.component';

describe('DocMyappointmentComponent', () => {
  let component: DocMyappointmentComponent;
  let fixture: ComponentFixture<DocMyappointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocMyappointmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocMyappointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
