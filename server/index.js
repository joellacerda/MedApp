// server/index.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO DO BANCO
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "ClinicaDB",
});

// --- PACIENTES ---
app.get("/pacientes", (req, res) => {
  const busca = req.query.busca;
  let sql = `
        SELECT p.*,
               pc.Num_Carteira, pc.Nome_Convenio,
               pp.Limite_Credito
        FROM PACIENTE p
        LEFT JOIN PACIENTE_CONVENIADO pc ON p.Paciente_ID = pc.Paciente_ID
        LEFT JOIN PACIENTE_PARTICULAR pp ON p.Paciente_ID = pp.Paciente_ID
        ORDER BY p.Nome ASC
    `;

  let params = [];
  if (busca) {
    sql += " WHERE p.Nome LIKE ? OR p.CPF LIKE ?";
    params = [`%${busca}%`, `%${busca}%`];
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result);
  });
});

app.post("/pacientes", (req, res) => {
  const { nome, cpf, telefone, tipo, extra } = req.body;
  const sqlPai = "INSERT INTO PACIENTE (Nome, CPF, Telefone) VALUES (?, ?, ?)";

  db.query(sqlPai, [nome, cpf, telefone], (err, result) => {
    if (err) return res.status(500).send(err);
    const idPaciente = result.insertId;

    let sqlFilho = "";
    let paramsFilho = [];

    if (tipo === "Conveniado") {
      sqlFilho =
        "INSERT INTO PACIENTE_CONVENIADO (Paciente_ID, Num_Carteira, Nome_Convenio) VALUES (?, ?, ?)";
      paramsFilho = [idPaciente, extra.num_carteira, extra.nome_convenio];
    } else {
      sqlFilho =
        "INSERT INTO PACIENTE_PARTICULAR (Paciente_ID, Limite_Credito) VALUES (?, ?)";
      paramsFilho = [idPaciente, extra.limite_credito];
    }

    db.query(sqlFilho, paramsFilho, (errFilho, resultFilho) => {
      if (errFilho) return res.status(500).send(errFilho);
      res.send({ msg: "Paciente cadastrado!", id: idPaciente });
    });
  });
});

app.put("/pacientes/:id", (req, res) => {
  const id = req.params.id;
  const { nome, cpf, telefone } = req.body;
  const sql =
    "UPDATE PACIENTE SET Nome = ?, CPF = ?, Telefone = ? WHERE Paciente_ID = ?";
  db.query(sql, [nome, cpf, telefone, id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ msg: "Paciente atualizado com sucesso!" });
  });
});

app.delete("/pacientes/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM PACIENTE WHERE Paciente_ID = ?";
  db.query(sql, [id], (err, result) => {
    if (err)
      return res.status(500).send({
        error: "Erro ao deletar (verifique se há consultas pendentes).",
      });
    res.send({ msg: "Paciente excluído!" });
  });
});

// --- MÉDICOS ---
app.get("/medicos", (req, res) => {
  // Join para trazer o nome da Especialidade
  const sql = `
        SELECT m.Medico_ID, m.Nome, m.CRM, e.Nome as Especialidade
        FROM MEDICO m
        JOIN ESPECIALIDADE e ON m.Espec_ID = e.Espec_ID
    `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result);
  });
});

app.post("/medicos", (req, res) => {
  const { nome, crm, espec_id, nova_especialidade } = req.body;

  const inserirMedico = (idEspec) => {
    const sql = "INSERT INTO MEDICO (Nome, CRM, Espec_ID) VALUES (?, ?, ?)";
    db.query(sql, [nome, crm, idEspec], (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ msg: "Médico cadastrado com sucesso!" });
    });
  };

  // Se o usuário digitou uma nova especialidade, cria ela antes
  if (nova_especialidade) {
    const sqlEspec = "INSERT INTO ESPECIALIDADE (Nome) VALUES (?)";
    db.query(sqlEspec, [nova_especialidade], (err, result) => {
      if (err) return res.status(500).send(err);
      inserirMedico(result.insertId);
    });
  } else {
    inserirMedico(espec_id);
  }
});

app.put("/medicos/:id", (req, res) => {
  const id = req.params.id;
  const { nome, crm } = req.body; // Simplificação: update apenas de dados básicos
  const sql = "UPDATE MEDICO SET Nome = ?, CRM = ? WHERE Medico_ID = ?";
  db.query(sql, [nome, crm, id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ msg: "Médico atualizado!" });
  });
});

