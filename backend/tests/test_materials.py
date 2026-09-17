def test_materials_placeholder(client):
    assert client.get('/api/health').status_code == 200
