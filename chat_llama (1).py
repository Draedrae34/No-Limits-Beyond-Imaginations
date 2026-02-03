import requests

messages = []

while True:
    user_input = input("You: ")
    if user_input.lower() == 'exit':
        break
    messages.append({"role": "user", "content": user_input})
    payload = {
        "model": "tinyllama",
        "messages": messages,
        "stream": False
    }
    try:
        response = requests.post("http://localhost:11434/api/chat", json=payload)
        if response.status_code == 200:
            data = response.json()
            ai_response = data.get("message", {}).get("content", "")
            print("AI:", ai_response)
            messages.append({"role": "assistant", "content": ai_response})
        else:
            print("Error:", response.text)
    except Exception as e:
        print("Error:", str(e))