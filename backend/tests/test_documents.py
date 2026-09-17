def test_documents_placeholder(client):
    assert client.get('/api/health').is_json
