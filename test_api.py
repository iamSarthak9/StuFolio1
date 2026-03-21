
import http.client
import json

def test_api():
    conn = http.client.HTTPConnection("localhost", 3001)
    try:
        conn.request("GET", "/api/health")
        response = conn.getresponse()
        print(f"Status: {response.status}")
        print(f"Body: {response.read().decode()}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_api()
