export enum RedisKey {
  /**
   * 用户 refreshToken 黑名单
   */
  RefreshTokenBlacklist = 'user:{id}:refresh_token_blacklist',
  /**
   * 邀请注册临时 Token
   */
  SignUpTempTokens = 'sign_up_temp_tokens',
}
