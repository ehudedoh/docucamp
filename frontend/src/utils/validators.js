export const isRequired = value => Boolean(String(value ?? '').trim());
export const isEmail = value => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
