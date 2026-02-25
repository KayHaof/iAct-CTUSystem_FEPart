import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityHubComponent } from './activity-hub.component';

describe('ActivityHubComponent', () => {
  let component: ActivityHubComponent;
  let fixture: ComponentFixture<ActivityHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityHubComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityHubComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
