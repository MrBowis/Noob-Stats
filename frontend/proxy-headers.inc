proxy_http_version 1.1;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# La subida de la foto de perfil admite hasta 5 MB.
client_max_body_size 10m;

proxy_connect_timeout 10s;
proxy_read_timeout    60s;
