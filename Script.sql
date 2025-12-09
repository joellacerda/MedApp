-- =======================================================================================
-- PROJETO FINAL - SISTEMA DE GESTÃO CLÍNICA
-- Alunos: Eduardo Perotti, Joel Lacerda e Marcus Vinícius
-- Disciplina: Banco de Dados
-- Descrição: Script único contendo DDL, DML, DQL e Requisitos Avançados (Triggers, Views).
-- =======================================================================================

-- =======================================================================================
-- 1. ESTRUTURA (DDL) - CRIAÇÃO DO BANCO E TABELAS
-- =======================================================================================

DROP DATABASE IF EXISTS ClinicaDB;
CREATE DATABASE ClinicaDB;
USE ClinicaDB;

-- Tabela: ESPECIALIDADE (Simples)
CREATE TABLE ESPECIALIDADE (
    Espec_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL
);

-- Tabela: PACIENTE (Superclasse)
CREATE TABLE PACIENTE (
    Paciente_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    CPF CHAR(11) NOT NULL UNIQUE,
    Telefone VARCHAR(20)
);

-- Tabela: MEDICO (1:N com Especialidade)
CREATE TABLE MEDICO (
    Medico_ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    CRM VARCHAR(20) NOT NULL UNIQUE,
    Espec_ID INT NOT NULL,
    FOREIGN KEY (Espec_ID) REFERENCES ESPECIALIDADE(Espec_ID)
);

-- Tabela: PACIENTE_CONVENIADO (Subclasse 1:1)
CREATE TABLE PACIENTE_CONVENIADO (
    Paciente_ID INT PRIMARY KEY,
    Num_Carteira VARCHAR(50) NOT NULL,
    Nome_Convenio VARCHAR(50) NOT NULL,
    FOREIGN KEY (Paciente_ID) REFERENCES PACIENTE(Paciente_ID) ON DELETE CASCADE
);

-- Tabela: PACIENTE_PARTICULAR (Subclasse 1:1)
CREATE TABLE PACIENTE_PARTICULAR (
    Paciente_ID INT PRIMARY KEY,
    Limite_Credito DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (Paciente_ID) REFERENCES PACIENTE(Paciente_ID) ON DELETE CASCADE
);

-- Tabela: DEPENDENTE (Entidade Fraca)
CREATE TABLE DEPENDENTE (
    Paciente_ID INT NOT NULL,
    Nome_Dependente VARCHAR(100) NOT NULL,
    Data_Nascimento DATE NOT NULL,
    PRIMARY KEY (Paciente_ID, Nome_Dependente),
    FOREIGN KEY (Paciente_ID) REFERENCES PACIENTE(Paciente_ID) ON DELETE CASCADE
);

-- Tabela: CONSULTA (Entidade Associativa N:N / Ternária implícita no contexto)
-- REQUISITO ATENDIDO: Atributo com valor padrão (DEFAULT)
CREATE TABLE CONSULTA (
    Consulta_ID INT AUTO_INCREMENT PRIMARY KEY,
    Data_Hora DATETIME NOT NULL,
    Sala VARCHAR(10) DEFAULT 'Recepção', -- Define valor padrão se não informado
    Medico_ID INT NOT NULL,
    Paciente_ID INT NOT NULL,
    FOREIGN KEY (Medico_ID) REFERENCES MEDICO(Medico_ID),
    FOREIGN KEY (Paciente_ID) REFERENCES PACIENTE(Paciente_ID)
);

-- Tabela: PAGAMENTO (1:1 com Consulta)
CREATE TABLE PAGAMENTO (
    Pgto_ID INT AUTO_INCREMENT PRIMARY KEY,
    Valor DECIMAL(10, 2) NOT NULL,
    Metodo VARCHAR(30) NOT NULL,
    Consulta_ID INT NOT NULL UNIQUE,
    FOREIGN KEY (Consulta_ID) REFERENCES CONSULTA(Consulta_ID) ON DELETE CASCADE
);

-- Tabela: PRESCRICAO (1:N com Consulta)
CREATE TABLE PRESCRICAO (
    Presc_ID INT AUTO_INCREMENT PRIMARY KEY,
    Medicamento VARCHAR(100) NOT NULL,
    Dosagem VARCHAR(100) NOT NULL,
    Consulta_ID INT NOT NULL,
    FOREIGN KEY (Consulta_ID) REFERENCES CONSULTA(Consulta_ID) ON DELETE CASCADE
);


-- =======================================================================================
-- 2. GATILHOS (TRIGGERS) - REQUISITO AVANÇADO
-- =======================================================================================

-- REQUISITO: Gatilho acionado em operação de atualização ou inserção
-- Descrição: Impede que um pagamento seja registrado com valor zero ou negativo.
DELIMITER $$

CREATE TRIGGER trg_ValidarPagamento
BEFORE INSERT ON PAGAMENTO
FOR EACH ROW
BEGIN
    IF NEW.Valor <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Erro de Regra de Negócio: O valor do pagamento deve ser maior que zero.';
    END IF;
END $$

DELIMITER ;


-- =======================================================================================
-- 3. CARGA DE DADOS (DML) - INSERTS INICIAIS
-- =======================================================================================

-- Inserindo Especialidades
INSERT INTO ESPECIALIDADE (Nome) VALUES ('Cardiologia'), ('Pediatria'), ('Ortopedia');

