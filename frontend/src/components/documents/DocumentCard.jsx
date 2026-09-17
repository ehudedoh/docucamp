import Card from '../ui/Card';
export default function DocumentCard({ document }) { return <Card><h3>{document?.title ?? 'Document'}</h3></Card>; }
