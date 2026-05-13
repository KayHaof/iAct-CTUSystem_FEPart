import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule, Location } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { UserService } from '@my-mfe/auth';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { AlertService, ConfirmService } from '@my-mfe/ui';
import { OAuthService } from 'angular-oauth2-oidc';

import { UserProfileComponent } from './user-profile.component';

describe('UserProfile', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(async () => {
    const currentUser = signal(null);

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        {
          provide: UserService,
          useValue: {
            currentUser,
            getFullProfile: vi.fn(() => of({ result: null })),
            updateProfile: vi.fn(() => of({ result: null })),
            deactivateAccount: vi.fn(() => of({ message: 'ok' })),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadImage: vi.fn(() => of(null)),
          },
        },
        {
          provide: AlertService,
          useValue: {
            error: vi.fn(),
            success: vi.fn(),
            observe: vi.fn(() => (source$) => source$),
          },
        },
        {
          provide: ConfirmService,
          useValue: {
            confirm: vi.fn(() => Promise.resolve(false)),
          },
        },
        {
          provide: OAuthService,
          useValue: {
            initLoginFlow: vi.fn(),
            logOut: vi.fn(),
          },
        },
        {
          provide: Location,
          useValue: {
            back: vi.fn(),
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(UserProfileComponent, {
        set: {
          imports: [CommonModule, ReactiveFormsModule],
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
