/**
 * Maps common Supabase Auth English errors to Turkish user-facing messages.
 */
export function mapAuthErrorToTurkish(rawMessage: string): string {
  const message = rawMessage.toLowerCase();

  if (
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed") ||
    (message.includes("email") && message.includes("confirm") && !message.includes("already"))
  ) {
    return "E-posta adresiniz henüz onaylanmamış. Lütfen e-posta kutunuza giden onay mailindeki bağlantıya tıklayın. Spam / Gereksiz klasörünü de kontrol edin.";
  }

  if (
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    message.includes("user already exists") ||
    message.includes("email address is already")
  ) {
    return "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin. Henüz onaylamadıysanız e-postanıza gelen onay mailine tıklayın.";
  }

  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.";
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
  }

  if (message.includes("password") && (message.includes("weak") || message.includes("least"))) {
    return "Şifre yeterince güçlü değil. En az 6 karakter kullanın.";
  }

  if (message.includes("unable to validate email") || message.includes("invalid email")) {
    return "Geçerli bir e-posta adresi girin.";
  }

  if (message.includes("signup is disabled")) {
    return "Yeni kayıtlar şu anda kapalı. Lütfen daha sonra tekrar deneyin.";
  }

  return rawMessage;
}

export const EMAIL_CONFIRMATION_NOTICE =
  "Kayıt alındı. E-posta adresinize bir onay maili gönderdik. Lütfen maildeki bağlantıya tıklayarak hesabınızı onaylayın. Spam / Gereksiz klasörünü de kontrol edin.";
