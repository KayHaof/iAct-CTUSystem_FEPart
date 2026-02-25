import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyRecordsComponent } from './my-records.component';

describe('MyRecordsComponent', () => {
  let component: MyRecordsComponent;
  let fixture: ComponentFixture<MyRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyRecordsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyRecordsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
