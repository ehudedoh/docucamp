def test_health(client):
    assert client.get('/api/health').status_code == 200
