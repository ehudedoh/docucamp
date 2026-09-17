export default function MaterialFilters({ onChange }) { return <input aria-label="Rechercher du matériel" onChange={event => onChange?.(event.target.value)} />; }
