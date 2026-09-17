export function formatDate(value) { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)); }
export function formatBytes(bytes) { if (!bytes) return '0 octet'; const units = ['octets', 'Ko', 'Mo', 'Go']; const index = Math.floor(Math.log(bytes) / Math.log(1024)); return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`; }
