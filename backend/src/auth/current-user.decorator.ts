import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserUserPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
