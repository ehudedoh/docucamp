import { Navigate } from 'react-router-dom';
export default function ProtectedRoute({ authenticated, children }) { return authenticated ? children : <Navigate to="/login" replace />; }
