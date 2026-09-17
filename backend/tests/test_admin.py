def test_admin_placeholder(client):
    assert client.get('/api/health').json['status'] == 'ok'
