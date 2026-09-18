export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone) {
  return typeof phone === 'string' && /^\+?[0-9\s\-()]{7,20}$/.test(phone.trim())
}

export function validateRegister(form) {
  const errors = {}
  if (!form.full_name || form.full_name.trim().length < 2) errors.full_name = 'Nom requis'
  if (!isValidEmail(form.email)) errors.email = 'Email invalide'
  if (!form.password || form.password.length < 8) errors.password = 'Au moins 8 caractères'
  if (!isValidPhone(form.phone)) errors.phone = 'Numéro invalide'
  return errors
}