app.delete("/medicos/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM MEDICO WHERE Medico_ID = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ error: "Erro ao deletar médico." });
    res.send({ msg: "Médico excluído!" });
  });
});

// --- ESPECIALIDADES ---
app.get("/especialidades", (req, res) => {
  db.query("SELECT * FROM ESPECIALIDADE ORDER BY Nome ASC", (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result);
  });
});

// --- CONSULTAS ---
app.get("/consultas", (req, res) => {
  const sql = `
        SELECT c.Consulta_ID, c.Data_Hora, c.Sala,
               p.Nome as Paciente, m.Nome as Medico,
               pag.Pgto_ID, pag.Valor, pag.Metodo,
               -- Agrupa todas as prescrições em uma linha separada por ponto e vírgula
               GROUP_CONCAT(CONCAT(presc.Medicamento, ' (', presc.Dosagem, ')') SEPARATOR '; ') as ReceitaCompleta
        FROM CONSULTA c
        JOIN PACIENTE p ON c.Paciente_ID = p.Paciente_ID
        JOIN MEDICO m ON c.Medico_ID = m.Medico_ID
        LEFT JOIN PAGAMENTO pag ON c.Consulta_ID = pag.Consulta_ID
        LEFT JOIN PRESCRICAO presc ON c.Consulta_ID = presc.Consulta_ID
        GROUP BY c.Consulta_ID
        ORDER BY c.Data_Hora DESC
    `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result);
  });
});

app.post("/consultas", (req, res) => {
  const { medico_id, paciente_id, data, hora, sala } = req.body;
  const dataHora = `${data} ${hora}`;
  const sql =
    "INSERT INTO CONSULTA (Data_Hora, Sala, Medico_ID, Paciente_ID) VALUES (?, ?, ?, ?)";

  db.query(sql, [dataHora, sala, medico_id, paciente_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ msg: "Agendamento realizado!" });
  });
});

// --- REAGENDAR / CANCELAR CONSULTAS ---
app.put("/consultas/:id", (req, res) => {
  const id = req.params.id;
  const { data, hora } = req.body;
  const dataHora = `${data} ${hora}`; // Formato YYYY-MM-DD HH:MM

  const sql = "UPDATE CONSULTA SET Data_Hora = ? WHERE Consulta_ID = ?";
  db.query(sql, [dataHora, id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ msg: "Consulta reagendada!" });
  });
});

app.delete("/consultas/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM CONSULTA WHERE Consulta_ID = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ msg: "Consulta cancelada!" });
  });
});

// --- FINALIZAR ATENDIMENTO (Pagamento + Prescrição) ---
app.post("/consultas/finalizar/:id", (req, res) => {
  const consultaId = req.params.id;
  // Agora esperamos 'prescricoes' como um Array de objetos
  const { valor, metodo, prescricoes } = req.body;

  // 1. Inserir Pagamento
  const sqlPgto =
    "INSERT INTO PAGAMENTO (Valor, Metodo, Consulta_ID) VALUES (?, ?, ?)";

  db.query(sqlPgto, [valor, metodo, consultaId], (err, result) => {
    if (err)
      return res
        .status(500)
        .send({ error: "Erro no pagamento: " + err.message });

    // 2. Inserir Múltiplas Prescrições (Bulk Insert)
    if (prescricoes && prescricoes.length > 0) {
      // Transformamos o array de objetos em array de arrays para o MySQL
      const valoresInsert = prescricoes.map((p) => [
        p.medicamento,
        p.dosagem,
        consultaId,
      ]);

      const sqlPresc =
        "INSERT INTO PRESCRICAO (Medicamento, Dosagem, Consulta_ID) VALUES ?";

      db.query(sqlPresc, [valoresInsert], (errPresc, resultPresc) => {
        if (errPresc)
          return res
            .status(500)
            .send({ error: "Erro na prescrição: " + errPresc.message });
        res.send({ msg: "Consulta finalizada com sucesso!" });
      });
    } else {
      // Caso não tenha prescrição (só pagamento), finaliza aqui
      res.send({ msg: "Consulta finalizada (sem prescrições)!" });
    }
  });
});

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});
