# SIGEE Enterprise 2.0 - Parte 1

Arquivos iniciais da modularização:

- frontend/js/config.js
- frontend/js/supabase.js
- frontend/js/auth.js
- frontend/js/permissoes.js

## Como importar

Envie estes arquivos para a pasta `frontend/js` no GitHub.

No `frontend/index.html`, garanta que existam estes scripts antes do `app.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase.js"></script>
<script src="js/auth.js"></script>
<script src="js/permissoes.js"></script>
<script src="js/app.js"></script>
```
