# Diário de Embarque — New-wap

## Instalação
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## GitHub pelo celular
1. Abra o repositório `lediariodeembarque-tech/New-wap`.
2. Faça upload de `src/App.jsx`, `src/styles.css`, `src/main.jsx`, `index.html`, `package.json` e da pasta `supabase`.
3. Crie `public/`.
4. Coloque nela a imagem oficial do logo como `logo-diario-embarque.png`.
5. Faça o commit na branch `New-Wap`.

## Funcionalidades
- MENU único com Personalizar, Chat, Contatos, Admin e Sair.
- Indicador verde do Chat quando há presença detectada.
- Cadastro, edição, pesquisa e exclusão de voos.
- Código de atraso GE-E e outros códigos.
- PDA, Mochila, Rádio e DWS.
- Dias registrados agrupados por mês.
- Administração de usuários.
- SQL de referência para RLS em `supabase/user_roles_admin.sql`.

### Observação sobre presença e RLS
Esta versão mantém armazenamento local para funcionar imediatamente como protótipo. Para presença real entre aparelhos e administração persistente, conecte Supabase/Firebase e substitua o armazenamento local pela API/banco. O SQL fornecido deve ser adaptado ao esquema real do seu projeto antes de executar em produção.
