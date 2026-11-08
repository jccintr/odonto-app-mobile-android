import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarDays, ClipboardList, UserRound, Users } from 'lucide-react-native';
import { Loading, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AccountScreen from '../screens/AccountScreen';
import AgendaScreen, { AppointmentScreen } from '../screens/AgendaScreen';
import BudgetScreen from '../screens/BudgetScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import LoginScreen from '../screens/LoginScreen';
import NewBudgetScreen from '../screens/NewBudgetScreen';
import { NotDentistScreen, SuspendedScreen } from '../screens/NoticeScreens';
import PatientScreen from '../screens/PatientScreen';
import PatientsScreen from '../screens/PatientsScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const TAB_ICONS = { Agenda: CalendarDays, Pacientes: Users, Orçamentos: ClipboardList, Conta: UserRound };

function MainTabs() {
  const { c } = useTheme();
  return (
    <Tabs.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: c.primary,
      tabBarInactiveTintColor: c.muted,
      tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
      tabBarIcon: ({ color, size }) => { const Icon = TAB_ICONS[route.name]; return <Icon color={color} size={size} />; },
    })}>
      <Tabs.Screen name="Agenda" component={AgendaScreen} />
      <Tabs.Screen name="Pacientes" component={PatientsScreen} />
      <Tabs.Screen name="Orçamentos" component={BudgetsScreen} />
      <Tabs.Screen name="Conta" component={AccountScreen} />
    </Tabs.Navigator>
  );
}

export default function Navigation() {
  const { c, isDark } = useTheme();
  const { user, booting, isDentist, suspended } = useAuth();
  const base = isDark ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: c.primary, background: c.bg, card: c.surface, text: c.text, border: c.border } };

  if (booting) return <Screen><Loading /></Screen>;

  let content;
  if (!user) content = <Stack.Screen name="Login" component={LoginScreen} />;
  else if (!isDentist) content = <Stack.Screen name="NotDentist" component={NotDentistScreen} />;
  else if (suspended) content = <Stack.Screen name="Suspended" component={SuspendedScreen} />;
  else {
    content = (
      <>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Appointment" component={AppointmentScreen} options={{ headerShown: true, title: 'Atendimento' }} />
        <Stack.Screen name="Patient" component={PatientScreen} options={({ route }) => ({ headerShown: true, title: route.params?.name ?? 'Paciente' })} />
        <Stack.Screen name="Budget" component={BudgetScreen} options={{ headerShown: true, title: 'Orçamento' }} />
        <Stack.Screen name="NewBudget" component={NewBudgetScreen} options={{ headerShown: true, title: 'Novo orçamento' }} />
      </>
    );
  }
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>{content}</Stack.Navigator>
    </NavigationContainer>
  );
}
