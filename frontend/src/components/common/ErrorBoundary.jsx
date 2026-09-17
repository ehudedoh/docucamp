import { Component } from 'react';
export default class ErrorBoundary extends Component { state = { hasError: false }; static getDerivedStateFromError() { return { hasError: true }; } render() { return this.state.hasError ? <p>Une erreur est survenue.</p> : this.props.children; } }
