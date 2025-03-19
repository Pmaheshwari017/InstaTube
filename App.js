import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import Navigation from "./Navigation/Navigation.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useThemeStore from "./store/themeStore"; // Import the theme store

const queryClient = new QueryClient();

export default function App() {
  const { theme } = useThemeStore(); // Get the current theme

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer theme={theme === "light" ? DefaultTheme : DarkTheme}>
        <Navigation />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
