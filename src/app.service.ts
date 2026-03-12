import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'NestJS + TypeScript 웹 서버에 오신 것을 환영합니다!';
  }

  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