-- Inserindo Médicos
INSERT INTO MEDICO (Nome, CRM, Espec_ID) VALUES
('Dr. House', 'CRM12345', 1),
('Dra. Grey', 'CRM67890', 2),
('Dr. Estranho', 'CRM11122', 3);

-- Inserindo Pacientes
INSERT INTO PACIENTE (Nome, CPF, Telefone) VALUES
('João da Silva', '11122233344', '(11) 99999-0001'),
('Maria Souza', '55566677788', '(21) 98888-0002'),
('Carlos Oliveira', '99900011122', '(31) 97777-0003');

-- Especializando Pacientes
INSERT INTO PACIENTE_CONVENIADO (Paciente_ID, Num_Carteira, Nome_Convenio) VALUES (1, 'UNIMED-999', 'Unimed');
INSERT INTO PACIENTE_PARTICULAR (Paciente_ID, Limite_Credito) VALUES (2, 5000.00), (3, 1000.00);

-- Inserindo Dependentes
INSERT INTO DEPENDENTE (Paciente_ID, Nome_Dependente, Data_Nascimento) VALUES (1, 'Joãozinho Jr', '2015-05-10');

-- Inserindo Consultas
INSERT INTO CONSULTA (Data_Hora, Sala, Medico_ID, Paciente_ID) VALUES
('2025-11-25 10:00:00', '101', 1, 1),
('2025-11-25 11:30:00', '202', 2, 2),
('2025-12-01 09:00:00', DEFAULT, 3, 3); -- Testando o DEFAULT 'Recepção'

-- Inserindo Pagamentos
INSERT INTO PAGAMENTO (Valor, Metodo, Consulta_ID) VALUES
(50.00, 'Boleto', 1),
(350.00, 'Cartão Crédito', 2);

-- Inserindo Prescrições
INSERT INTO PRESCRICAO (Medicamento, Dosagem, Consulta_ID) VALUES
('Aspirina', '1 comprimido a cada 8h', 1),
('Vitamina C', '1 drágea por dia', 1);


-- =======================================================================================
-- 4. OPERAÇÕES CRUD BÁSICAS (DML)
-- =======================================================================================

-- 4.1. INSERÇÃO (INSERT) - Novo Médico
INSERT INTO MEDICO (Nome, CRM, Espec_ID) VALUES ('Dr. Bruce Banner', 'CRM99988', 1);

-- 4.2. ATUALIZAÇÃO (UPDATE) - Alterar telefone do paciente
UPDATE PACIENTE SET Telefone = '(11) 97777-1234' WHERE Nome LIKE 'João%';

-- 4.3. REMOÇÃO (DELETE) - Remover Paciente Carlos (ID 3)
-- Graças ao ON DELETE CASCADE definido nas tabelas filhas, isso removerá dependências
DELETE FROM PACIENTE WHERE Paciente_ID = 3;

-- 4.4. LEITURA (SELECT SIMPLES) - Listar todos os médicos
SELECT * FROM MEDICO;


-- =======================================================================================
-- 5. CONSULTAS AVANÇADAS E RELATÓRIOS (DQL)
-- =======================================================================================

-- RELATÓRIO 1: Agenda Médica Completa (JOINs)
SELECT
    c.Data_Hora,
    m.Nome AS Medico,
    e.Nome AS Especialidade,
    p.Nome AS Paciente,
    c.Sala
FROM CONSULTA c
JOIN MEDICO m ON c.Medico_ID = m.Medico_ID
JOIN ESPECIALIDADE e ON m.Espec_ID = e.Espec_ID
JOIN PACIENTE p ON c.Paciente_ID = p.Paciente_ID
ORDER BY c.Data_Hora;

-- RELATÓRIO 2: Faturamento Detalhado
SELECT
    p.Nome AS Paciente,
    pg.Metodo,
    pg.Valor
FROM PAGAMENTO pg
JOIN CONSULTA c ON pg.Consulta_ID = c.Consulta_ID
JOIN PACIENTE p ON c.Paciente_ID = p.Paciente_ID;

-- REQUISITO: Consulta com GROUP BY e HAVING
-- Objetivo: Listar métodos de pagamento que geraram mais de 100 reais no total
SELECT
    Metodo,
    SUM(Valor) as Total_Arrecadado
FROM PAGAMENTO
GROUP BY Metodo
HAVING Total_Arrecadado > 100;

-- REQUISITO: Consulta com Quantificadores (ALL)
-- Objetivo: Listar consultas cujo valor pago é MAIOR que TODOS os pagamentos feitos em 'Boleto'
SELECT c.Consulta_ID, c.Data_Hora, pg.Valor
FROM CONSULTA c
JOIN PAGAMENTO pg ON c.Consulta_ID = pg.Consulta_ID
WHERE pg.Valor > ALL (
    SELECT Valor FROM PAGAMENTO WHERE Metodo = 'Boleto'
);

-- REQUISITO: Consulta com Quantificadores (ANY)
-- Objetivo: Listar médicos que possuem ALGUMA consulta agendada
SELECT Nome
FROM MEDICO
WHERE Medico_ID = ANY (
    SELECT Medico_ID FROM CONSULTA
);

-- REQUISITO: Busca com Substring (LIKE) e Case Insensitive
SELECT * FROM PACIENTE
WHERE Nome LIKE '%silva%';
