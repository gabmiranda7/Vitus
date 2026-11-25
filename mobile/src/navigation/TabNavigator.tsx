import React from "react";
import { TouchableOpacity, Image, useColorScheme } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AprovacoesScreen from "../screens/aprovacoes/AprovacoesScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import ConsultasScreen from "../screens/consultas/ConsultasScreen";
import ProntuarioStack from "./ProntuarioStack";
import PacientesScreen from "../screens/pacientes/PacientesScreen";
import PerfilScreen from "../screens/perfil/PerfilScreen";
import { useAuth } from "../contexts/AuthContext";
import AvatarUsuario from "../components/AvatarUsuario";
import AgendaScreen from "../screens/agenda/AgendaScreen";
import MedicosScreen from "../screens/medicos/MedicosScreen";
import ReceitasStack from "./ReceitasStack";
import AuditoriaScreen from "../screens/auditoria/AuditoriaScreen";
import TriagemScreen from "../screens/triagem/TriagemScreen";
import { cores } from "../theme";

const Tab = createBottomTabNavigator();

// Logo no canto esquerdo do cabeçalho: leva à tela inicial do perfil.
function LogoInicio({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ir para a tela inicial"
      style={{ marginLeft: 12 }}
    >
      <Image
        source={require("../../assets/icon.png")}
        style={{ width: 30, height: 30, borderRadius: 8 }}
      />
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  const { usuario } = useAuth();
  const isDark = useColorScheme() === "dark";

  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: isDark ? "#0d47a1" : cores.primaria },
        headerTintColor: "#fff",
        tabBarActiveTintColor: isDark ? cores.primariaClara : cores.primaria,
        tabBarInactiveTintColor: isDark
          ? cores.textoSecundarioEscuro
          : cores.textoSecundario,
        tabBarStyle: {
          backgroundColor: isDark ? cores.superficieEscura : cores.superficie,
          borderTopColor: isDark ? "#253140" : "#d3dce6",
        },
        headerLeft: () => (
          <LogoInicio onPress={() => navigation.navigate("Dashboard")} />
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate("Perfil")}
            style={{ marginRight: 12 }}
          >
            <AvatarUsuario size={32} cor="rgba(255,255,255,0.25)" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {usuario?.perfil === "Medico" && (
        <Tab.Screen
          name="Agenda"
          component={AgendaScreen}
          options={{
            title: "Minha Agenda",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="calendar-today"
                color={color}
                size={size}
              />
            ),
          }}
        />
      )}

      {usuario?.perfil === "Administrador" && (
        <Tab.Screen
          name="Auditoria"
          component={AuditoriaScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="shield-search"
                color={color}
                size={size}
              />
            ),
          }}
        />
      )}

      {usuario?.perfil === "Administrador" && (
        <Tab.Screen
          name="Aprovacoes"
          component={AprovacoesScreen}
          options={{
            title: "Aprovações",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-check"
                color={color}
                size={size}
              />
            ),
          }}
        />
      )}

      {usuario?.perfil !== "Administrador" && (
        <Tab.Screen
          name="Consultas"
          component={ConsultasScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="calendar-clock"
                color={color}
                size={size}
              />
            ),
          }}
        />
      )}

      {usuario?.perfil === "Recepcionista" && (
        <Tab.Screen
          name="Pacientes"
          component={PacientesScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-multiple"
                color={color}
                size={size}
              />
            ),
          }}
        />
      )}

      {usuario?.perfil === "Recepcionista" && (
        <Tab.Screen
          name="Medicos"
          component={MedicosScreen}
          options={{
            title: "Médicos",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="doctor" color={color} size={size} />
            ),
          }}
        />
      )}

      {usuario?.perfil === "Enfermeiro" && (
        <Tab.Screen
          name="Triagem"
          component={TriagemScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="stethoscope"
                color={color}
                size={size}
              />
            ),
          }}
        />
      )}

      {(usuario?.perfil === "Medico" || usuario?.perfil === "Enfermeiro") && (
        <Tab.Screen
          name="Prontuarios"
          component={ProntuarioStack}
          options={{
            headerShown: false,
            title: "Prontuários",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="folder-account"
                color={color}
                size={size}
              />
            ),
          }}
        />
      )}

      {usuario?.perfil === "Medico" && (
        <Tab.Screen
          name="Receitas"
          component={ReceitasStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="pill" color={color} size={size} />
            ),
          }}
        />
      )}

      {/* Rota oculta na barra inferior — acessada pelo avatar no canto superior direito */}
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
          headerRight: () => null,
        }}
      />
    </Tab.Navigator>
  );
}
