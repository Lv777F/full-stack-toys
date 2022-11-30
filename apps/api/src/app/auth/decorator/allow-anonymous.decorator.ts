import { SetMetadata } from '@nestjs/common';

export const ALLOW_ANONYMOUS_KEY = 'AllowAnonymous';

/**
 * 允许未鉴权访问
 */
export const AllowAnonymous = () => SetMetadata(ALLOW_ANONYMOUS_KEY, true);
