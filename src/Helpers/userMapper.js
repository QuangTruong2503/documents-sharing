export const normalizeUser = (user = {}) => ({
  userId: user.userId ?? user.user_id ?? "",
  username: user.username ?? "",
  email: user.email ?? user.Email ?? "",
  fullName: user.fullName ?? user.full_name ?? user.FullName ?? "",
  avatarUrl: user.avatarUrl ?? user.avatar_url ?? user.AvatarUrl ?? "",
  role: user.role ?? "user",
  isVerified: user.isVerified ?? user.is_verified ?? false,
  twoFactorEnabled: user.twoFactorEnabled ?? user.two_factor_enabled ?? false,
  createdAt: user.createdAt ?? user.created_at ?? "",
});

export const normalizeAuthResponse = (data = {}) => ({
  ...data,
  user: data.user ? normalizeUser(data.user) : null,
});
