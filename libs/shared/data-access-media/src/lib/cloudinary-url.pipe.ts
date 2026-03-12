import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cloudinaryPath',
  standalone: true,
})
export class CloudinaryPathPipe implements PipeTransform {
  transform(fullUrl: string | null | undefined): string {
    // 1. Cắt luôn chữ image/upload khỏi đường dẫn gốc
    const baseUrl = 'https://res.cloudinary.com/dhjamvg6j/image/upload/';

    // 2. Ảnh mặc định cũng chỉ lấy phần ID/Version thôi, không lấy image/upload/
    if (!fullUrl) {
      return 'v1772509074/default_activity_image.jpg';
    }

    // 3. Nếu là link tuyệt đối thì cắt bỏ phần baseUrl đi
    if (typeof fullUrl === 'string' && fullUrl.startsWith(baseUrl)) {
      return fullUrl.replace(baseUrl, '');
    }

    return fullUrl;
  }
}
