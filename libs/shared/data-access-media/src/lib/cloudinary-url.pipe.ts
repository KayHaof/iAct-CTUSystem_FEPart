import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cloudinaryPath',
  standalone: true,
})
export class CloudinaryPathPipe implements PipeTransform {
  transform(fullUrl: string | null | undefined): string {
    const baseUrl = 'https://res.cloudinary.com/dhjamvg6j/image/upload/';
    if (!fullUrl) {
      return 'v1772509074/default_activity_image.jpg';
    }

    if (fullUrl.startsWith(baseUrl)) {
      return fullUrl.replace(baseUrl, '');
    }

    return fullUrl;
  }
}
