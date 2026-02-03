import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink], // Import RouterLink để dùng được thẻ <a> chuyển trang
  template: `
    <div class="not-found-container">
      <div class="error-code">404</div>
      <h2 class="error-message">Oops! Trang bạn tìm kiếm không tồn tại.</h2>
      <p class="description">
        Có vẻ như bạn đã đi lạc đường. Đường dẫn này không hợp lệ hoặc đã bị xóa.
      </p>

      <a routerLink="/" class="btn-home"> <i class="icon-home"></i> Quay về Dashboard </a>
    </div>
  `,
  styles: [
    `
      .not-found-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 400px; /* Đảm bảo ko bị ngắn quá */
        text-align: center;
        color: #333;
      }

      .error-code {
        font-size: 6rem;
        font-weight: 800;
        color: #e0e0e0; /* Màu xám nhạt */
        line-height: 1;
      }

      .error-message {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 20px 0 10px;
        color: #2c3e50;
      }

      .description {
        color: #7f8c8d;
        margin-bottom: 30px;
        max-width: 400px;
      }

      .btn-home {
        display: inline-block;
        padding: 12px 24px;
        background-color: #0066cc; /* Màu xanh chủ đạo của iAct */
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.2s ease;
        box-shadow: 0 4px 6px rgba(0, 102, 204, 0.2);
      }

      .btn-home:hover {
        background-color: #0052a3;
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(0, 102, 204, 0.3);
      }
    `,
  ],
})
export class NotFoundComponent {}
