import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:3001";

function App() {
  const [aba, setAba] = useState("home");
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [busca, setBusca] = useState("");

  // --- ESTADOS DE EDIÇÃO ---
  const [editandoPaciente, setEditandoPaciente] = useState(null);
  const [editandoMedico, setEditandoMedico] = useState(null);
  const [reagendandoConsulta, setReagendandoConsulta] = useState(null);

  // --- DEPENDENTES ---
  const [listaDependentes, setListaDependentes] = useState([]);
  const [formDependente, setFormDependente] = useState({
    nome: "",
    data_nascimento: "",
  });

  // --- FORMULÁRIOS ---
  const [formPaciente, setFormPaciente] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    tipo: "Particular",
    extra: {},
  });

  const [formMedico, setFormMedico] = useState({
    nome: "",
    crm: "",
    espec_id: "",
    nova_especialidade: "",
  });

  const [formAgendamento, setFormAgendamento] = useState({
    medico_id: "",
    paciente_id: "",
    data: "",
    hora: "",
    sala: "",
  });

  const [formReagendar, setFormReagendar] = useState({ data: "", hora: "" });

  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [formFinalizar, setFormFinalizar] = useState({
    valor: "",
    metodo: "Dinheiro",
    medicamentos: [{ nome: "", dosagem: "" }],
  });

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => {
    if (aba === "pacientes") fetchPacientes();
    if (aba === "medicos") {
      fetchMedicos();
      fetchEspecialidades();
    }
    if (aba === "agendamento") {
      fetchMedicos();
      fetchPacientes();
    }
    if (aba === "atendimento") fetchConsultas();
  }, [aba, busca]);

  const fetchPacientes = async () => {
    const res = await axios.get(`${API_URL}/pacientes?busca=${busca}`);
    setPacientes(res.data);
  };
  const fetchMedicos = async () => {
    const res = await axios.get(`${API_URL}/medicos`);
    setMedicos(res.data);
  };
  const fetchEspecialidades = async () => {
    const res = await axios.get(`${API_URL}/especialidades`);
    setEspecialidades(res.data);
  };
  const fetchConsultas = async () => {
    const res = await axios.get(`${API_URL}/consultas`);
    setConsultas(res.data);
  };

  // --- AÇÕES PACIENTE ---
  const salvarPaciente = async (e) => {
    e.preventDefault();
    try {
      if (editandoPaciente) {
        await axios.put(
          `${API_URL}/pacientes/${editandoPaciente}`,
          formPaciente
        );
        alert("Paciente atualizado!");
        setEditandoPaciente(null);
      } else {
        await axios.post(`${API_URL}/pacientes`, formPaciente);
        alert("Paciente cadastrado!");
      }
      fetchPacientes();
      setFormPaciente({
        nome: "",
        cpf: "",
        telefone: "",
        tipo: "Particular",
        extra: {},
      });
    } catch (e) {
      alert("Erro: " + e.message);
    }
  };

  const deletarPaciente = async (id) => {
    if (
      !window.confirm("Tem certeza? Isso pode apagar histórico de consultas.")
    )
      return;
    try {
      await axios.delete(`${API_URL}/pacientes/${id}`);
      fetchPacientes();
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao excluir.");
    }
  };

  const prepararEdicaoPaciente = async (p) => {
    setEditandoPaciente(p.Paciente_ID);
    setFormPaciente({
      nome: p.Nome,
      cpf: p.CPF,
      telefone: p.Telefone,
      tipo: p.Nome_Convenio ? "Conveniado" : "Particular",
      extra: {},
    });

    try {
      const res = await axios.get(
        `${API_URL}/pacientes/${p.Paciente_ID}/dependentes`
      );
      setListaDependentes(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // --- AÇÕES DEPENDENTES ---
  const adicionarDependente = async () => {
    if (!formDependente.nome || !formDependente.data_nascimento)
      return alert("Preencha os dados do dependente");
    try {
      await axios.post(
        `${API_URL}/pacientes/${editandoPaciente}/dependentes`,
        formDependente
      );
      const res = await axios.get(
        `${API_URL}/pacientes/${editandoPaciente}/dependentes`
      );
      setListaDependentes(res.data);
      setFormDependente({ nome: "", data_nascimento: "" });
    } catch (e) {
      alert(e.message);
    }
  };

  const removerDependente = async (nome) => {
    if (!window.confirm("Remover este dependente?")) return;
    try {
      await axios.delete(
        `${API_URL}/pacientes/${editandoPaciente}/dependentes/${nome}`
      );
      const res = await axios.get(
        `${API_URL}/pacientes/${editandoPaciente}/dependentes`
      );
      setListaDependentes(res.data);
    } catch (e) {
      alert(e.message);
    }
  };

  // --- AÇÕES MÉDICO ---
  const salvarMedico = async (e) => {
    e.preventDefault();
    try {
      if (editandoMedico) {
        await axios.put(`${API_URL}/medicos/${editandoMedico}`, formMedico);
        alert("Médico atualizado!");
        setEditandoMedico(null);
      } else {
        await axios.post(`${API_URL}/medicos`, formMedico);
        alert("Médico salvo!");
      }
      setFormMedico({
        nome: "",
        crm: "",
        espec_id: "",
        nova_especialidade: "",
      });
      fetchMedicos();
      fetchEspecialidades();
    } catch (e) {
      alert(e.message);
    }
  };

  const deletarMedico = async (id) => {
    if (!window.confirm("Excluir este médico?")) return;
    try {
      await axios.delete(`${API_URL}/medicos/${id}`);
      fetchMedicos();
    } catch (e) {
      alert("Erro ao excluir.");
    }
  };

  // --- AÇÕES CONSULTAS ---
  const salvarAgendamento = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/consultas`, formAgendamento);
      alert("Agendado!");
      setFormAgendamento({
        medico_id: "",
        paciente_id: "",
        data: "",
        hora: "",
        sala: "",
      });
    } catch (e) {
      alert(e.message);
    }
  };

  const confirmarReagendamento = async (id) => {
    try {
      await axios.put(`${API_URL}/consultas/${id}`, formReagendar);
      alert("Reagendado!");
      setReagendandoConsulta(null);
      fetchConsultas();
    } catch (e) {
      alert(e.message);
    }
  };

  const cancelarConsulta = async (id) => {
    if (!window.confirm("Cancelar esta consulta?")) return;
    try {
      await axios.delete(`${API_URL}/consultas/${id}`);
      fetchConsultas();
      setConsultaSelecionada(null);
    } catch (e) {
      alert(e.message);
    }
  };

  // --- FINALIZAR ATENDIMENTO ---
  const handleAddMedicamento = () =>
    setFormFinalizar({
      ...formFinalizar,
      medicamentos: [...formFinalizar.medicamentos, { nome: "", dosagem: "" }],
    });

  const handleChangeMedicamento = (index, campo, valor) => {
    const novos = [...formFinalizar.medicamentos];
    novos[index][campo] = valor;
    setFormFinalizar({ ...formFinalizar, medicamentos: novos });
  };

  const handleRemoveMedicamento = (i) => {
    const novos = [...formFinalizar.medicamentos];
    novos.splice(i, 1);
    setFormFinalizar({ ...formFinalizar, medicamentos: novos });
  };

  const finalizarAtendimento = async (e) => {
    e.preventDefault();
    const payload = {
      valor: formFinalizar.valor,
      metodo: formFinalizar.metodo,
      prescricoes: formFinalizar.medicamentos.map((m) => ({
        medicamento: m.nome,
        dosagem: m.dosagem,
      })),
    };
    try {
      await axios.post(
        `${API_URL}/consultas/finalizar/${consultaSelecionada}`,
        payload
      );
      alert("Sucesso!");
      setConsultaSelecionada(null);
      fetchConsultas();
      setFormFinalizar({
        valor: "",
        metodo: "Dinheiro",
        medicamentos: [{ nome: "", dosagem: "" }],
      });
    } catch (err) {
      alert(err.message);
    }
  };

  // --- RENDER ---
  return (
    <div
      style={{
        fontFamily: "Segoe UI, sans-serif",
        background: "#f0f2f5",
        minHeight: "100vh",
        display: "flex",
      }}
    >
      {/* MENU */}
      <nav
        style={{
          width: "250px",
          background: "#2c3e50",
          color: "#fff",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ marginBottom: "30px" }}>🏥 Med App</h2>
        <button onClick={() => setAba("home")} style={btnMenu(aba === "home")}>
          🏠 Home
        </button>
        <button
          onClick={() => setAba("pacientes")}
          style={btnMenu(aba === "pacientes")}
        >
          👥 Pacientes
        </button>
        <button
          onClick={() => setAba("medicos")}
          style={btnMenu(aba === "medicos")}
        >
          👨‍⚕️ Médicos
        </button>
        <button
          onClick={() => setAba("agendamento")}
          style={btnMenu(aba === "agendamento")}
        >
          📅 Agendar
        </button>
        <button
          onClick={() => setAba("atendimento")}
          style={btnMenu(aba === "atendimento")}
        >
          ✅ Atendimento
        </button>
      </nav>

      <main style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        {aba === "home" && (
          <div style={cardStyle}>
            <h1>Bem-vindo</h1>
            <p>Sistema de Gestão Clínica v3.0</p>
          </div>
        )}

        {/* --- PACIENTES --- */}
        {aba === "pacientes" && (
          <div style={cardStyle}>
            <h2>Gestão de Pacientes</h2>
            <input
              placeholder="Buscar Paciente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={inputStyle}
            />

            <div
              style={{
                border: "1px solid #ccc",
                padding: "15px",
                borderRadius: "5px",
                marginBottom: "20px",
                background: "#fafafa",
              }}
            >
              <h4>
                {editandoPaciente ? "✏️ Editar Paciente" : "➕ Novo Paciente"}
              </h4>
              <form onSubmit={salvarPaciente}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <input
                    placeholder="Nome"
                    value={formPaciente.nome}
                    onChange={(e) =>
                      setFormPaciente({ ...formPaciente, nome: e.target.value })
                    }
                    style={inputStyle}
                    required
                  />
                  <input
                    placeholder="CPF"
                    value={formPaciente.cpf}
                    onChange={(e) =>
                      setFormPaciente({ ...formPaciente, cpf: e.target.value })
                    }
                    style={inputStyle}
                    required
                  />
                  <input
                    placeholder="Telefone"
                    value={formPaciente.telefone}
                    onChange={(e) =>
                      setFormPaciente({
                        ...formPaciente,
                        telefone: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                  <select
                    value={formPaciente.tipo}
                    onChange={(e) =>
                      setFormPaciente({ ...formPaciente, tipo: e.target.value })
                    }
                    style={inputStyle}
                    disabled={!!editandoPaciente}
                  >
                    <option value="Particular">Particular</option>
                    <option value="Conveniado">Conveniado</option>
                  </select>
                </div>
                {!editandoPaciente && formPaciente.tipo === "Particular" && (
                  <input
                    placeholder="Limite Crédito"
                    type="number"
                    onChange={(e) =>
                      setFormPaciente({
                        ...formPaciente,
                        extra: {
                          ...formPaciente.extra,
                          limite_credito: e.target.value,
                        },
                      })
                    }
                    style={inputStyle}
                  />
                )}
                {!editandoPaciente && formPaciente.tipo === "Conveniado" && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      placeholder="Nº Carteira"
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          extra: {
                            ...formPaciente.extra,
                            num_carteira: e.target.value,
                          },
                        })
                      }
                      style={inputStyle}
                    />
                    <input
                      placeholder="Nome Convênio"
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          extra: {
                            ...formPaciente.extra,
                            nome_convenio: e.target.value,
                          },
                        })
                      }
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* --- ÁREA DE DEPENDENTES (SÓ APARECE AO EDITAR) --- */}
                {editandoPaciente && (
                  <div
                    style={{
                      marginTop: "20px",
                      borderTop: "1px solid #ddd",
                      paddingTop: "10px",
                    }}
                  >
                    <h5>👶 Dependentes</h5>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <input
                        placeholder="Nome Dependente"
                        value={formDependente.nome}
                        onChange={(e) =>
                          setFormDependente({
                            ...formDependente,
                            nome: e.target.value,
                          })
                        }
                        style={{ ...inputStyle, marginBottom: 0 }}
                      />
                      <input
                        type="date"
                        value={formDependente.data_nascimento}
                        onChange={(e) =>
                          setFormDependente({
                            ...formDependente,
                            data_nascimento: e.target.value,
                          })
                        }
                        style={{ ...inputStyle, marginBottom: 0 }}
                      />
                      <button
                        type="button"
                        onClick={adicionarDependente}
                        style={{ ...btnSmall("green"), padding: "10px" }}
                      >
                        Add
                      </button>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {listaDependentes.map((dep, idx) => (
                        <li
                          key={idx}
                          style={{
                            background: "#eee",
                            padding: "5px 10px",
                            marginBottom: "5px",
                            borderRadius: "3px",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            {dep.Nome_Dependente} (
                            {new Date(dep.Data_Nascimento).toLocaleDateString()}
                            )
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              removerDependente(dep.Nome_Dependente)
                            }
                            style={{
                              border: "none",
                              color: "red",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            X
                          </button>
                        </li>
                      ))}
                      {listaDependentes.length === 0 && (
                        <li style={{ color: "#aaa", fontSize: "12px" }}>
                          Nenhum dependente cadastrado.
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" style={btnPrimary}>
                    {editandoPaciente ? "Atualizar" : "Salvar"}
                  </button>
                  {editandoPaciente && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoPaciente(null);
                        setFormPaciente({
                          nome: "",
                          cpf: "",
                          telefone: "",
                          tipo: "Particular",
                          extra: {},
                        });
                      }}
                      style={{ ...btnPrimary, background: "#95a5a6" }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "#eee" }}>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Telefone</th>
                  <th>Tipo / Detalhes</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p) => {
                  const isConvenio = p.Nome_Convenio != null;
                  return (
                    <tr
                      key={p.Paciente_ID}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "10px" }}>{p.Nome}</td>
                      <td>{p.CPF}</td>
                      <td>{p.Telefone}</td>
                      <td>
                        {isConvenio ? (
                          <span
                            style={{
                              ...badgeStyle,
                              background: "#e8f5e9",
                              color: "#2e7d32",
                              border: "1px solid #c8e6c9",
                              cursor: "pointer",
                            }}
                            title={`Convênio: ${p.Nome_Convenio} | Carteira: ${p.Num_Carteira}`}
                            onClick={() =>
                              alert(
                                `🏥 CONVÊNIO: ${p.Nome_Convenio}\n💳 CARTEIRA: ${p.Num_Carteira}`
                              )
                            }
                          >
                            Conveniado
                          </span>
                        ) : (
                          <span
                            style={{
                              ...badgeStyle,
                              background: "#e3f2fd",
                              color: "#1565c0",
                              border: "1px solid #bbdefb",
                              cursor: "pointer",
                            }}
                            title={`Limite: R$ ${p.Limite_Credito}`}
                            onClick={() =>
                              alert(
                                `💲 PARTICULAR\n💰 Limite de Crédito: R$ ${p.Limite_Credito}`
                              )
                            }
                          >
                            Particular
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => prepararEdicaoPaciente(p)}
                          style={btnSmall("orange")}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deletarPaciente(p.Paciente_ID)}
                          style={{ ...btnSmall("red"), marginLeft: "5px" }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- MÉDICOS --- */}
        {aba === "medicos" && (
          <div style={cardStyle}>
            <h2>Corpo Clínico</h2>
            <div
              style={{
                border: "1px solid #ccc",
                padding: "15px",
                borderRadius: "5px",
                marginBottom: "20px",
                background: "#fafafa",
              }}
            >
              <h4>{editandoMedico ? "✏️ Editar Médico" : "➕ Novo Médico"}</h4>
              <form onSubmit={salvarMedico}>
                <input
                  placeholder="Nome"
                  value={formMedico.nome}
                  onChange={(e) =>
                    setFormMedico({ ...formMedico, nome: e.target.value })
                  }
                  style={inputStyle}
                  required
                />
                <input
                  placeholder="CRM"
                  value={formMedico.crm}
                  onChange={(e) =>
                    setFormMedico({ ...formMedico, crm: e.target.value })
                  }
                  style={inputStyle}
                  required
                />
                {!editandoMedico && (
                  <div style={{ marginBottom: "10px" }}>
                    <select
                      value={formMedico.espec_id}
                      onChange={(e) =>
                        setFormMedico({
                          ...formMedico,
                          espec_id: e.target.value,
                        })
                      }
                      style={inputStyle}
                    >
                      <option value="">Selecione Especialidade...</option>
                      {especialidades.map((e) => (
                        <option key={e.Espec_ID} value={e.Espec_ID}>
                          {e.Nome}
                        </option>
                      ))}
                      <option value="nova">+ Cadastrar Nova...</option>
                    </select>
                    {formMedico.espec_id === "nova" && (
                      <input
                        placeholder="Digite o nome da nova especialidade"
                        onChange={(e) =>
                          setFormMedico({
                            ...formMedico,
                            nova_especialidade: e.target.value,
                          })
                        }
                        style={{ ...inputStyle, borderColor: "#3498db" }}
                        required
                      />
                    )}
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" style={btnPrimary}>
                    {editandoMedico ? "Atualizar" : "Cadastrar"}
                  </button>
                  {editandoMedico && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoMedico(null);
                        setFormMedico({ nome: "", crm: "", espec_id: "" });
                      }}
                      style={{ ...btnPrimary, background: "#95a5a6" }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "#eee" }}>
                  <th>Nome</th>
                  <th>CRM</th>
                  <th>Especialidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {medicos.map((m) => (
                  <tr
                    key={m.Medico_ID}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={{ padding: "10px" }}>{m.Nome}</td>
                    <td>{m.CRM}</td>
                    <td>
                      <span
                        style={{
                          ...badgeStyle,
                          background: "#fff3e0",
                          color: "#ef6c00",
                        }}
                      >
                        {m.Especialidade}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setEditandoMedico(m.Medico_ID);
                          setFormMedico({
                            nome: m.Nome,
                            crm: m.CRM,
                            espec_id: "",
                          });
                        }}
                        style={btnSmall("orange")}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deletarMedico(m.Medico_ID)}
                        style={{ ...btnSmall("red"), marginLeft: "5px" }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- AGENDAMENTO --- */}
        {aba === "agendamento" && (
          <div style={cardStyle}>
            <h2>📅 Agendar Consulta</h2>
            <form onSubmit={salvarAgendamento}>
              <select
                style={inputStyle}
                onChange={(e) =>
                  setFormAgendamento({
                    ...formAgendamento,
                    medico_id: e.target.value,
                  })
                }
                required
              >
                <option value="">Selecione Médico...</option>
                {medicos.map((m) => (
                  <option key={m.Medico_ID} value={m.Medico_ID}>
                    {m.Nome} - {m.Especialidade}
                  </option>
                ))}
              </select>
              <select
                style={inputStyle}
                onChange={(e) =>
                  setFormAgendamento({
                    ...formAgendamento,
                    paciente_id: e.target.value,
                  })
                }
                required
              >
                <option value="">Selecione Paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.Paciente_ID} value={p.Paciente_ID}>
                    {p.Nome}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="date"
                  style={inputStyle}
                  onChange={(e) =>
                    setFormAgendamento({
                      ...formAgendamento,
                      data: e.target.value,
                    })
                  }
                  required
                />
                <input
                  type="time"
                  style={inputStyle}
                  onChange={(e) =>
                    setFormAgendamento({
                      ...formAgendamento,
                      hora: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <input
                placeholder="Sala"
                style={inputStyle}
                onChange={(e) =>
                  setFormAgendamento({
                    ...formAgendamento,
                    sala: e.target.value,
                  })
                }
              />
              <button type="submit" style={btnPrimary}>
                Confirmar
              </button>
            </form>
          </div>
        )}

        {/* --- ATENDIMENTO --- */}
        {aba === "atendimento" && (
          <div style={cardStyle}>
            <h2>Gestão de Atendimentos</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div
                style={{
                  maxHeight: "500px",
                  overflowY: "auto",
                  borderRight: "1px solid #ddd",
                  paddingRight: "10px",
                }}
              >
                {consultas.map((c) => (
                  <div
                    key={c.Consulta_ID}
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      marginBottom: "10px",
                      borderRadius: "8px",
                      background: c.Pgto_ID ? "#e8f5e9" : "#fff",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (!reagendandoConsulta)
                        setConsultaSelecionada(c.Consulta_ID);
                    }}
                  >
                    <div>
                      <strong>{new Date(c.Data_Hora).toLocaleString()}</strong>
                    </div>
                    <div>
                      {c.Paciente} ({c.Medico})
                    </div>

                    {!c.Pgto_ID && (
                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          gap: "5px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {reagendandoConsulta === c.Consulta_ID ? (
                          <div
                            style={{
                              background: "#fdfefe",
                              padding: "5px",
                              border: "1px solid #ccc",
                            }}
                          >
                            <input
                              type="date"
                              onChange={(e) =>
                                setFormReagendar({
                                  ...formReagendar,
                                  data: e.target.value,
                                })
                              }
                            />
                            <input
                              type="time"
                              onChange={(e) =>
                                setFormReagendar({
                                  ...formReagendar,
                                  hora: e.target.value,
                                })
                              }
                            />
                            <button
                              onClick={() =>
                                confirmarReagendamento(c.Consulta_ID)
                              }
                              style={btnSmall("green")}
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setReagendandoConsulta(null)}
                              style={btnSmall("grey")}
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                setConsultaSelecionada(c.Consulta_ID)
                              }
                              style={{
                                ...btnSmall("#3498db"),
                                padding: "5px 10px",
                              }}
                            >
                              Atender
                            </button>
                            <button
                              onClick={() =>
                                setReagendandoConsulta(c.Consulta_ID)
                              }
                              style={{
                                ...btnSmall("orange"),
                                padding: "5px 10px",
                              }}
                            >
                              Reagendar
                            </button>
                            <button
                              onClick={() => cancelarConsulta(c.Consulta_ID)}
                              style={{
                                ...btnSmall("red"),
                                padding: "5px 10px",
                              }}
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {c.Pgto_ID && (
                      <div style={{ color: "green", fontWeight: "bold" }}>
                        ✓ Finalizada (Clique para ver)
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* PAINEL DIREITO: FINALIZAÇÃO OU VISUALIZAÇÃO */}
              <div>
                {consultaSelecionada &&
                  !reagendandoConsulta &&
                  (() => {
                    const detalhes = consultas.find(
                      (c) => c.Consulta_ID === consultaSelecionada
                    );
                    // --- MODO LEITURA (CONSULTA FINALIZADA) ---
                    if (detalhes?.Pgto_ID) {
                      return (
                        <div
                          style={{
                            background: "#f9f9f9",
                            padding: "20px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        >
                          <h3>Consulta #{consultaSelecionada} - Detalhes</h3>
                          <div
                            style={{
                              marginBottom: "15px",
                              padding: "10px",
                              background: "#e8f5e9",
                              color: "green",
                              borderRadius: "5px",
                              border: "1px solid #c8e6c9",
                            }}
                          >
                            <strong>✅ Concluída</strong>
                          </div>
                          <p>
                            <strong>Valor Pago:</strong> R$ {detalhes.Valor} (
                            {detalhes.Metodo})
                          </p>
                          <hr
                            style={{ borderColor: "#ddd", margin: "15px 0" }}
                          />
                          <p>
                            <strong>💊 Receita Médica:</strong>
                          </p>
                          <ul
                            style={{
                              background: "#fff",
                              padding: "15px 15px 15px 30px",
                              borderRadius: "5px",
                              border: "1px solid #eee",
                            }}
                          >
                            {detalhes.ReceitaCompleta ? (
                              detalhes.ReceitaCompleta.split("; ").map(
                                (item, i) => (
                                  <li key={i} style={{ marginBottom: "5px" }}>
                                    {item}
                                  </li>
                                )
                              )
                            ) : (
                              <li>Nenhuma prescrição registrada.</li>
                            )}
                          </ul>
                          <button
                            onClick={() => setConsultaSelecionada(null)}
                            style={{ ...btnPrimary, background: "#7f8c8d" }}
                          >
                            Fechar
                          </button>
                        </div>
                      );
                    } else {
                      // --- MODO EDIÇÃO (CONSULTA PENDENTE) ---
                      return (
                        <div
                          style={{
                            background: "#f9f9f9",
                            padding: "20px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        >
                          <h3>Finalizar #{consultaSelecionada}</h3>
                          <form onSubmit={finalizarAtendimento}>
                            <h4>💰 Pagamento</h4>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <input
                                type="number"
                                placeholder="Valor"
                                style={inputStyle}
                                onChange={(e) =>
                                  setFormFinalizar({
                                    ...formFinalizar,
                                    valor: e.target.value,
                                  })
                                }
                                required
                              />
                              <select
                                style={inputStyle}
                                onChange={(e) =>
                                  setFormFinalizar({
                                    ...formFinalizar,
                                    metodo: e.target.value,
                                  })
                                }
                              >
                                <option>Dinheiro</option>
                                <option>Cartão Crédito</option>
                                <option>Pix</option>
                              </select>
                            </div>
                            <div
                              style={{
                                marginTop: "25px",
                                marginBottom: "10px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: "2px solid #3498db",
                                paddingBottom: "5px",
                              }}
                            >
                              <h4 style={{ margin: 0, color: "#34495e" }}>
                                💊 Prescrição
                              </h4>
                              <button
                                type="button"
                                onClick={handleAddMedicamento}
                                style={{
                                  padding: "5px 12px",
                                  background: "#3498db",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "20px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                + Adicionar Remédio
                              </button>
                            </div>
                            {formFinalizar.medicamentos.map((med, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  gap: "5px",
                                  marginBottom: "5px",
                                  background: "#eee",
                                  padding: "10px",
                                  borderRadius: "5px",
                                  alignItems: "center",
                                }}
                              >
                                <input
                                  placeholder="Medicamento"
                                  value={med.nome}
                                  onChange={(e) =>
                                    handleChangeMedicamento(
                                      i,
                                      "nome",
                                      e.target.value
                                    )
                                  }
                                  style={{ ...inputStyle, marginBottom: 0 }}
                                  required
                                />
                                <input
                                  placeholder="Dose"
                                  value={med.dosagem}
                                  onChange={(e) =>
                                    handleChangeMedicamento(
                                      i,
                                      "dosagem",
                                      e.target.value
                                    )
                                  }
                                  style={{ ...inputStyle, marginBottom: 0 }}
                                  required
                                />
                                {i > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMedicamento(i)}
                                    style={{
                                      background: "#e74c3c",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "50%",
                                      width: "30px",
                                      height: "30px",
                                      cursor: "pointer",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="submit"
                              style={{
                                ...btnPrimary,
                                background: "#27ae60",
                                marginTop: "20px",
                              }}
                            >
                              Finalizar Atendimento
                            </button>
                          </form>
                        </div>
                      );
                    }
                  })()}
                {!consultaSelecionada && !reagendandoConsulta && (
                  <div
                    style={{
                      color: "#aaa",
                      textAlign: "center",
                      marginTop: "50px",
                    }}
                  >
                    Selecione uma consulta pendente ao lado.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ESTILOS AUXILIARES
const btnMenu = (ativo) => ({
  background: ativo ? "#34495e" : "transparent",
  color: "#fff",
  border: "none",
  padding: "15px",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "16px",
  borderRadius: "5px",
  marginBottom: "5px",
  width: "100%",
});
const cardStyle = {
  background: "#fff",
  padding: "30px",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};
const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "5px",
  border: "1px solid #ddd",
  boxSizing: "border-box",
};
const btnPrimary = {
  padding: "10px",
  width: "100%",
  border: "none",
  borderRadius: "5px",
  background: "#3498db",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
};
const btnSmall = (cor) => ({
  background: cor,
  color: "#fff",
  border: "none",
  borderRadius: "3px",
  cursor: "pointer",
  padding: "5px 8px",
  fontSize: "12px",
});
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "15px",
};
const badgeStyle = {
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
  display: "inline-block",
};

export default App;
