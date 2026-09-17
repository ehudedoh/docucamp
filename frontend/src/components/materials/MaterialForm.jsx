export default function MaterialForm({ onSubmit }) { return <form onSubmit={onSubmit}><input name="name" required placeholder="Nom du matériel" /><button type="submit">Enregistrer</button></form>; }
