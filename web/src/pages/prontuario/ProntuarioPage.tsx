import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography, Alert, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Layout from "../../components/layout/Layout";
import api from "../../services/api";
import ProntuarioConteudo from "../../components/prontuario/ProntuarioConteudo";
import { Prontuario, Paciente, Exame } from "../../types";

export default function ProntuarioPage(): React.ReactElement {
  const { consultaId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const abrirEmExames = searchParams.get("aba") === "exames";

  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [exames, setExames] = useState<Exame[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (consultaId) carregar();
  }, [consultaId]);

  async function carregar() {
    try {
      const rProntuario = await api.get(
        `/api/prontuarios/consulta/${consultaId}`,
      );
      setProntuario(rProntuario.data);
      const pacienteId = rProntuario.data.pacienteId;
      if (pacienteId) {
        const rPaciente = await api.get(`/api/Paciente/${pacienteId}`);
        setPaciente(rPaciente.data);
      }
      await carregarExames(rProntuario.data.id);
    } catch {
      setErro("Erro ao carregar prontuário");
    }
  }

  async function carregarExames(prontuarioId: string) {
    try {
      const r = await api.get(`/api/exames/prontuario/${prontuarioId}`);
      setExames(r.data);
    } catch {
      /* silencioso */
    }
  }

  if (erro)
    return (
      <Layout>
        <Alert severity="error">{erro}</Alert>
      </Layout>
    );
  if (!prontuario)
    return (
      <Layout>
        <Typography color="text.secondary">Carregando...</Typography>
      </Layout>
    );

  return (
    <Layout>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/consultas")}
          variant="outlined"
          size="small"
        >
          Voltar
        </Button>
      </Box>

      <ProntuarioConteudo
        prontuario={prontuario}
        paciente={paciente}
        exames={exames}
        consultaId={consultaId}
        abaInicial={abrirEmExames ? 4 : 1}
        abrirNovoExame={abrirEmExames}
        onExamesAtualizados={() => carregarExames(prontuario.id)}
      />
    </Layout>
  );
}
