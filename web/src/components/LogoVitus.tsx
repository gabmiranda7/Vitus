import { Box } from "@mui/material";
import logo from "../assets/logo.svg";

interface Props {
  size?: number;
}

export default function LogoVitus({ size = 72 }: Props) {
  return (
    <Box
      component="img"
      src={logo}
      alt="Vitus"
      sx={{
        width: size,
        height: size,
        borderRadius: `${Math.round(size * 0.24)}px`,
        objectFit: "contain",
        bgcolor: "#fefeff",
        boxShadow: "0 6px 20px rgba(3, 86, 209, 0.25)",
      }}
    />
  );
}
