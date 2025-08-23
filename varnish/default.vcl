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
    if (req.method != "GET" && req.method != "HEAD") {
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
    } else {
        set beresp.ttl = 0s;
    }
}

sub vcl_backend_response {
    if (bereq.url == "/" || bereq.url == "/ping") {
        unset beresp.http.set-cookie;
    }
}

sub vcl_deliver {
    if (obj.ttl > 0s) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
}