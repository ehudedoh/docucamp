export default function DocumentFilters({ onChange }) { return <input aria-label="Rechercher un document" onChange={event => onChange?.(event.target.value)} />; }
