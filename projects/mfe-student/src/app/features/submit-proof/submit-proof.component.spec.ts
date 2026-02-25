import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitProofComponent } from './submit-proof.component';

describe('SubmitProofComponent', () => {
  let component: SubmitProofComponent;
  let fixture: ComponentFixture<SubmitProofComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitProofComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitProofComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
