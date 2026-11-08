# PersonalPage · Weasel Shiro

Página estática para GitHub Pages con mensajes de Guild Wars 2 que se copian con un clic
para pegarlos en el chat del juego.

## Editar mensajes

Todo el contenido está en [`messages.json`](messages.json). **Cada clave es una pestaña** y su
valor es la lista de mensajes:

```json
{
  "Mundo abierto": ["mensaje 1", "mensaje 2"],
  "Fractales": ["..."],
  "Misiones de clan": ["Nueva pestaña creada automáticamente"]
}
```

- El orden de las claves define el orden de las pestañas.
- Cada mensaje muestra un contador; se marca en rojo si supera los 199 caracteres del chat de GW2.
- Se puede enlazar directamente a una pestaña: `.../#fractales`, `.../#misiones-de-clan`.

## Probar en local

`fetch` no funciona abriendo el archivo con `file://`, así que hay que levantar un servidor:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Publicar

En GitHub: *Settings → Pages → Build and deployment → Deploy from a branch*, rama `main`, carpeta `/ (root)`.
