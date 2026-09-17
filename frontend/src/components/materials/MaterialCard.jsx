import Card from '../ui/Card';
export default function MaterialCard({ material }) { return <Card><h3>{material?.name ?? 'Matériel'}</h3></Card>; }
