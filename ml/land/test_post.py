import requests

# First: Coimbatore
data_cb = {
    "area": 3.0,
    "zoning": "Commercial",
    "City": "Coimbatore",
    "District": "Coimbatore",
    "latitude": 11.0,
    "longitude": 77.0
}
response = requests.post("http://localhost:5002/predict/land", json=data_cb)
print("Coimbatore Response:")
print(response.json())

# Second: Madurai (change values)
data_md = {
    "area": 3.0,
    "zoning": "Commercial",
    "City": "Madurai",
    "District": "Madurai",
    "latitude": 9.9,
    "longitude": 78.1
}
response = requests.post("http://localhost:5002/predict/land", json=data_md)
print("Madurai Response:")
print(response.json())
