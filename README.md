# Diário de Embarque

Aplicativo PWA para registro diário de voos.

## Rodar localmente

Instale as dependências e execute um único comando:

```bash
npm install
npm run dev
```

Esse comando inicia a API em `http://localhost:3001` e o frontend Vite em `http://localhost:5173`. A API também pode ser iniciada separadamente com `npm run server`.

Teste a API diretamente em:

```text
http://localhost:3001/api/health
```

Resposta esperada: `{"ok":true}`.

Credenciais de teste:
- usuario@embarque.com
- 123456

O frontend usa `/api` no mesmo host e, durante o desenvolvimento, o Vite encaminha `/api` e `/uploads` para a API na porta 3001. Para uma API hospedada em outro endereço, defina `VITE_API_URL` sem a barra final, por exemplo `https://api.exemplo.com/api`.

## Cloudflare

O repositório já inclui um shell instalável e o contrato do Worker para `/api/*`.
