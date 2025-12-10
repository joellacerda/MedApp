-- =======================================================================================
-- PROJETO FINAL - SISTEMA DE GESTÃO CLÍNICA
-- Alunos: Eduardo Perotti, Joel Lacerda e Marcus Vinícius
-- Disciplina: Banco de Dados
-- Descrição: Script Completo (DDL, DML, DQL) atendendo a todos os requisitos do PDF.
-- =======================================================================================

-- =======================================================================================
-- 1. ESTRUTURA (DDL) - CRIAÇÃO DO BANCO E TABELAS
-- =======================================================================================

DROP DATABASE IF EXISTS ClinicaDB;
CREATE DATABASE ClinicaDB;
USE ClinicaDB;

-- Tabela: ESPECIALIDADE
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

-- Tabela: MEDICO (Relacionamento 1:N com Especialidade)
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

-- Tabela: CONSULTA (Entidade Associativa)
-- REQUISITO: Atributo com valor padrão (DEFAULT 'Recepção')
CREATE TABLE CONSULTA (
    Consulta_ID INT AUTO_INCREMENT PRIMARY KEY,
    Data_Hora DATETIME NOT NULL,
    Sala VARCHAR(10) DEFAULT 'Recepção',
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
-- 2. GATILHOS (TRIGGERS)
-- =======================================================================================

-- REQUISITO: Gatilho em operação de inserção/atualização
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
-- 3. CARGA DE DADOS (DML)
-- =======================================================================================

INSERT INTO ESPECIALIDADE (Nome) VALUES ('Cardiologia'), ('Pediatria'), ('Ortopedia');

INSERT INTO MEDICO (Nome, CRM, Espec_ID) VALUES
('Dr. House', 'CRM12345', 1), ('Dra. Grey', 'CRM67890', 2), ('Dr. Estranho', 'CRM11122', 3);

INSERT INTO PACIENTE (Nome, CPF, Telefone) VALUES
('João da Silva', '11122233344', '(11) 99999-0001'),
('Maria Souza', '55566677788', '(21) 98888-0002'),
('Carlos Oliveira', '99900011122', '(31) 97777-0003'),
('Ana Sem Convenio', '88888888888', '(85) 99999-9999');

INSERT INTO PACIENTE_CONVENIADO (Paciente_ID, Num_Carteira, Nome_Convenio) VALUES (1, 'UNIMED-999', 'Unimed');
INSERT INTO PACIENTE_PARTICULAR (Paciente_ID, Limite_Credito) VALUES (2, 5000.00), (3, 1000.00), (4, 500.00);

INSERT INTO DEPENDENTE (Paciente_ID, Nome_Dependente, Data_Nascimento) VALUES (1, 'Joãozinho Jr', '2015-05-10');

INSERT INTO CONSULTA (Data_Hora, Sala, Medico_ID, Paciente_ID) VALUES
('2025-11-25 10:00:00', '101', 1, 1),
('2025-11-25 11:30:00', '202', 2, 2),
('2025-12-01 09:00:00', DEFAULT, 3, 3);

INSERT INTO PAGAMENTO (Valor, Metodo, Consulta_ID) VALUES (50.00, 'Boleto', 1), (350.00, 'Cartão Crédito', 2);

INSERT INTO PRESCRICAO (Medicamento, Dosagem, Consulta_ID) VALUES ('Aspirina', '1 a cada 8h', 1);


-- =======================================================================================
-- 4. CONSULTAS AVANÇADAS (ATENDENDO AOS REQUISITOS DO PDF)
-- =======================================================================================

-- ---------------------------------------------------------------------------------------
-- REQUISITO: Consultas com JOIN (Pelo menos 2 tipos diferentes)
-- ---------------------------------------------------------------------------------------

-- TIPO 1: INNER JOIN (Mostra apenas dados que têm correspondência nas duas tabelas)
-- Cenário: Relatório completo de consultas agendadas
SELECT
    c.Data_Hora, m.Nome AS Medico, p.Nome AS Paciente
FROM CONSULTA c
JOIN MEDICO m ON c.Medico_ID = m.Medico_ID    -- INNER JOIN Implícito ou Explícito
JOIN PACIENTE p ON c.Paciente_ID = p.Paciente_ID;

-- TIPO 2: LEFT JOIN (Mostra todos da tabela da esquerda, mesmo sem correspondência na direita)
-- Cenário: Listagem geral de pacientes e seus convênios (se tiverem). Se for Particular, o convênio vem NULL.
SELECT
    p.Nome,
    p.CPF,
    pc.Nome_Convenio
FROM PACIENTE p
LEFT JOIN PACIENTE_CONVENIADO pc ON p.Paciente_ID = pc.Paciente_ID;


-- ---------------------------------------------------------------------------------------
-- REQUISITO: Consultas com Agrupamento (Pelo menos 2 consultas com GROUP BY)
-- ---------------------------------------------------------------------------------------

-- CONSULTA 1 (Simples): Contagem de médicos por especialidade
SELECT
    e.Nome as Especialidade,
    COUNT(m.Medico_ID) as Qtd_Medicos
FROM ESPECIALIDADE e
JOIN MEDICO m ON e.Espec_ID = m.Espec_ID
GROUP BY e.Nome;

-- CONSULTA 2 (Com HAVING): Faturamento total por método de pagamento (Exibindo apenas métodos que renderam > 100)
SELECT
    Metodo,
    SUM(Valor) as Total_Arrecadado
FROM PAGAMENTO
GROUP BY Metodo
HAVING Total_Arrecadado > 100;


-- ---------------------------------------------------------------------------------------
-- REQUISITO: Consultas com Quantificadores (ANY e ALL)
-- ---------------------------------------------------------------------------------------

-- QUANTIFICADOR ALL:
-- Cenário: Encontrar consultas cujo valor pago seja MAIOR que TODOS os pagamentos feitos via 'Boleto'.
-- (Ou seja, consultas "VIP" mais caras que qualquer boleto já registrado).
SELECT c.Consulta_ID, pg.Valor
FROM CONSULTA c
JOIN PAGAMENTO pg ON c.Consulta_ID = pg.Consulta_ID
WHERE pg.Valor > ALL (
    SELECT Valor FROM PAGAMENTO WHERE Metodo = 'Boleto'
);

-- QUANTIFICADOR ANY:
-- Cenário: Listar médicos que possuem ALGUMA (Pelo menos uma) consulta agendada.
SELECT Nome
FROM MEDICO
WHERE Medico_ID = ANY (
    SELECT Medico_ID FROM CONSULTA
);


-- ---------------------------------------------------------------------------------------
-- REQUISITO: Ordenação (ASC e DESC)
-- ---------------------------------------------------------------------------------------

-- ORDENAÇÃO ASCENDENTE (Padrão: A-Z)
SELECT Nome, CRM FROM MEDICO ORDER BY Nome ASC;

-- ORDENAÇÃO DESCENDENTE (Z-A ou Maior para Menor)
-- Cenário: Listar consultas da mais recente para a mais antiga
SELECT Data_Hora, Sala FROM CONSULTA ORDER BY Data_Hora DESC;
