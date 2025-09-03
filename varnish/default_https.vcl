vcl 4.0;

backend default {
    .host = "127.0.0.1";
    .port = "3000";
    .probe = {
        .url = "/ping";
        .timeout = 2s;
        .interval = 10s;
        .window = 5;
        .threshold = 3;
    }
}

sub vcl_recv {
    # Allow OPTIONS method for CORS preflight requests
    if (req.method == "OPTIONS") {
        return (pass);
    }
    
    if (req.method != "GET" && req.method != "HEAD" && req.method != "POST" && req.method != "OPTIONS") {
        return (pass);
    }

    if (req.url == "/" || req.url == "/ping") {
        return (hash);
    }

    return (pass);
}

sub vcl_backend_response {
    if (bereq.url == "/" || bereq.url == "/ping") {
        set beresp.ttl = 60s;
        set beresp.grace = 30s;
        unset beresp.http.set-cookie;
    } else {
        set beresp.ttl = 0s;
    }
    
    # Preserve CORS headers from backend
    if (beresp.http.Access-Control-Allow-Origin) {
        set beresp.http.Access-Control-Allow-Origin = beresp.http.Access-Control-Allow-Origin;
    }
    if (beresp.http.Access-Control-Allow-Methods) {
        set beresp.http.Access-Control-Allow-Methods = beresp.http.Access-Control-Allow-Methods;
    }
    if (beresp.http.Access-Control-Allow-Headers) {
        set beresp.http.Access-Control-Allow-Headers = beresp.http.Access-Control-Allow-Headers;
    }
    if (beresp.http.Access-Control-Allow-Credentials) {
        set beresp.http.Access-Control-Allow-Credentials = beresp.http.Access-Control-Allow-Credentials;
    }
}

sub vcl_deliver {
    if (obj.ttl > 0s) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
    
    # Ensure CORS headers are always present in response
    if (resp.http.Access-Control-Allow-Origin) {
        set resp.http.Access-Control-Allow-Origin = resp.http.Access-Control-Allow-Origin;
    }
    if (resp.http.Access-Control-Allow-Methods) {
        set resp.http.Access-Control-Allow-Methods = resp.http.Access-Control-Allow-Methods;
    }
    if (resp.http.Access-Control-Allow-Headers) {
        set resp.http.Access-Control-Allow-Headers = resp.http.Access-Control-Allow-Headers;
    }
    if (resp.http.Access-Control-Allow-Credentials) {
        set resp.http.Access-Control-Allow-Credentials = resp.http.Access-Control-Allow-Credentials;
    }
}