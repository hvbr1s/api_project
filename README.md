## API Request to the /api Route  

To make an API request to the /api route, you need to use the HTTP POST method and include your API key in the request header. The request should also include user_input and user_id as query parameters.

Here is an example of how to format the request:  

```
POST /api HTTP/1.1
Host: api-store-enhg.onrender.com
Authorization: <your_api_key>
Content-Type: application/json

{
    "user_input": "<your_question>",
    "user_id": "<any_number>"
}
```

Replace `<your_api_key>`, `<your_question>`, and `<any_number>` with your chosen value, for example:  

```
POST /api HTTP/1.1
Host: api-store-enhg.onrender.com
Authorization: sk-thisismykey
Content-Type: application/json

{
    "user_input": "How do I get started with azure?",
    "user_id": "8888"
}

```

### Parameters  

- api_key (required): This is the API key that you have acquired through `https://api-store-enhg.onrender.com/`. It is used for authentication.
- user_input (required): This is your question.
- user_id (required): An ID number, can be any number.  

###Response

If the request is successful, the server will forward the response from the target address. If the api_key is invalid or not provided, the server will respond with a 403 status code. If there is an error during forwarding the request, the server will respond with the status code of the error response or 500 if the error response is not available.
