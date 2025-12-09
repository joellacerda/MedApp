# 🏥 Med App - Sistema de Gestão Clínica

Este projeto é uma aplicação completa de gestão clínica (Full Stack), desenvolvida como Trabalho Final da disciplina de Banco de Dados. O sistema permite o gerenciamento de pacientes, médicos, agendamentos e atendimentos, persistindo os dados em um banco MySQL.

## 📋 Pré-requisitos

Para rodar este projeto, você precisará ter instalado na sua máquina:

- **Node.js** (versão 14 ou superior)
- **MySQL Server** (rodando localmente)
- **Git** (opcional, para clonagem)

---

## 🚀 Como Rodar a Aplicação

Siga o passo a passo abaixo para configurar o ambiente.

### Passo 1: Configurar o Banco de Dados

1.  Certifique-se de que o seu serviço MySQL está rodando.
2.  Localize o arquivo **`Script.sql`** na raiz deste projeto.
3.  Abra o seu gerenciador de banco de dados (MySQL Workbench, DBeaver ou Terminal).
4.  Execute todo o conteúdo do arquivo `Script.sql`.
    - Isso criará o banco `ClinicaDB`, as tabelas, triggers e inserirá os dados iniciais.

> **⚠️ Atenção à Configuração de Conexão:**
> O backend está configurado para acessar o banco com o usuário `root` e senha vazia (`""`).
> Se o seu MySQL tiver uma senha definida, vá até o arquivo `server/index.js` e atualize a linha da conexão:
>
> ```javascript
> const db = mysql.createPool({
>   host: "localhost",
>   user: "root",
>   password: "SUA_SENHA_AQUI", // <--- Altere aqui se necessário
>   database: "ClinicaDB",
> });
> ```

---

### Passo 2: Iniciar o Backend (Servidor)

Abra um terminal na pasta raiz do projeto e execute:

```bash
# Entrar na pasta do servidor
cd server

# Instalar as dependências
npm install

# Rodar o servidor
node index.js
```
