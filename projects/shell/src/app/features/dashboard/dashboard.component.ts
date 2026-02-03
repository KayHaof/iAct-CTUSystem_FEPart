import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private oauthService = inject(OAuthService);

  userName: string = 'Student';

  upcomingActivities = [
    {
      id: 1,
      date: 'Mar 24',
      title: 'Startup Workshop 2026',
      desc: 'Join us for an intensive weekend of innovation and entrepreneurship.',
      location: 'Innovation Hall B',
      points: 2,
      image:
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 2,
      date: 'Apr 02',
      title: 'Campus Green Day',
      desc: 'Help make our campus greener! Tree planting and recycling awareness.',
      location: 'Central Park',
      points: 3,
      image:
        'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?auto=format&fit=crop&w=500&q=80',
    },
  ];

  newsUpdates = [
    {
      author: 'Student Union',
      time: '2h ago',
      title: 'Big win for our debate team at the Nationals! 🏆',
      content: 'Exhibition opens tomorrow.',
      color: '#E3F2FD', // Màu avatar giả
      avatar: 'SU',
    },
    {
      author: 'Art Club',
      time: '5h ago',
      title: "Exhibition opens tomorrow. Don't miss the gallery walk.",
      content: '',
      color: '#F3E5F5',
      avatar: 'AC',
    },
  ];

  ngOnInit() {
    // 🔥 Lấy tên thật từ Token Keycloak
    const claims = this.oauthService.getIdentityClaims() as any;
    if (claims) {
      // Keycloak thường trả về 'name', 'given_name', hoặc 'preferred_username'
      this.userName =
        claims['given_name'] || claims['name'] || claims['preferred_username'] || 'Alex';
    }
  }
}
