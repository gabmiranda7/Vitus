import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Alert, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Layout from "../../components/layout/Layout";
import api from "../../services/api";
import ProntuarioConteudo from "../../components/prontuario/ProntuarioConteudo";
import { Prontuario, Paciente, Exame } from "../../types";

export default function ProntuarioPacientePage(): React.ReactElement {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [exames, setExames] = useState<Exame[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (pacienteId) carregar();
  }, [pacienteId]);

  async function carregar() {
    try {
      const rProntuario = await api.get(
        `/api/prontuarios/paciente/${pacienteId}`,
      );
      setProntuario(rProntuario.data);
      const pacienteIdDoProntuario = rProntuario.data.pacienteId;
      if (pacienteIdDoProntuario) {
        const rPaciente = await api.get(
          `/api/Paciente/${pacienteIdDoProntuario}`,
        );
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
          onClick={() => navigate("/prontuarios")}
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
        onExamesAtualizados={() => carregarExames(prontuario.id)}
      />
    </Layout>
  );
}
